/**
 * Cart service integration. Verifies stock validation + add/remove/apply
 * coupon flow against Prisma.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma, resetTestDb } from '../helpers/prisma';
import { addCartItem, applyCoupon, getCart, removeCartItem } from '@/lib/services/cart';
import { makeCoupon, makeProduct, makeUser } from '../helpers/factories';

const skipIfNoDb = process.env.DATABASE_URL ? describe : describe.skip;

skipIfNoDb('cart service', () => {
  beforeAll(async () => {
    try {
      await prisma.$connect();
      await resetTestDb();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Skipping: cannot connect to test DB', err);
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('adds a cart item and reads it back', async () => {
    const user = await makeUser(prisma);
    const product = await makeProduct(prisma, { stock: 10, priceCents: 1000 });
    const cart = await addCartItem(user.id, product.id, 2);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]!.quantity).toBe(2);
    expect(cart.totals.subtotalCents).toBe(2000);
  });

  it('rejects adding more than available stock', async () => {
    const user = await makeUser(prisma);
    const product = await makeProduct(prisma, { stock: 2, priceCents: 500 });
    await expect(addCartItem(user.id, product.id, 5)).rejects.toThrow();
  });

  it('applies a coupon to the cart', async () => {
    const user = await makeUser(prisma);
    const product = await makeProduct(prisma, { priceCents: 5000, stock: 5 });
    await addCartItem(user.id, product.id, 1);
    await makeCoupon(prisma, { code: 'OFF10', type: 'PERCENTAGE', value: 10 });
    const cart = await applyCoupon(user.id, 'OFF10');
    expect(cart.couponCode).toBe('OFF10');
    const totals = await getCart(user.id);
    expect(totals.totals.discountCents).toBe(500);
  });

  it('removes a cart item', async () => {
    const user = await makeUser(prisma);
    const product = await makeProduct(prisma, { stock: 5, priceCents: 1000 });
    const before = await addCartItem(user.id, product.id, 1);
    const itemId = before.items[0]!.itemId;
    const after = await removeCartItem(user.id, itemId);
    expect(after.items).toHaveLength(0);
  });
});