/**
 * Token-bucket rate limiter. In-memory for dev/tests; swap the storage for
 * Redis in production (interface left intentionally narrow).
 */

import { RateLimitError } from './errors';

interface Bucket {
  tokens: number;
  lastRefill: number;
}

interface Options {
  capacity: number;
  refillPerSecond: number;
}

const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, opts: Options): void {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { tokens: opts.capacity, lastRefill: now };
  const elapsedSec = (now - bucket.lastRefill) / 1000;
  bucket.tokens = Math.min(opts.capacity, bucket.tokens + elapsedSec * opts.refillPerSecond);
  bucket.lastRefill = now;
  if (bucket.tokens < 1) {
    buckets.set(key, bucket);
    throw new RateLimitError();
  }
  bucket.tokens -= 1;
  buckets.set(key, bucket);
}

export function rateLimitByRequest(req: Request, scope: string, opts: Options): void {
  // Best-effort key: IP + path + scope.
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';
  const path = new URL(req.url).pathname;
  rateLimit(`${scope}:${path}:${ip}`, opts);
}

/** Test helper: reset between cases. */
export function __resetRateLimits() {
  buckets.clear();
}