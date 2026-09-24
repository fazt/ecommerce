/**
 * Order service. Status transitions, refunds, tracking.
 */

import { prisma } from '../prisma';
import { stripe } from '../stripe';
import { NotFoundError, ValidationError } from '../errors';
import { writeAudit } from '../audit';
import { restock } from '../inventory';
import { sendEmail, emailTemplates } from '../email';
import type { OrderStatusUpdateInput, TrackingUpdateInput, RefundCreateInput } from '../validators/admin';
import type { OrderStatus } from '@prisma/client';

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['PAID', 'CANCELED', 'FAILED'],
  PAID: ['PROCESSING', 'SHIPPED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'CANCELED'],
  PROCESSING: ['SHIPPED', 'REFUNDED', 'CANCELED'],
  SHIPPED: ['DELIVERED', 'REFUNDED', 'PARTIALLY_REFUNDED'],
  DELIVERED: ['REFUNDED', 'PARTIALLY_REFUNDED'],
  CANCELED: [],
  REFUNDED: [],
  PARTIALLY_REFUNDED: ['REFUNDED'],
  FAILED: [],
};

export async function getOrderById(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { product: { include: { images: { take: 1, orderBy: { position: 'asc' } } } } } },
      refunds: true,
      user: { select: { id: true, email: true, name: true } },
    },
  });
}

export async function getOrderByNumber(orderNumber: string, userId?: string) {
  const where: import('@prisma/client').Prisma.OrderWhereInput = { orderNumber };
  if (userId) where.userId = userId;
  return prisma.order.findFirst({
    where,
    include: {
      items: true,
      refunds: true,
    },
  });
}

export async function getOrderByStripeSession(sessionId: string) {
  return prisma.order.findUnique({
    where: { stripeSessionId: sessionId },
    select: { id: true, orderNumber: true, status: true, totalCents: true, currency: true },
  });
}

export async function listOrdersForUser(userId: string, page = 1, pageSize = 20) {
  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalCents: true,
        currency: true,
        createdAt: true,
        paidAt: true,
      },
    }),
    prisma.order.count({ where: { userId } }),
  ]);
  return { items, total, page, pageSize };
}

export async function updateOrderStatus(
  orderId: string,
  input: OrderStatusUpdateInput,
  actorId: string,
  ipAddress?: string,
  userAgent?: string,
) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError('Order');
  const allowed = VALID_TRANSITIONS[order.status] ?? [];
  if (!allowed.includes(input.status as OrderStatus)) {
    throw new ValidationError(`Cannot transition ${order.status} → ${input.status}`);
  }
  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: input.status },
  });
  await writeAudit({
    userId: actorId,
    action: 'order.status_changed',
    entity: 'Order',
    entityId: orderId,
    changes: { from: order.status, to: input.status },
    ipAddress,
    userAgent,
  });
  return updated;
}

export async function updateTracking(
  orderId: string,
  input: TrackingUpdateInput,
  actorId: string,
  ipAddress?: string,
  userAgent?: string,
) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError('Order');
  const trackingUrl =
    input.trackingUrl ?? defaultTrackingUrl(input.carrierName, input.trackingNumber);
  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      carrierName: input.carrierName,
      trackingNumber: input.trackingNumber,
      trackingUrl,
      status: order.status === 'PAID' || order.status === 'PROCESSING' ? 'SHIPPED' : order.status,
      shippedAt: new Date(),
    },
  });
  await writeAudit({
    userId: actorId,
    action: 'order.tracking_updated',
    entity: 'Order',
    entityId: orderId,
    changes: { carrierName: input.carrierName, trackingNumber: input.trackingNumber },
    ipAddress,
    userAgent,
  });
  // Fire-and-forget shipment email
  void sendEmail({
    to: order.email,
    ...emailTemplates.shipmentNotification(
      order.orderNumber,
      input.carrierName,
      input.trackingNumber,
      'en',
    ),
  });
  return updated;
}

function defaultTrackingUrl(carrier: string, tracking: string): string {
  const map: Record<string, string> = {
    ups: `https://www.ups.com/track?tracknum=${encodeURIComponent(tracking)}`,
    usps: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(tracking)}`,
    fedex: `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(tracking)}`,
    dhl: `https://www.dhl.com/en/express/tracking.html?AWB=${encodeURIComponent(tracking)}`,
  };
  const key = carrier.toLowerCase();
  return map[key] ?? `https://example.com/track/${encodeURIComponent(tracking)}`;
}

export async function refundOrder(
  orderId: string,
  input: RefundCreateInput,
  actorId: string,
  ipAddress?: string,
  userAgent?: string,
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { refunds: true },
  });
  if (!order) throw new NotFoundError('Order');
  if (!order.stripePaymentIntentId) throw new ValidationError('Order has no Stripe payment intent');
  const alreadyRefunded = order.refunds
    .filter((r) => r.status === 'succeeded' || r.status === 'pending')
    .reduce((acc, r) => acc + r.amountCents, 0);
  if (alreadyRefunded + input.amountCents > order.totalCents) {
    throw new ValidationError('Refund amount exceeds remaining balance');
  }

  const stripeRefund = await stripe.refunds.create({
    payment_intent: order.stripePaymentIntentId,
    amount: input.amountCents,
    reason: input.reason ? 'requested_by_customer' : undefined,
    metadata: { orderId, orderNumber: order.orderNumber },
  });

  const refund = await prisma.refund.create({
    data: {
      orderId,
      stripeRefundId: stripeRefund.id,
      amountCents: input.amountCents,
      reason: input.reason ?? null,
      status: stripeRefund.status ?? 'pending',
    },
  });

  const totalRefunded = alreadyRefunded + input.amountCents;
  const newStatus: OrderStatus =
    totalRefunded >= order.totalCents ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
  await prisma.order.update({ where: { id: orderId }, data: { status: newStatus } });

  // Restock items if requested
  if (input.restock) {
    const items = await prisma.orderItem.findMany({ where: { orderId } });
    for (const item of items) {
      if (item.productId) {
        await restock({ productId: item.productId, quantity: item.quantity });
      }
    }
  }

  await writeAudit({
    userId: actorId,
    action: 'order.refund_issued',
    entity: 'Order',
    entityId: orderId,
    changes: { refundId: refund.id, amountCents: input.amountCents, reason: input.reason ?? null },
    ipAddress,
    userAgent,
  });

  void sendEmail({
    to: order.email,
    ...emailTemplates.refundIssued(order.orderNumber, input.amountCents, 'en'),
  });

  return { refund, status: newStatus };
}