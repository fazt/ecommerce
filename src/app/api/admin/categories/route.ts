/**
 * POST  /api/admin/categories — create.
 * GET   /api/admin/categories — list all.
 */

import { withRole } from '@/lib/http/with-auth';
import { withCsrf } from '@/lib/http/with-csrf';
import { zodParse } from '@/lib/http/zod-parse';
import { jsonOk } from '@/lib/http/with-errors';
import { CategoryCreateSchema } from '@/lib/validators/category';
import { prisma } from '@/lib/prisma';
import { writeAudit } from '@/lib/audit';
import { requireRole } from '@/lib/auth-helpers';

export const POST = withCsrf(withRole(['ADMIN', 'SUPER_ADMIN'], async ({ req }) => {
  const sessionUser = await requireRole(['ADMIN', 'SUPER_ADMIN']);
  const input = await zodParse(req, CategoryCreateSchema);
  const created = await prisma.category.create({ data: input });
  await writeAudit({
    userId: sessionUser.id,
    action: 'category.created',
    entity: 'Category',
    entityId: created.id,
  });
  return jsonOk(created);
}));

export const GET = withRole(['ADMIN', 'SUPER_ADMIN'], async () => {
  const items = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  return jsonOk({ items });
});

export const runtime = 'nodejs';