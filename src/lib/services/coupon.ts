/**
 * Coupon service. Validates a coupon against the cart subtotal.
 */

import { prisma } from '../prisma';
import { NotFoundError, ValidationError } from '../errors';

export interface ResolvedCoupon {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  value: number;
}

export async function resolveCoupon(code: string, subtotalCents: number): Promise<ResolvedCoupon> {
  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
  if (!coupon || !coupon.isActive) throw new NotFoundError('Coupon');
  const now = Date.now();
  if (coupon.startsAt && coupon.startsAt.getTime() > now) throw new ValidationError('Coupon not yet active');
  if (coupon.expiresAt && coupon.expiresAt.getTime() < now) throw new ValidationError('Coupon expired');
  if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
    throw new ValidationError('Coupon usage limit reached');
  }
  if (coupon.minOrderCents && subtotalCents < coupon.minOrderCents) {
    throw new ValidationError(`Minimum order $${(coupon.minOrderCents / 100).toFixed(2)} required`);
  }
  return {
    id: coupon.id,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
  };
}

/** Atomic increment of usage count. Returns true if applied, false if exhausted. */
export async function incrementCouponUsage(couponId: string) {
  const rows = await prisma.$executeRaw`
    UPDATE "Coupon"
    SET "currentUses" = "currentUses" + 1, "updatedAt" = NOW()
    WHERE "id" = ${couponId}
      AND ("maxUses" IS NULL OR "currentUses" < "maxUses")
  `;
  return rows === 1;
}