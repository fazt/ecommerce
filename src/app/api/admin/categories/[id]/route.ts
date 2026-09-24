/**
 * PATCH  /api/admin/categories/[id] — update.
 * DELETE /api/admin/categories/[id] — delete.
 */

import { withRole } from '@/lib/http/with-auth';
import { withCsrf } from '@/lib/http/with-csrf';
import { zodParse } from '@/lib/http/zod-parse';
import { jsonOk } from '@/lib/http/with-errors';
import { CategoryUpdateSchema } from '@/lib/validators/category';
import { prisma } from '@/lib/prisma';
import { writeAudit } from '@/lib/audit';
import { NotFoundError } from '@/lib/errors';
import { requireRole } from '@/lib/auth-helpers';
import { awaitParams } from '@/lib/next-params';

export const PATCH = withCsrf(withRole(['ADMIN', 'SUPER_ADMIN'], async ({ req }, params) => {
  const sessionUser = await requireRole(['ADMIN', 'SUPER_ADMIN']);
  const { id } = await awaitParams(params as Promise<{ id: string }>);
  const input = await zodParse(req, CategoryUpdateSchema);
  const before = await prisma.category.findUnique({ where: { id } });
  if (!before) throw new NotFoundError('Category');
  const after = await prisma.category.update({ where: { id }, data: input });
  await writeAudit({
    userId: sessionUser.id,
    action: 'category.updated',
    entity: 'Category',
    entityId: id,
    changes: { before, after },
  });
  return jsonOk(after);
}));

export const DELETE = withCsrf(withRole(['ADMIN', 'SUPER_ADMIN'], async (_ctx, params) => {
  const sessionUser = await requireRole(['ADMIN', 'SUPER_ADMIN']);
  const { id } = await awaitParams(params as Promise<{ id: string }>);
  await prisma.category.delete({ where: { id } });
  await writeAudit({
    userId: sessionUser.id,
    action: 'category.deleted',
    entity: 'Category',
    entityId: id,
  });
  return jsonOk({ ok: true });
}));

export const runtime = 'nodejs';