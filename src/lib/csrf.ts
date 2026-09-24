/**
 * CSRF token issue + verify. Implements the double-submit cookie pattern.
 *
 *  - `issueCsrf()` returns { token, cookie } — the cookie is set on the
 *    response; the token must be echoed in an `x-csrf-token` header on
 *    every state-changing request.
 *  - `verifyCsrf(req)` checks that the header and cookie values match and
 *    that the cookie's HMAC matches CSRF_SECRET.
 *
 * Webhooks (Stripe) are exempt; they sign the body instead.
 *
 * NOTE: this module imports `next/headers`, so it must NOT be imported by
 * client components. Client code can use `CSRF_HEADER` (re-exported here as
 * a constant) via `lib/csrf-header.ts`.
 */

import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { ForbiddenError } from './errors';

const COOKIE_NAME = 'csrf';
const HEADER_NAME = 'x-csrf-token';
const ONE_WEEK_SECONDS = 60 * 60 * 24 * 7;

function getSecret(): string {
  const secret = process.env.CSRF_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('CSRF_SECRET is required in production');
  }
  return secret ?? 'dev-csrf-secret';
}

function sign(value: string): string {
  return crypto.createHmac('sha256', getSecret()).update(value).digest('hex');
}

/** Mint a fresh token and the cookie payload (signed). */
export function issueCsrf(): { token: string; cookieValue: string } {
  const token = crypto.randomBytes(24).toString('hex');
  const sig = sign(token);
  return { token, cookieValue: `${token}.${sig}` };
}

/** Build the Set-Cookie header value to attach to the response. */
export function csrfCookie(value: string): string {
  return [
    `${COOKIE_NAME}=${value}`,
    'Path=/',
    `Max-Age=${ONE_WEEK_SECONDS}`,
    'SameSite=Lax',
    process.env.NODE_ENV === 'production' ? 'Secure' : '',
    'HttpOnly',
  ]
    .filter(Boolean)
    .join('; ');
}

/**
 * Verify the CSRF token from the request. Looks at both the cookie and the
 * `x-csrf-token` header and confirms the HMAC. Returns the token on success;
 * throws ForbiddenError on mismatch.
 */
export async function verifyCsrfFromCookies(cookieValue: string | undefined, headerValue: string | undefined): Promise<void> {
  if (!cookieValue || !headerValue) {
    throw new ForbiddenError('Missing CSRF token');
  }
  const [cookieToken, cookieSig] = cookieValue.split('.');
  const [headerToken] = headerValue.split('.');
  if (!cookieToken || !cookieSig || !headerToken) {
    throw new ForbiddenError('Malformed CSRF token');
  }
  if (cookieToken !== headerToken) {
    throw new ForbiddenError('CSRF token mismatch');
  }
  const expectedSig = sign(cookieToken);
  // Constant-time comparison.
  const a = Buffer.from(expectedSig);
  const b = Buffer.from(cookieSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new ForbiddenError('CSRF signature invalid');
  }
}

/** Convenience: read the cookie and header from a Request and verify. */
export async function verifyCsrfFromRequest(req: Request): Promise<void> {
  const cookieHeader = req.headers.get('cookie') ?? '';
  const cookieMap = Object.fromEntries(
    cookieHeader
      .split(';')
      .map((p) => p.trim())
      .filter(Boolean)
      .map((kv) => {
        const i = kv.indexOf('=');
        return i < 0 ? [kv, ''] : [kv.slice(0, i), kv.slice(i + 1)];
      }),
  );
  const cookieValue = cookieMap[COOKIE_NAME];
  const headerValue = req.headers.get(HEADER_NAME) ?? undefined;
  await verifyCsrfFromCookies(cookieValue, headerValue);
}

export async function readCsrfCookieValue(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value;
}

export const CSRF_HEADER = HEADER_NAME;
export const CSRF_COOKIE_NAME = COOKIE_NAME;