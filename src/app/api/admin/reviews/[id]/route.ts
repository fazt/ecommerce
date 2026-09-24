/**
 * PATCH /api/admin/reviews/[id] — approve or unpublish a review.
 */

import { z } from 'zod';
import { withRole } from '@/lib/http/with-auth';
import { withCsrf } from '@/lib/http/with-csrf';
import { zodParse } from '@/lib/http/zod-parse';
import { jsonOk } from '@/lib/http/with-errors';
import { moderateReview } from '@/lib/services/review';
import { requireRole } from '@/lib/auth-helpers';
import { awaitParams } from '@/lib/next-params';

const ModerateSchema = z.object({ isApproved: z.boolean() });

export const PATCH = withCsrf(withRole(['ADMIN', 'SUPER_ADMIN'], async ({ req }, params) => {
  const sessionUser = await requireRole(['ADMIN', 'SUPER_ADMIN']);
  const { id } = await awaitParams(params as Promise<{ id: string }>);
  const input = await zodParse(req, ModerateSchema);
  const review = await moderateReview(
    id,
    input.isApproved,
    sessionUser.id,
    req.headers.get('x-forwarded-for') ?? undefined,
    req.headers.get('user-agent') ?? undefined,
  );
  return jsonOk(review);
}));

export const runtime = 'nodejs';
