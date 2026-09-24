/**
 * Async params / searchParams helpers. Next.js 16 makes both Promises.
 */

export async function awaitParams<T extends Record<string, string | string[]>>(p: Promise<T>): Promise<T> {
  return p;
}

export async function awaitSearchParams<T extends Record<string, string | string[] | undefined>>(
  p: Promise<T>,
): Promise<T> {
  return p;
}