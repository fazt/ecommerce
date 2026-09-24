/**
 * POST  /api/wishlist — add product.
 * GET   /api/wishlist — list current user's wishlist.
 */

import { withAuth } from '@/lib/http/with-auth';
import { withCsrf } from '@/lib/http/with-csrf';
import { zodParse } from '@/lib/http/zod-parse';
import { jsonOk, withErrors } from '@/lib/http/with-errors';
import { WishlistAddSchema } from '@/lib/validators/wishlist';
import * as wishlist from '@/lib/services/wishlist';
import { requireUser, getOptionalUser } from '@/lib/auth-helpers';

export const POST = withCsrf(withAuth(async ({ req }) => {
  const user = await requireUser();
  const input = await zodParse(req, WishlistAddSchema);
  return jsonOk(await wishlist.addToWishlist(user.id, input.productId));
}));

export const GET = withErrors(async () => {
  const user = await getOptionalUser();
  if (!user) return jsonOk({ items: [] });
  return jsonOk({ items: await wishlist.listWishlist(user.id) });
});

export const runtime = 'nodejs';