/**
 * PATCH /api/admin/orders/[id]/tracking — set carrier + tracking number.
 */

import { withRole } from '@/lib/http/with-auth';
import { withCsrf } from '@/lib/http/with-csrf';
import { zodParse } from '@/lib/http/zod-parse';
import { jsonOk } from '@/lib/http/with-errors';
import { TrackingUpdateSchema } from '@/lib/validators/admin';
import { updateTracking } from '@/lib/services/order';
import { requireRole } from '@/lib/auth-helpers';
import { awaitParams } from '@/lib/next-params';

export const PATCH = withCsrf(withRole(['ADMIN', 'SUPER_ADMIN'], async ({ req }, params) => {
  const sessionUser = await requireRole(['ADMIN', 'SUPER_ADMIN']);
  const { id } = await awaitParams(params as Promise<{ id: string }>);
  const input = await zodParse(req, TrackingUpdateSchema);
  const updated = await updateTracking(
    id,
    input,
    sessionUser.id,
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined,
    req.headers.get('user-agent') ?? undefined,
  );
  return jsonOk(updated);
}));

export const runtime = 'nodejs';