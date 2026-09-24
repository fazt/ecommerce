/**
 * POST /api/cart/items — add item to cart.
 * GET  /api/cart/items — return cart view.
 */

import { withAuth } from '@/lib/http/with-auth';
import { withCsrf } from '@/lib/http/with-csrf';
import { zodParse } from '@/lib/http/zod-parse';
import { jsonOk, withErrors } from '@/lib/http/with-errors';
import { AddCartItemSchema } from '@/lib/validators/cart';
import * as cart from '@/lib/services/cart';

export const POST = withCsrf(withAuth(async ({ req }, _params) => {
  const user = (await import('@/lib/auth-helpers')).requireUser;
  const sessionUser = await user();
  const input = await zodParse(req, AddCartItemSchema);
  const view = await cart.addCartItem(sessionUser.id, input.productId, input.quantity);
  return jsonOk(view);
}));

export const GET = withErrors(async ({ req }) => {
  const sessionUser = await (await import('@/lib/auth-helpers')).getOptionalUser();
  if (!sessionUser) return jsonOk({ items: [], totals: null });
  const view = await cart.getCart(sessionUser.id);
  return jsonOk(view);
});

export const runtime = 'nodejs';