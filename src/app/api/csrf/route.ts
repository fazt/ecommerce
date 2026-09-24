/**
 * GET /api/csrf — returns the double-submit token and sets the signed cookie.
 * Reuses an existing valid cookie so several open tabs share one token.
 */

import { issueCsrf, csrfCookie, readCsrfCookieValue, verifyCsrfFromCookies } from '@/lib/csrf';

export async function GET() {
  const existing = await readCsrfCookieValue();
  if (existing) {
    const token = existing.split('.')[0];
    try {
      await verifyCsrfFromCookies(existing, token);
      return Response.json({ token }, { headers: { 'cache-control': 'no-store' } });
    } catch {
      // fall through and mint a fresh one
    }
  }
  const { token, cookieValue } = issueCsrf();
  return Response.json(
    { token },
    { headers: { 'set-cookie': csrfCookie(cookieValue), 'cache-control': 'no-store' } },
  );
}

export const runtime = 'nodejs';
