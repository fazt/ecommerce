/**
 * POST /api/reviews — create or update own review on a product.
 */

import { withAuth } from '@/lib/http/with-auth';
import { withCsrf } from '@/lib/http/with-csrf';
import { zodParse } from '@/lib/http/zod-parse';
import { jsonOk } from '@/lib/http/with-errors';
import { ReviewCreateSchema } from '@/lib/validators/product';
import * as review from '@/lib/services/review';
import { requireUser } from '@/lib/auth-helpers';

export const POST = withCsrf(withAuth(async ({ req }) => {
  const user = await requireUser();
  const input = await zodParse(req, ReviewCreateSchema);
  return jsonOk(await review.createReview(user.id, input));
}));

export const runtime = 'nodejs';