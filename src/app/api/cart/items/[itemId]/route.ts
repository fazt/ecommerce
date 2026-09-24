/**
 * PATCH /api/cart/items/[itemId]  — update quantity.
 * DELETE /api/cart/items/[itemId] — remove from cart.
 */

import { withAuth } from '@/lib/http/with-auth';
import { withCsrf } from '@/lib/http/with-csrf';
import { zodParse } from '@/lib/http/zod-parse';
import { jsonOk } from '@/lib/http/with-errors';
import { UpdateCartItemSchema } from '@/lib/validators/cart';
import * as cart from '@/lib/services/cart';
import { requireUser } from '@/lib/auth-helpers';
import { awaitParams } from '@/lib/next-params';

export const PATCH = withCsrf(withAuth(async ({ req }, params) => {
  const sessionUser = await requireUser();
  const { itemId } = await awaitParams(params as Promise<{ itemId: string }>);
  const input = await zodParse(req, UpdateCartItemSchema);
  const view = await cart.setCartItemQuantity(sessionUser.id, itemId, input.quantity);
  return jsonOk(view);
}));

export const DELETE = withCsrf(withAuth(async (_ctx, params) => {
  const sessionUser = await requireUser();
  const { itemId } = await awaitParams(params as Promise<{ itemId: string }>);
  const view = await cart.removeCartItem(sessionUser.id, itemId);
  return jsonOk(view);
}));

export const runtime = 'nodejs';