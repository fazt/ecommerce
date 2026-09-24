/**
 * Checkout service. Creates a Stripe Checkout Session for the user's cart.
 *
 * Re-validates stock + prices against the DB (never trust client), writes
 * an Order row in PENDING, then calls stripe.checkout.sessions.create with
 * automatic_tax + shipping_options + discounts.
 */

import type { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { stripe, STRIPE_AUTOMATIC_TAX } from '../stripe';
import { resolveCoupon } from './coupon';
import { pickShippingForCountry } from './shipping';
import { computeCartTotals, type CartLine } from '../cart';
import { computeSubtotal } from '../money';
import { NotFoundError, ValidationError } from '../errors';
import type { CheckoutSessionInput } from '../validators/checkout';
import { writeAudit } from '../audit';

export async function createStripeCheckoutSession(
  userId: string,
  input: CheckoutSessionInput,
): Promise<{ url: string; orderId: string; orderNumber: string }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User');

  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: { product: { include: { images: { orderBy: { position: 'asc' }, take: 1 } } } },
      },
    },
  });
  if (!cart || cart.items.length === 0) throw new ValidationError('Cart is empty');

  // Re-validate stock and compute server-side totals.
  const lines: CartLine[] = [];
  for (const item of cart.items) {
    if (item.product.stock < item.quantity) {
      throw new ValidationError(
        `Not enough stock for ${item.product.name} (have ${item.product.stock}, need ${item.quantity})`,
      );
    }
    lines.push({ productId: item.productId, unitPriceCents: item.product.priceCents, quantity: item.quantity });
  }
  const subtotalCents = computeSubtotal(lines);

  // Coupon
  let couponId: string | null = null;
  let couponSnapshot: Awaited<ReturnType<typeof resolveCoupon>> | null = null;
  if (input.couponCode) {
    couponSnapshot = await resolveCoupon(input.couponCode, subtotalCents);
    couponId = couponSnapshot.id;
  }

  // Shipping address (required for rate pick + Stripe)
  const shippingAddress = input.shippingAddressId
    ? await prisma.address.findUnique({ where: { id: input.shippingAddressId } })
    : null;
  if (!shippingAddress || shippingAddress.userId !== userId) {
    throw new ValidationError('Shipping address required');
  }

  // Compute total weight + pick shipping rate
  const items2 = await prisma.cartItem.findMany({
    where: { cartId: cart.id },
    include: { product: true },
  });
  const totalWeight = items2.reduce((acc, i) => acc + (i.product.weightGrams ?? 0) * i.quantity, 0);

  const shipping = await pickShippingForCountry({
    country: shippingAddress.country,
    subtotalCents,
    weightGrams: totalWeight,
    preferredRateId: input.shippingRateId,
  });

  const totals = computeCartTotals({
    lines,
    coupon: couponSnapshot
      ? { type: couponSnapshot.type, value: couponSnapshot.value }
      : null,
    shippingCents: shipping.costCents,
    taxCents: 0, // tax comes back from Stripe
  });

  // Generate order number
  const orderNumber = await generateOrderNumber();

  // Snapshot billing address
  const billingAddress = input.billingAddressId
    ? await prisma.address.findUnique({ where: { id: input.billingAddressId } })
    : shippingAddress;
  if (!billingAddress || billingAddress.userId !== userId) {
    throw new ValidationError('Billing address required');
  }

  // Create order (PENDING) before Stripe so we can use its id as client_reference_id
  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId,
      email: user.email,
      status: 'PENDING',
      subtotalCents,
      shippingCents: shipping.costCents,
      taxCents: 0,
      discountCents: totals.discountCents,
      totalCents: totals.subtotalCents + totals.shippingCents + totals.taxCents - totals.discountCents,
      currency: shipping.zone.rates[0]?.id ? (await getCurrencyFromCart(cart.id)) : 'USD',
      shippingAddress: addressToJson(shippingAddress),
      billingAddress: addressToJson(billingAddress),
      couponId,
    },
  });

  // Build Stripe line_items
  const lineItems: import('stripe').Stripe.Checkout.SessionCreateParams.LineItem[] = lines.map((l) => {
    const item = cart.items.find((ci) => ci.productId === l.productId);
    const product = item!.product;
    return {
      quantity: l.quantity,
      price_data: {
        currency: product.currency.toLowerCase(),
        unit_amount: l.unitPriceCents,
        product_data: {
          name: product.name,
          description: product.shortDescription ?? undefined,
          images: product.images[0]?.url ? [product.images[0].url] : undefined,
          tax_code: product.taxCode ?? 'txcd_10000000',
          metadata: { productId: product.id, slug: product.slug },
        },
      },
    };
  });

  // Coupon → Stripe discount (create on demand)
  const discounts: import('stripe').Stripe.Checkout.SessionCreateParams.Discount[] = [];
  if (couponSnapshot) {
    const stripeCoupon = await ensureStripeCoupon(couponSnapshot);
    discounts.push({ coupon: stripeCoupon.id });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: user.email,
    client_reference_id: order.id,
    metadata: { orderId: order.id, userId },
    line_items: lineItems,
    automatic_tax: STRIPE_AUTOMATIC_TAX ? { enabled: true } : undefined,
    shipping_options: [
      {
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: { amount: shipping.costCents, currency: 'usd' },
          display_name: shipping.rate.name,
          delivery_estimate: shipping.rate.deliveryDaysMin
            ? {
                minimum: { unit: 'business_day', value: shipping.rate.deliveryDaysMin },
                maximum: {
                  unit: 'business_day',
                  value: shipping.rate.deliveryDaysMax ?? (shipping.rate.deliveryDaysMin + 1),
                },
              }
            : undefined,
        },
      },
    ],
    discounts: discounts.length ? discounts : undefined,
    success_url: `${config.baseUrl()}/en/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.baseUrl()}/en/checkout/canceled`,
    locale: 'en',
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { stripeSessionId: session.id, stripeShippingRateId: shipping.rate.id },
  });

  await writeAudit({
    userId,
    action: 'order.created',
    entity: 'Order',
    entityId: order.id,
    changes: { orderNumber, status: 'PENDING', totalCents: order.totalCents },
  });

  if (!session.url) throw new ValidationError('Stripe did not return a checkout URL');
  return { url: session.url, orderId: order.id, orderNumber };
}

async function getCurrencyFromCart(cartId: string): Promise<string> {
  const item = await prisma.cartItem.findFirst({ where: { cartId }, include: { product: true } });
  return item?.product.currency ?? 'USD';
}

function addressToJson(a: {
  label: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
  phone: string | null;
}): Prisma.InputJsonValue {
  return {
    label: a.label,
    line1: a.line1,
    line2: a.line2,
    city: a.city,
    state: a.state,
    postalCode: a.postalCode,
    country: a.country,
    phone: a.phone,
  };
}

async function generateOrderNumber(): Promise<string> {
  const year = new Date().getUTCFullYear();
  // Count orders this year and pad to 5 digits.
  const count = await prisma.order.count({
    where: { orderNumber: { startsWith: `ORD-${year}-` } },
  });
  return `ORD-${year}-${String(count + 1).padStart(5, '0')}`;
}

async function ensureStripeCoupon(coupon: { id: string; code: string; type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING'; value: number }) {
  // Look up by id in metadata; simplest: create-or-fetch by name.
  const stripeCoupon = await stripe.coupons.create({
    name: coupon.code,
    duration: 'once',
    percent_off: coupon.type === 'PERCENTAGE' ? coupon.value : undefined,
    amount_off: coupon.type === 'FIXED_AMOUNT' ? coupon.value : undefined,
    currency: coupon.type === 'FIXED_AMOUNT' ? 'usd' : undefined,
    metadata: { internalId: coupon.id },
  });
  return stripeCoupon;
}

// `config` is a small helper to keep `baseUrl` resolution explicit.
const config = {
  baseUrl() {
    return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  },
};