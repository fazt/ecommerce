/**
 * Cart service. Per-user DB-backed cart; merge on login.
 */

import { prisma } from '../prisma';
import { NotFoundError, ValidationError } from '../errors';
import { computeCartTotals, type CartTotals } from '../cart';

export interface CartView {
  id: string;
  items: Array<{
    itemId: string;
    productId: string;
    name: string;
    slug: string;
    unitPriceCents: number;
    quantity: number;
    image: string | null;
    stock: number;
  }>;
  couponCode: string | null;
  totals: CartTotals;
}

async function getOrCreateCart(userId: string) {
  const existing = await prisma.cart.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.cart.create({ data: { userId } });
}

export async function getCart(userId: string): Promise<CartView> {
  const cart = await getOrCreateCart(userId);
  const items = await prisma.cartItem.findMany({
    where: { cartId: cart.id },
    include: {
      product: {
        include: { images: { orderBy: { position: 'asc' }, take: 1 } },
      },
    },
  });

  const lines = items.map((it) => ({
    productId: it.productId,
    unitPriceCents: it.product.priceCents,
    quantity: it.quantity,
  }));
  let couponCode: string | null = null;
  let couponLike: { type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING'; value: number } | null = null;
  if (cart.couponId) {
    const coupon = await prisma.coupon.findUnique({ where: { id: cart.couponId } });
    if (coupon && coupon.isActive) {
      couponCode = coupon.code;
      couponLike = { type: coupon.type, value: coupon.value };
    }
  }

  const totals = computeCartTotals({
    lines,
    coupon: couponLike,
    shippingCents: 0, // populated by checkout service once a zone/rate is picked
    taxCents: 0, // populated by Stripe Tax
  });

  return {
    id: cart.id,
    items: items.map((it) => ({
      itemId: it.id,
      productId: it.productId,
      name: it.product.name,
      slug: it.product.slug,
      unitPriceCents: it.product.priceCents,
      quantity: it.quantity,
      image: it.product.images[0]?.url ?? null,
      stock: it.product.stock,
    })),
    couponCode,
    totals,
  };
}

export async function addCartItem(userId: string, productId: string, quantity: number) {
  if (quantity < 1) throw new ValidationError('Quantity must be ≥ 1');
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) throw new NotFoundError('Product');
  if (product.stock < quantity) throw new ValidationError('Not enough stock');

  const cart = await getOrCreateCart(userId);
  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId } },
    update: { quantity: { increment: quantity } },
    create: { cartId: cart.id, productId, quantity },
  });
  return getCart(userId);
}

export async function setCartItemQuantity(userId: string, itemId: string, quantity: number) {
  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true, product: true },
  });
  if (!item || item.cart.userId !== userId) throw new NotFoundError('Cart item');

  if (quantity === 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
  } else {
    if (item.product.stock < quantity) throw new ValidationError('Not enough stock');
    await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
  }
  return getCart(userId);
}

export async function removeCartItem(userId: string, itemId: string) {
  const item = await prisma.cartItem.findUnique({ where: { id: itemId }, include: { cart: true } });
  if (!item || item.cart.userId !== userId) throw new NotFoundError('Cart item');
  await prisma.cartItem.delete({ where: { id: itemId } });
  return getCart(userId);
}

export async function clearCart(userId: string) {
  const cart = await getOrCreateCart(userId);
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  await prisma.cart.update({ where: { id: cart.id }, data: { couponId: null } });
  return getCart(userId);
}

/** Merge a guest cart (localStorage payload) into the user's DB cart. */
export async function mergeCart(userId: string, items: Array<{ productId: string; quantity: number }>) {
  const cart = await getOrCreateCart(userId);
  for (const item of items) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    if (!product || !product.isActive || product.stock < 1) continue;
    await prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId: item.productId } },
      update: { quantity: { increment: item.quantity } },
      create: { cartId: cart.id, productId: item.productId, quantity: Math.min(item.quantity, product.stock) },
    });
  }
  return getCart(userId);
}

export async function applyCoupon(userId: string, code: string) {
  const cart = await getOrCreateCart(userId);
  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
  if (!coupon || !coupon.isActive) throw new ValidationError('Invalid coupon code');
  if (coupon.startsAt && coupon.startsAt > new Date()) throw new ValidationError('Coupon not yet active');
  if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new ValidationError('Coupon expired');
  if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) throw new ValidationError('Coupon usage limit reached');
  await prisma.cart.update({ where: { id: cart.id }, data: { couponId: coupon.id } });
  return getCart(userId);
}

export async function removeCoupon(userId: string) {
  const cart = await getOrCreateCart(userId);
  await prisma.cart.update({ where: { id: cart.id }, data: { couponId: null } });
  return getCart(userId);
}