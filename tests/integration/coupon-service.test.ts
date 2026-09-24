/**
 * Integration tests for coupon service. Requires a running Postgres with the
 * Prisma schema applied. Skipped automatically if no DATABASE_URL is set or
 * the connection fails.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma, resetTestDb } from '../helpers/prisma';
import { incrementCouponUsage, resolveCoupon } from '@/lib/services/coupon';
import { makeCoupon, makeUser } from '../helpers/factories';

const skipIfNoDb = process.env.DATABASE_URL ? describe : describe.skip;

skipIfNoDb('coupon service', () => {
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

  it('resolves a valid coupon', async () => {
    await makeCoupon(prisma, { code: 'TEST10', type: 'PERCENTAGE', value: 10 });
    const c = await resolveCoupon('test10', 10_000);
    expect(c.code).toBe('TEST10');
  });

  it('rejects expired coupon', async () => {
    await makeCoupon(prisma, {
      code: 'EXPIRED',
      type: 'PERCENTAGE',
      value: 10,
    });
    await prisma.coupon.update({
      where: { code: 'EXPIRED' },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    await expect(resolveCoupon('EXPIRED', 10_000)).rejects.toThrow(/expired/);
  });

  it('rejects when subtotal below minimum', async () => {
    await makeCoupon(prisma, { code: 'MIN50', type: 'FIXED_AMOUNT', value: 500 });
    await prisma.coupon.update({
      where: { code: 'MIN50' },
      data: { minOrderCents: 10_000 },
    });
    await expect(resolveCoupon('MIN50', 1000)).rejects.toThrow(/Minimum/);
  });

  it('increments usage atomically', async () => {
    const c = await makeCoupon(prisma, { code: 'ONCE', type: 'PERCENTAGE', value: 5 });
    const first = await incrementCouponUsage(c.id);
    const second = await incrementCouponUsage(c.id);
    expect(first).toBe(true);
    expect(second).toBe(true);
    const after = await prisma.coupon.findUnique({ where: { id: c.id } });
    expect(after?.currentUses).toBe(2);
  });

  it('blocks usage beyond maxUses', async () => {
    const c = await makeCoupon(prisma, { code: 'LIMIT', type: 'PERCENTAGE', value: 5 });
    await prisma.coupon.update({ where: { id: c.id }, data: { maxUses: 1 } });
    const first = await incrementCouponUsage(c.id);
    const second = await incrementCouponUsage(c.id);
    expect(first).toBe(true);
    expect(second).toBe(false);
  });

  it('does not resolve inactive coupon', async () => {
    const c = await makeCoupon(prisma, { code: 'INACTIVE', type: 'PERCENTAGE', value: 5 });
    await prisma.coupon.update({ where: { id: c.id }, data: { isActive: false } });
    await expect(resolveCoupon('INACTIVE', 10_000)).rejects.toThrow(/Invalid/);
  });

  it('makeUser creates a user', async () => {
    const u = await makeUser(prisma, { email: 'integration@example.com' });
    expect(u.email).toBe('integration@example.com');
  });
});