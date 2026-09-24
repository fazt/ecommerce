/**
 * PATCH  /api/admin/coupons/[id] — update.
 * DELETE /api/admin/coupons/[id] — delete.
 */

import { withRole } from '@/lib/http/with-auth';
import { withCsrf } from '@/lib/http/with-csrf';
import { zodParse } from '@/lib/http/zod-parse';
import { jsonOk } from '@/lib/http/with-errors';
import { CouponUpdateSchema } from '@/lib/validators/coupon';
import { prisma } from '@/lib/prisma';
import { writeAudit } from '@/lib/audit';
import { NotFoundError } from '@/lib/errors';
import { requireRole } from '@/lib/auth-helpers';
import { awaitParams } from '@/lib/next-params';

export const PATCH = withCsrf(withRole(['ADMIN', 'SUPER_ADMIN'], async ({ req }, params) => {
  const sessionUser = await requireRole(['ADMIN', 'SUPER_ADMIN']);
  const { id } = await awaitParams(params as Promise<{ id: string }>);
  const input = await zodParse(req, CouponUpdateSchema);
  const before = await prisma.coupon.findUnique({ where: { id } });
  if (!before) throw new NotFoundError('Coupon');
  const after = await prisma.coupon.update({ where: { id }, data: input });
  await writeAudit({
    userId: sessionUser.id,
    action: 'coupon.updated',
    entity: 'Coupon',
    entityId: id,
    changes: { before, after },
  });
  return jsonOk(after);
}));

export const DELETE = withCsrf(withRole(['ADMIN', 'SUPER_ADMIN'], async (_ctx, params) => {
  const sessionUser = await requireRole(['ADMIN', 'SUPER_ADMIN']);
  const { id } = await awaitParams(params as Promise<{ id: string }>);
  await prisma.coupon.delete({ where: { id } });
  await writeAudit({
    userId: sessionUser.id,
    action: 'coupon.deleted',
    entity: 'Coupon',
    entityId: id,
  });
  return jsonOk({ ok: true });
}));

export const runtime = 'nodejs';