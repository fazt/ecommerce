/**
 * POST /api/admin/coupons — create.
 * GET  /api/admin/coupons — list.
 */

import { withRole } from '@/lib/http/with-auth';
import { withCsrf } from '@/lib/http/with-csrf';
import { zodParse } from '@/lib/http/zod-parse';
import { jsonOk } from '@/lib/http/with-errors';
import { CouponCreateSchema } from '@/lib/validators/coupon';
import { prisma } from '@/lib/prisma';
import { writeAudit } from '@/lib/audit';
import { requireRole } from '@/lib/auth-helpers';

export const POST = withCsrf(withRole(['ADMIN', 'SUPER_ADMIN'], async ({ req }) => {
  const sessionUser = await requireRole(['ADMIN', 'SUPER_ADMIN']);
  const input = await zodParse(req, CouponCreateSchema);
  const created = await prisma.coupon.create({
    data: {
      ...input,
      code: input.code.toUpperCase(),
      startsAt: input.startsAt ? new Date(input.startsAt) : null,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    },
  });
  await writeAudit({
    userId: sessionUser.id,
    action: 'coupon.created',
    entity: 'Coupon',
    entityId: created.id,
    changes: { code: created.code, type: created.type, value: created.value },
  });
  return jsonOk(created);
}));

export const GET = withRole(['ADMIN', 'SUPER_ADMIN'], async () => {
  const items = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  return jsonOk({ items });
});

export const runtime = 'nodejs';