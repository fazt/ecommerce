/**
 * Next.js 16 proxy (was middleware.ts). Composes Auth.js with next-intl
 * locale detection. Runs on the Edge.
 */

import createIntlMiddleware from 'next-intl/middleware';
import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfig } from '@/auth.config';

const intlMiddleware = createIntlMiddleware({
  locales: ['en', 'es'],
  defaultLocale: 'en',
  localePrefix: 'always',
});

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl, auth: session } = req as typeof req & { auth: typeof req.auth };

  // Skip intl middleware for non-page requests.
  const isPage =
    !nextUrl.pathname.startsWith('/api') &&
    !nextUrl.pathname.startsWith('/_next') &&
    !nextUrl.pathname.startsWith('/uploads') &&
    !nextUrl.pathname.includes('.') &&
    nextUrl.pathname !== '/favicon.ico';

  if (!isPage) return NextResponse.next();

  // Auth guard for protected sections (defense-in-depth; route handlers
  // re-check too).
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
  if (nextUrl.pathname.includes('/admin') && !isAdmin) {
    const url = nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('callbackUrl', nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  if (nextUrl.pathname.includes('/account') && !session?.user) {
    const url = nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('callbackUrl', nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return intlMiddleware(req);
});

export const config = {
  // Skip auth + API routes (they handle their own auth) and internals.
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};