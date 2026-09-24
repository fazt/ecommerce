import { describe, expect, it } from 'vitest';
import {
  AppError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  StockError,
  UnauthorizedError,
  ValidationError,
  WebhookSignatureError,
} from '@/lib/errors';

describe('AppError subclasses', () => {
  it('carries status, code, message', () => {
    const e = new AppError({ status: 418, code: 'TEAPOT', message: 'I am a teapot' });
    expect(e.status).toBe(418);
    expect(e.code).toBe('TEAPOT');
    expect(e.message).toBe('I am a teapot');
  });

  it('subclasses have correct defaults', () => {
    expect(new ValidationError().status).toBe(400);
    expect(new UnauthorizedError().status).toBe(401);
    expect(new ForbiddenError().status).toBe(403);
    expect(new NotFoundError().status).toBe(404);
    expect(new ConflictError().status).toBe(409);
    expect(new RateLimitError().status).toBe(429);
    expect(new WebhookSignatureError().status).toBe(400);
  });

  it('StockError includes context in details', () => {
    const e = new StockError('p1', 5, 2);
    expect(e.status).toBe(409);
    expect(e.details).toEqual({ productId: 'p1', requested: 5, available: 2 });
  });
});