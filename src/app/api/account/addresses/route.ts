/**
 * POST  /api/account/addresses — create.
 * GET   /api/account/addresses — list.
 */

import { withAuth } from '@/lib/http/with-auth';
import { withCsrf } from '@/lib/http/with-csrf';
import { zodParse } from '@/lib/http/zod-parse';
import { jsonOk } from '@/lib/http/with-errors';
import { AddressInputSchema } from '@/lib/validators/address';
import * as user from '@/lib/services/user';
import { requireUser } from '@/lib/auth-helpers';

export const POST = withCsrf(withAuth(async ({ req }) => {
  const u = await requireUser();
  const input = await zodParse(req, AddressInputSchema);
  return jsonOk(await user.createAddress(u.id, input));
}));

export const GET = withAuth(async () => {
  const u = await requireUser();
  return jsonOk(await user.listAddresses(u.id));
});

export const runtime = 'nodejs';