/**
 * POST /api/cart/merge — merge a guest cart (localStorage) into the user's
 * DB cart. Called after login.
 */

import { withAuth } from '@/lib/http/with-auth';
import { withCsrf } from '@/lib/http/with-csrf';
import { zodParse } from '@/lib/http/zod-parse';
import { jsonOk } from '@/lib/http/with-errors';
import { MergeCartSchema } from '@/lib/validators/cart';
import * as cart from '@/lib/services/cart';
import { requireUser } from '@/lib/auth-helpers';

export const POST = withCsrf(withAuth(async ({ req }) => {
  const user = await requireUser();
  const input = await zodParse(req, MergeCartSchema);
  return jsonOk(await cart.mergeCart(user.id, input.items));
}));

export const runtime = 'nodejs';