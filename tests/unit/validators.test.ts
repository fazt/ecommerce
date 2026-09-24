import { describe, expect, it } from 'vitest';
import {
  AddCartItemSchema,
  CheckoutSessionSchema,
  CouponCreateSchema,
  ProductCreateSchema,
  RegisterSchema,
} from '@/lib/validators';

describe('validators', () => {
  it('validates product creation', () => {
    const ok = ProductCreateSchema.safeParse({
      slug: 'red-shirt',
      name: 'Red Shirt',
      description: 'A nice red shirt',
      priceCents: 2900,
      stock: 10,
    });
    expect(ok.success).toBe(true);
    const missing = ProductCreateSchema.safeParse({ slug: 'Bad Slug!', description: '' });
    expect(missing.success).toBe(false);
  });

  it('validates checkout session payload', () => {
    const ok = CheckoutSessionSchema.safeParse({ shippingRateId: 'cuid123' });
    expect(ok.success).toBe(true);
  });

  it('validates cart item', () => {
    const bad = AddCartItemSchema.safeParse({ productId: 'not-a-cuid', quantity: 0 });
    expect(bad.success).toBe(false);
  });

  it('validates coupon code format', () => {
    const bad = CouponCreateSchema.safeParse({ code: 'has spaces', type: 'PERCENTAGE', value: 10 });
    expect(bad.success).toBe(false);
  });

  it('validates register payload', () => {
    const bad = RegisterSchema.safeParse({ email: 'not-email', password: 'short' });
    expect(bad.success).toBe(false);
    const ok = RegisterSchema.safeParse({ email: 'a@b.com', password: 'longenough' });
    expect(ok.success).toBe(true);
  });
});