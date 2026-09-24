/**
 * PATCH  /api/reviews/[id] — update own review.
 * DELETE /api/reviews/[id] — delete own review.
 */

import { withAuth } from '@/lib/http/with-auth';
import { withCsrf } from '@/lib/http/with-csrf';
import { zodParse } from '@/lib/http/zod-parse';
import { jsonOk } from '@/lib/http/with-errors';
import { ReviewUpdateSchema } from '@/lib/validators/product';
import * as review from '@/lib/services/review';
import { requireUser } from '@/lib/auth-helpers';
import { awaitParams } from '@/lib/next-params';

export const PATCH = withCsrf(withAuth(async ({ req }, params) => {
  const user = await requireUser();
  const { id } = await awaitParams(params as Promise<{ id: string }>);
  const input = await zodParse(req, ReviewUpdateSchema);
  return jsonOk(await review.updateReview(user.id, id, input));
}));

export const DELETE = withCsrf(withAuth(async (_ctx, params) => {
  const user = await requireUser();
  const { id } = await awaitParams(params as Promise<{ id: string }>);
  return jsonOk(await review.deleteReview(user.id, id));
}));

export const runtime = 'nodejs';