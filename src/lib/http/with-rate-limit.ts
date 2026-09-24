/**
 * Rate-limit wrapper. Caps requests per (scope, path, IP) tuple.
 */

import { rateLimitByRequest } from '../rate-limit';
import { withErrors, type Handler, type HandlerCtx } from './with-errors';

export interface RateLimitOpts {
  capacity: number;
  refillPerSecond: number;
}

export function withRateLimit<P = unknown>(
  opts: RateLimitOpts,
  scope: string,
  handler: (ctx: HandlerCtx, params: P) => Promise<Response> | Response,
): Handler<P> {
  return withErrors<P>(async (ctx, params) => {
    rateLimitByRequest(ctx.req, scope, opts);
    return handler(ctx, params);
  });
}