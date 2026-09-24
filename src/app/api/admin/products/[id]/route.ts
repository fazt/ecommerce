/**
 * PATCH  /api/admin/products/[id] — update product.
 * DELETE /api/admin/products/[id] — soft-delete (isActive=false).
 */

import { withRole } from '@/lib/http/with-auth';
import { withCsrf } from '@/lib/http/with-csrf';
import { zodParse } from '@/lib/http/zod-parse';
import { jsonOk } from '@/lib/http/with-errors';
import { ProductUpdateSchema } from '@/lib/validators/product';
import { prisma } from '@/lib/prisma';
import { writeAudit, writeAudit as _writeAudit } from '@/lib/audit';
import { NotFoundError } from '@/lib/errors';
import { requireRole } from '@/lib/auth-helpers';
import { awaitParams } from '@/lib/next-params';

export const PATCH = withCsrf(withRole(['ADMIN', 'SUPER_ADMIN'], async ({ req }, params) => {
  const sessionUser = await requireRole(['ADMIN', 'SUPER_ADMIN']);
  const { id } = await awaitParams(params as Promise<{ id: string }>);
  const input = await zodParse(req, ProductUpdateSchema);
  const before = await prisma.product.findUnique({ where: { id } });
  if (!before) throw new NotFoundError('Product');
  // Strip out `images` from the update; use the dedicated images route for
  // image CRUD in a follow-up.
  const { images: _images, ...data } = input;
  const updated = await prisma.product.update({ where: { id }, data });
  await writeAudit({
    userId: sessionUser.id,
    action: 'product.updated',
    entity: 'Product',
    entityId: id,
    changes: { before, after: updated },
  });
  return jsonOk(updated);
}));

export const DELETE = withCsrf(withRole(['ADMIN', 'SUPER_ADMIN'], async (_ctx, params) => {
  const sessionUser = await requireRole(['ADMIN', 'SUPER_ADMIN']);
  const { id } = await awaitParams(params as Promise<{ id: string }>);
  const updated = await prisma.product.update({ where: { id }, data: { isActive: false } });
  await _writeAudit({
    userId: sessionUser.id,
    action: 'product.deactivated',
    entity: 'Product',
    entityId: id,
  });
  return jsonOk(updated);
}));

export const runtime = 'nodejs';