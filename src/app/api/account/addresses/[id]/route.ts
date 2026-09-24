/**
 * PATCH  /api/account/addresses/[id] — update.
 * DELETE /api/account/addresses/[id] — delete.
 */

import { withAuth } from '@/lib/http/with-auth';
import { withCsrf } from '@/lib/http/with-csrf';
import { zodParse } from '@/lib/http/zod-parse';
import { jsonOk } from '@/lib/http/with-errors';
import { AddressInputSchema } from '@/lib/validators/address';
import * as user from '@/lib/services/user';
import { requireUser } from '@/lib/auth-helpers';
import { awaitParams } from '@/lib/next-params';

export const PATCH = withCsrf(withAuth(async ({ req }, params) => {
  const u = await requireUser();
  const { id } = await awaitParams(params as Promise<{ id: string }>);
  const input = await zodParse(req, AddressInputSchema.partial());
  return jsonOk(await user.updateAddress(u.id, id, input));
}));

export const DELETE = withCsrf(withAuth(async (_ctx, params) => {
  const u = await requireUser();
  const { id } = await awaitParams(params as Promise<{ id: string }>);
  return jsonOk(await user.deleteAddress(u.id, id));
}));

export const runtime = 'nodejs';