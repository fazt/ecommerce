/**
 * Role-checking wrapper. Throws ForbiddenError if the user is not in the
 * allowed roles list. Use as: `export const POST = withAuth(['ADMIN'], handler)`.
 */

import { requireRole, requireUser, type SessionUser } from '../auth-helpers';
import { withErrors, type Handler, type HandlerCtx } from './with-errors';
import type { Role } from '@prisma/client';

export type AuthedHandler<P = unknown> = (
  ctx: HandlerCtx & { user: SessionUser },
  params: P,
) => Promise<Response> | Response;

export function withAuth<P = unknown>(handler: AuthedHandler<P>): Handler<P> {
  return withErrors<P>(async (ctx, params) => {
    const user = await requireUser();
    return handler({ ...ctx, user }, params);
  });
}

export function withRole<P = unknown>(
  roles: Role[],
  handler: AuthedHandler<P>,
): Handler<P> {
  return withErrors<P>(async (ctx, params) => {
    const user = await requireRole(roles);
    return handler({ ...ctx, user }, params);
  });
}