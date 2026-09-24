/**
 * POST   /api/cart/coupon  — apply a coupon.
 * DELETE /api/cart/coupon  — remove the applied coupon.
 */

import { withAuth } from '@/lib/http/with-auth';
import { withCsrf } from '@/lib/http/with-csrf';
import { zodParse } from '@/lib/http/zod-parse';
import { jsonOk } from '@/lib/http/with-errors';
import { ApplyCouponSchema } from '@/lib/validators/coupon';
import * as cart from '@/lib/services/cart';
import { requireUser } from '@/lib/auth-helpers';

export const POST = withCsrf(withAuth(async ({ req }) => {
  const user = await requireUser();
  const input = await zodParse(req, ApplyCouponSchema);
  return jsonOk(await cart.applyCoupon(user.id, input.code));
}));

export const DELETE = withCsrf(withAuth(async () => {
  const user = await requireUser();
  return jsonOk(await cart.removeCoupon(user.id));
}));

export const runtime = 'nodejs';