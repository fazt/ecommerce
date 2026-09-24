/**
 * Parse + validate a Request body against a zod schema. Returns either the
 * parsed value or a 400 Response envelope.
 */

import type { ZodSchema } from 'zod';
import { ValidationError } from '../errors';

export async function zodParse<T>(req: Request, schema: ZodSchema<T>): Promise<T> {
  let body: unknown;
  try {
    const text = await req.text();
    body = text ? JSON.parse(text) : {};
  } catch {
    throw new ValidationError('Invalid JSON body');
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new ValidationError('Validation failed', result.error.flatten());
  }
  return result.data;
}

export async function zodParseSearchParams<T>(req: Request, schema: ZodSchema<T>): Promise<T> {
  const url = new URL(req.url);
  const obj: Record<string, string | string[]> = {};
  for (const [k, v] of url.searchParams.entries()) {
    const existing = obj[k];
    if (existing === undefined) {
      obj[k] = v;
    } else if (Array.isArray(existing)) {
      existing.push(v);
    } else {
      obj[k] = [existing, v];
    }
  }
  const result = schema.safeParse(obj);
  if (!result.success) {
    throw new ValidationError('Invalid query parameters', result.error.flatten());
  }
  return result.data;
}