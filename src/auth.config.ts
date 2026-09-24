/**
 * Auth.js v5 configuration. Providers + callbacks. Edge-safe (no DB).
 */

import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';

const providers: NextAuthConfig['providers'] = [
  Credentials({
    name: 'Email + password',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    authorize: async (creds) => {
      // The actual user lookup happens in auth.ts (Node runtime).
      // Edge-safe authorize just returns null here; the full check is in
      // the main auth.ts file via the Prisma adapter + bcrypt.
      const email = typeof creds?.email === 'string' ? creds.email : '';
      const password = typeof creds?.password === 'string' ? creds.password : '';
      if (!email || !password) return null;

      // Lazy import to avoid bundling Prisma into the Edge runtime.
      const { prisma } = await import('@/lib/prisma');
      const bcrypt = await import('bcryptjs');
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user?.hashedPassword) return null;
      const ok = await bcrypt.compare(password, user.hashedPassword);
      if (!ok) return null;
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        preferredCurrency: user.preferredCurrency,
        preferredLocale: user.preferredLocale,
      } as never;
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

export const authConfig = {
  pages: {
    signIn: '/auth/login',
  },
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 30 },
  providers,
  callbacks: {
    authorized({ auth, request }) {
      const isAuthed = !!auth?.user;
      const { pathname } = request.nextUrl;
      if (pathname.startsWith('/admin')) {
        const role = (auth?.user as { role?: string } | undefined)?.role;
        return isAuthed && (role === 'ADMIN' || role === 'SUPER_ADMIN');
      }
      if (pathname.startsWith('/account')) return isAuthed;
      return true;
    },
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = (user as { id: string }).id;
        token.role = (user as { role: string }).role;
        token.preferredCurrency = (user as { preferredCurrency?: string }).preferredCurrency;
        token.preferredLocale = (user as { preferredLocale?: string }).preferredLocale;
      }
      if (trigger === 'update' && session) {
        Object.assign(token, session);
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { preferredCurrency?: string }).preferredCurrency = token.preferredCurrency as string | undefined;
        (session.user as { preferredLocale?: string }).preferredLocale = token.preferredLocale as string | undefined;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;