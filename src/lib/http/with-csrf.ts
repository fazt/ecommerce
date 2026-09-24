/**
 * CSRF wrapper. Verifies double-submit token on every mutating request
 * (POST, PUT, PATCH, DELETE). Webhooks are exempt; the Stripe handler
 * skips this wrapper and verifies the Stripe signature instead.
 */

import { verifyCsrfFromRequest } from '../csrf';
import { withErrors, type Handler, type HandlerCtx } from './with-errors';

export function withCsrf<P = unknown>(handler: (ctx: HandlerCtx, params: P) => Promise<Response> | Response): Handler<P> {
  return withErrors<P>(async (ctx, params) => {
    if (ctx.method !== 'GET' && ctx.method !== 'HEAD') {
      await verifyCsrfFromRequest(ctx.req);
    }
    return handler(ctx, params);
  });
}