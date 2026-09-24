/**
 * Server-side auth helpers. Used inside Route Handlers to resolve the
 * current session (or throw) without coupling to the Auth.js internals.
 */

import { auth } from '@/auth';
import { ForbiddenError, UnauthorizedError } from './errors';
import type { Role } from '@prisma/client';

export interface SessionUser {
  id: string;
  email: string;
  role: Role;
  name?: string | null;
  preferredCurrency?: string;
  preferredLocale?: string;
}

/** Returns the session user if signed in, otherwise null. */
export async function getOptionalUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user) return null;
  const u = session.user as typeof session.user & { id?: string; role?: string; preferredCurrency?: string; preferredLocale?: string };
  if (!u.id) return null;
  return {
    id: u.id,
    email: u.email ?? '',
    role: (u.role as Role) ?? 'USER',
    name: u.name ?? null,
    preferredCurrency: u.preferredCurrency,
    preferredLocale: u.preferredLocale,
  };
}

/** Throws UnauthorizedError if the request is not authenticated. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getOptionalUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

/** Throws if the user is missing or has an insufficient role. */
export async function requireRole(roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    throw new ForbiddenError(`Requires role ${roles.join(' or ')}`);
  }
  return user;
}