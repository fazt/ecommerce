/**
 * Helpers for simulating authenticated requests in API tests.
 */

import crypto from 'node:crypto';

export function signedSessionCookie(userId: string, role: string): string {
  // Real Auth.js uses JWE; tests bypass auth() by directly setting session.
  // The auth() helper in this codebase reads from a JWT cookie via NextAuth.
  // We keep tests self-contained by short-circuiting auth() through a
  // module mock (see tests/api/* with vi.mock('@/auth')).
  const payload = Buffer.from(JSON.stringify({ user: { id: userId, role }, exp: Date.now() / 1000 + 3600 })).toString('base64url');
  return `next-auth.session-token=${payload}`;
}

export function csrfToken(secret = process.env.CSRF_SECRET ?? 'test-csrf-secret') {
  const token = crypto.randomBytes(16).toString('hex');
  const sig = crypto.createHmac('sha256', secret).update(token).digest('hex');
  return { token, cookieValue: `${token}.${sig}` };
}