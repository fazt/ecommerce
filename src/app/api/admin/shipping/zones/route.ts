/**
 * POST /api/admin/shipping/zones — create zone.
 * GET  /api/admin/shipping/zones — list.
 */

import { withRole } from '@/lib/http/with-auth';
import { withCsrf } from '@/lib/http/with-csrf';
import { zodParse } from '@/lib/http/zod-parse';
import { jsonOk } from '@/lib/http/with-errors';
import { ShippingZoneCreateSchema } from '@/lib/validators/shipping';
import { prisma } from '@/lib/prisma';
import { writeAudit } from '@/lib/audit';
import { requireRole } from '@/lib/auth-helpers';

export const POST = withCsrf(withRole(['ADMIN', 'SUPER_ADMIN'], async ({ req }) => {
  const sessionUser = await requireRole(['ADMIN', 'SUPER_ADMIN']);
  const input = await zodParse(req, ShippingZoneCreateSchema);
  const created = await prisma.shippingZone.create({ data: input });
  await writeAudit({
    userId: sessionUser.id,
    action: 'shipping.zone_created',
    entity: 'ShippingZone',
    entityId: created.id,
  });
  return jsonOk(created);
}));

export const GET = withRole(['ADMIN', 'SUPER_ADMIN'], async () => {
  const items = await prisma.shippingZone.findMany({
    include: { rates: true },
    orderBy: { name: 'asc' },
  });
  return jsonOk({ items });
});

export const runtime = 'nodejs';