/**
 * Typed error classes. The HTTP layer translates these into a uniform JSON
 * envelope (`{ error: { code, message, details? } }`).
 */

export class AppError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(opts: { status: number; code: string; message: string; details?: unknown }) {
    super(opts.message);
    this.name = 'AppError';
    this.status = opts.status;
    this.code = opts.code;
    this.details = opts.details;
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: unknown) {
    super({ status: 400, code: 'VALIDATION_ERROR', message, details });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super({ status: 401, code: 'UNAUTHORIZED', message });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super({ status: 403, code: 'FORBIDDEN', message });
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super({ status: 404, code: 'NOT_FOUND', message: `${resource} not found` });
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super({ status: 409, code: 'CONFLICT', message });
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super({ status: 429, code: 'RATE_LIMIT', message });
  }
}

export class StockError extends AppError {
  constructor(productId: string, requested: number, available: number) {
    super({
      status: 409,
      code: 'OUT_OF_STOCK',
      message: `Not enough stock for product ${productId}: requested ${requested}, available ${available}`,
      details: { productId, requested, available },
    });
  }
}

export class WebhookSignatureError extends AppError {
  constructor(message = 'Invalid webhook signature') {
    super({ status: 400, code: 'INVALID_SIGNATURE', message });
  }
}