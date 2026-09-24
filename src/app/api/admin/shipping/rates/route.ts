/**
 * POST /api/admin/shipping/rates — create rate.
 */

import { withRole } from '@/lib/http/with-auth';
import { withCsrf } from '@/lib/http/with-csrf';
import { zodParse } from '@/lib/http/zod-parse';
import { jsonOk } from '@/lib/http/with-errors';
import { ShippingRateCreateSchema } from '@/lib/validators/shipping';
import { prisma } from '@/lib/prisma';
import { writeAudit } from '@/lib/audit';
import { requireRole } from '@/lib/auth-helpers';

export const POST = withCsrf(withRole(['ADMIN', 'SUPER_ADMIN'], async ({ req }) => {
  const sessionUser = await requireRole(['ADMIN', 'SUPER_ADMIN']);
  const input = await zodParse(req, ShippingRateCreateSchema);
  const created = await prisma.shippingRate.create({ data: input });
  await writeAudit({
    userId: sessionUser.id,
    action: 'shipping.rate_created',
    entity: 'ShippingRate',
    entityId: created.id,
    changes: { zoneId: created.zoneId, name: created.name },
  });
  return jsonOk(created);
}));

export const runtime = 'nodejs';