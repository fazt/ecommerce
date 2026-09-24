/**
 * PATCH /api/admin/shipping/zones/[id] — update.
 * DELETE /api/admin/shipping/zones/[id] — delete (cascades to rates).
 */

import { withRole } from '@/lib/http/with-auth';
import { withCsrf } from '@/lib/http/with-csrf';
import { zodParse } from '@/lib/http/zod-parse';
import { jsonOk } from '@/lib/http/with-errors';
import { ShippingZoneCreateSchema } from '@/lib/validators/shipping';
import { prisma } from '@/lib/prisma';
import { writeAudit } from '@/lib/audit';
import { NotFoundError } from '@/lib/errors';
import { requireRole } from '@/lib/auth-helpers';
import { awaitParams } from '@/lib/next-params';

export const PATCH = withCsrf(withRole(['ADMIN', 'SUPER_ADMIN'], async ({ req }, params) => {
  const sessionUser = await requireRole(['ADMIN', 'SUPER_ADMIN']);
  const { id } = await awaitParams(params as Promise<{ id: string }>);
  const input = await zodParse(req, ShippingZoneCreateSchema.partial());
  const before = await prisma.shippingZone.findUnique({ where: { id } });
  if (!before) throw new NotFoundError('ShippingZone');
  const after = await prisma.shippingZone.update({ where: { id }, data: input });
  await writeAudit({
    userId: sessionUser.id,
    action: 'shipping.zone_updated',
    entity: 'ShippingZone',
    entityId: id,
    changes: { before, after },
  });
  return jsonOk(after);
}));

export const DELETE = withCsrf(withRole(['ADMIN', 'SUPER_ADMIN'], async (_ctx, params) => {
  const sessionUser = await requireRole(['ADMIN', 'SUPER_ADMIN']);
  const { id } = await awaitParams(params as Promise<{ id: string }>);
  await prisma.shippingZone.delete({ where: { id } });
  await writeAudit({
    userId: sessionUser.id,
    action: 'shipping.zone_deleted',
    entity: 'ShippingZone',
    entityId: id,
  });
  return jsonOk({ ok: true });
}));

export const runtime = 'nodejs';