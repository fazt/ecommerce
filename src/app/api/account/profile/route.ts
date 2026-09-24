/**
 * GET   /api/account/profile  — fetch current user profile.
 * PATCH /api/account/profile  — update profile fields.
 */

import { withAuth } from '@/lib/http/with-auth';
import { withCsrf } from '@/lib/http/with-csrf';
import { zodParse } from '@/lib/http/zod-parse';
import { jsonOk } from '@/lib/http/with-errors';
import { UpdateProfileSchema } from '@/lib/validators/auth';
import * as user from '@/lib/services/user';
import { requireUser } from '@/lib/auth-helpers';

export const GET = withAuth(async () => {
  const u = await requireUser();
  return jsonOk(await user.getProfile(u.id));
});

export const PATCH = withCsrf(withAuth(async ({ req }) => {
  const u = await requireUser();
  const input = await zodParse(req, UpdateProfileSchema);
  return jsonOk(await user.updateProfile(u.id, input));
}));

export const runtime = 'nodejs';