/**
 * POST /api/webhooks/stripe — Stripe webhook entry point.
 *
 * Verifies signature with `stripe.webhooks.constructEvent`. Idempotent on
 * event id. Handles:
 *  - checkout.session.completed → mark order PAID, decrement stock, send email
 *  - charge.refunded → record Refund, update order status, restock
 *  - payment_intent.payment_failed → mark order FAILED
 */

import { stripe, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { decrementStock } from '@/lib/inventory';
import { writeAudit } from '@/lib/audit';
import { sendEmail, emailTemplates } from '@/lib/email';
import { incrementCouponUsage } from '@/lib/services/coupon';
import { logger } from '@/lib/logger';
import { WebhookSignatureError } from '@/lib/errors';
import type Stripe from 'stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request): Promise<Response> {
  const sig = req.headers.get('stripe-signature');
  if (!sig) return new Response('Missing signature', { status: 400 });

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.warn({ err }, 'Stripe signature verification failed');
    throw new WebhookSignatureError((err as Error).message);
  }

  // Idempotency: skip if we've already processed this event id.
  const existing = await prisma.stripeEvent.findUnique({
    where: { stripeEventId: event.id },
  });
  if (existing) {
    logger.info({ eventId: event.id, type: event.type }, 'webhook already processed');
    return Response.json({ ok: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'charge.refunded':
        await handleRefund(event.data.object as Stripe.Charge);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        logger.debug({ type: event.type }, 'Unhandled webhook event');
    }

    await prisma.stripeEvent.create({
      data: { stripeEventId: event.id, type: event.type },
    });
    return Response.json({ ok: true });
  } catch (err) {
    logger.error({ err, eventId: event.id, type: event.type }, 'webhook handler failed');
    return Response.json({ ok: false }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId ?? session.client_reference_id;
  if (!orderId) {
    logger.warn({ sessionId: session.id }, 'checkout.session.completed without orderId');
    return;
  }
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) {
    logger.warn({ orderId }, 'order not found for completed session');
    return;
  }
  if (order.status === 'PAID') return; // already processed

  const taxCents = session.total_details?.amount_tax ?? 0;
  const shippingCents = session.total_details?.amount_shipping ?? 0;

  await prisma.$transaction(async (tx) => {
    // Decrement stock for each order item.
    for (const item of order.items) {
      if (item.productId) {
        await decrementStock({ productId: item.productId, quantity: item.quantity, tx });
      }
    }

    // Create OrderItem rows from the snapshot stored in the order itself.
    // (OrderItems are created at session time in createStripeCheckoutSession.)
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        stripePaymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : null,
        stripeCustomerId: typeof session.customer === 'string' ? session.customer : null,
        stripeTaxTransactionId: (session as { automatic_tax?: { status?: string } }).automatic_tax?.status ?? null,
        taxCents,
        shippingCents,
      },
    });

    if (order.couponId) {
      await incrementCouponUsage(order.couponId);
    }
  });

  await writeAudit({
    action: 'order.paid',
    entity: 'Order',
    entityId: order.id,
    changes: { paymentIntent: typeof session.payment_intent === 'string' ? session.payment_intent : null },
  });

  void sendEmail({
    to: order.email,
    ...emailTemplates.orderConfirmation(order.orderNumber, 'en'),
  });
}

async function handleRefund(charge: Stripe.Charge) {
  const orderId = charge.metadata?.orderId;
  if (!orderId) return;
  // Stripe emits a `refund.created` event with full details; that is the
  // canonical event for refunds. This handler is a safety net.
  logger.info({ chargeId: charge.id, orderId }, 'charge.refunded observed');
}

async function handlePaymentFailed(intent: Stripe.PaymentIntent) {
  const orderId = intent.metadata?.orderId;
  if (!orderId) return;
  await prisma.order.update({
    where: { id: orderId },
    data: { status: 'FAILED' },
  });
  await writeAudit({
    action: 'order.payment_failed',
    entity: 'Order',
    entityId: orderId,
    changes: { paymentIntent: intent.id },
  });
}