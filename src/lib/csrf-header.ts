/**
 * Client-safe CSRF constants. The server-only `lib/csrf.ts` imports
 * `next/headers`, which is not allowed in client components — use this
 * module from the browser instead.
 */

export const CSRF_HEADER = 'x-csrf-token';