/**
 * PATCH /api/admin/users/[id]/role — change a user's role (SUPER_ADMIN only).
 */

import { withRole } from '@/lib/http/with-auth';
import { withCsrf } from '@/lib/http/with-csrf';
import { zodParse } from '@/lib/http/zod-parse';
import { jsonOk } from '@/lib/http/with-errors';
import { UserRoleUpdateSchema } from '@/lib/validators/admin';
import { prisma } from '@/lib/prisma';
import { writeAudit } from '@/lib/audit';
import { requireRole } from '@/lib/auth-helpers';
import { awaitParams } from '@/lib/next-params';

export const PATCH = withCsrf(withRole(['SUPER_ADMIN'], async ({ req }, params) => {
  const sessionUser = await requireRole(['SUPER_ADMIN']);
  const { id } = await awaitParams(params as Promise<{ id: string }>);
  const input = await zodParse(req, UserRoleUpdateSchema);
  const before = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
  const after = await prisma.user.update({ where: { id }, data: { role: input.role } });
  await writeAudit({
    userId: sessionUser.id,
    action: 'user.role_changed',
    entity: 'User',
    entityId: id,
    changes: { before, after },
  });
  return jsonOk(after);
}));

export const runtime = 'nodejs';