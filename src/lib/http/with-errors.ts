/**
 * Error-to-JSON envelope. Every Route Handler should be wrapped in this so
 * that AppError subclasses produce a uniform response shape.
 */

import { AppError } from '../errors';
import { logger } from '../logger';

export interface HandlerCtx {
  req: Request;
  method: string;
}

export type Handler<P = unknown> = (
  ctx: HandlerCtx,
  params: P,
) => Promise<Response> | Response;

/** Compose helpers into a single wrapped handler. */
export function compose<P = unknown>(
  ...handlers: Array<(ctx: HandlerCtx, params: P, next: () => Promise<Response>) => Promise<Response>>
): Handler<P> {
  return async (ctx, params) => {
    let i = 0;
    const next = async () => {
      const h = handlers[i++];
      if (!h) throw new AppError({ status: 500, code: 'NO_HANDLER', message: 'No handler matched' });
      return h(ctx, params, next);
    };
    return next();
  };
}

/**
 * Next.js invokes route handlers as `(request, { params })`. The outermost
 * wrapper converts that into `({ req, method }, params)`; nested wrappers
 * receive the already-normalized shape and pass it through untouched.
 */
function normalize<P>(ctx: HandlerCtx | Request, params: unknown): [HandlerCtx, P] {
  if (ctx instanceof Request) {
    const p = params && typeof params === 'object' && 'params' in params ? (params as { params: unknown }).params : params;
    return [{ req: ctx, method: ctx.method }, p as P];
  }
  return [ctx, params as P];
}

export function withErrors<P = unknown>(handler: (ctx: HandlerCtx, params: P) => Promise<Response> | Response): Handler<P> {
  return async (rawCtx, rawParams) => {
    const [ctx, params] = normalize<P>(rawCtx as HandlerCtx | Request, rawParams);
    try {
      return await handler(ctx, params);
    } catch (err) {
      if (err instanceof AppError) {
        return jsonError(err.status, err.code, err.message, err.details);
      }
      logger.error({ err, path: ctx.req.url }, 'unhandled route handler error');
      return jsonError(500, 'INTERNAL', 'Internal server error');
    }
  };
}

export function jsonError(status: number, code: string, message: string, details?: unknown): Response {
  return Response.json({ error: { code, message, details } }, { status });
}

export function jsonOk<T>(data: T, init?: ResponseInit): Response {
  return Response.json(data, init);
}