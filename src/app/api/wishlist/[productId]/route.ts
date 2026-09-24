/**
 * DELETE /api/wishlist/[productId] — remove product from wishlist.
 */

import { withAuth } from '@/lib/http/with-auth';
import { withCsrf } from '@/lib/http/with-csrf';
import { jsonOk } from '@/lib/http/with-errors';
import * as wishlist from '@/lib/services/wishlist';
import { requireUser } from '@/lib/auth-helpers';
import { awaitParams } from '@/lib/next-params';

export const DELETE = withCsrf(withAuth(async (_ctx, params) => {
  const user = await requireUser();
  const { productId } = await awaitParams(params as Promise<{ productId: string }>);
  return jsonOk(await wishlist.removeFromWishlist(user.id, productId));
}));

export const runtime = 'nodejs';