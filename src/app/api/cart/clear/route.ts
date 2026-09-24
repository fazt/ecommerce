/**
 * POST /api/cart/clear — empty the current user's cart.
 */

import { withAuth } from '@/lib/http/with-auth';
import { withCsrf } from '@/lib/http/with-csrf';
import { jsonOk } from '@/lib/http/with-errors';
import * as cart from '@/lib/services/cart';
import { requireUser } from '@/lib/auth-helpers';

export const POST = withCsrf(withAuth(async () => {
  const user = await requireUser();
  return jsonOk(await cart.clearCart(user.id));
}));

export const runtime = 'nodejs';