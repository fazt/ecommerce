/**
 * POST /api/account/password — change password.
 */

import { withAuth } from '@/lib/http/with-auth';
import { withCsrf } from '@/lib/http/with-csrf';
import { zodParse } from '@/lib/http/zod-parse';
import { jsonOk } from '@/lib/http/with-errors';
import { ChangePasswordSchema } from '@/lib/validators/auth';
import * as user from '@/lib/services/user';
import { requireUser } from '@/lib/auth-helpers';

export const POST = withCsrf(withAuth(async ({ req }) => {
  const u = await requireUser();
  const { currentPassword, newPassword } = await zodParse(req, ChangePasswordSchema);
  return jsonOk(await user.changePassword(u.id, currentPassword, newPassword));
}));

export const runtime = 'nodejs';