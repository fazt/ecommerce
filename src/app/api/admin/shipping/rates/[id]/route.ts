/**
 * PATCH  /api/admin/shipping/rates/[id] — update rate.
 * DELETE /api/admin/shipping/rates/[id] — delete rate.
 */

import { withRole } from '@/lib/http/with-auth';
import { withCsrf } from '@/lib/http/with-csrf';
import { zodParse } from '@/lib/http/zod-parse';
import { jsonOk } from '@/lib/http/with-errors';
import { ShippingRateUpdateSchema } from '@/lib/validators/shipping';
import { prisma } from '@/lib/prisma';
import { writeAudit } from '@/lib/audit';
import { NotFoundError } from '@/lib/errors';
import { requireRole } from '@/lib/auth-helpers';
import { awaitParams } from '@/lib/next-params';

export const PATCH = withCsrf(withRole(['ADMIN', 'SUPER_ADMIN'], async ({ req }, params) => {
  const sessionUser = await requireRole(['ADMIN', 'SUPER_ADMIN']);
  const { id } = await awaitParams(params as Promise<{ id: string }>);
  const input = await zodParse(req, ShippingRateUpdateSchema);
  const before = await prisma.shippingRate.findUnique({ where: { id } });
  if (!before) throw new NotFoundError('ShippingRate');
  const after = await prisma.shippingRate.update({ where: { id }, data: input });
  await writeAudit({
    userId: sessionUser.id,
    action: 'shipping.rate_updated',
    entity: 'ShippingRate',
    entityId: id,
    changes: { before, after },
  });
  return jsonOk(after);
}));

export const DELETE = withCsrf(withRole(['ADMIN', 'SUPER_ADMIN'], async (_ctx, params) => {
  const sessionUser = await requireRole(['ADMIN', 'SUPER_ADMIN']);
  const { id } = await awaitParams(params as Promise<{ id: string }>);
  await prisma.shippingRate.delete({ where: { id } });
  await writeAudit({
    userId: sessionUser.id,
    action: 'shipping.rate_deleted',
    entity: 'ShippingRate',
    entityId: id,
  });
  return jsonOk({ ok: true });
}));

export const runtime = 'nodejs';