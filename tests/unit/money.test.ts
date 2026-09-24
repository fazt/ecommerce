import { describe, expect, it } from 'vitest';
import {
  applyFixedDiscount,
  applyPercentageDiscount,
  computeSubtotal,
  computeTotal,
  formatMoney,
  sumCents,
  timesCents,
} from '@/lib/money';

describe('money', () => {
  it('sums integer cents without float drift', () => {
    expect(sumCents([100, 200, 300])).toBe(600);
    expect(sumCents([10, 20, 30, 40])).toBe(100);
  });

  it('multiplies cents by integer quantity', () => {
    expect(timesCents(199, 3)).toBe(597);
    expect(() => timesCents(1.5, 2)).toThrow();
    expect(() => timesCents(100, -1)).toThrow();
  });

  it('computes subtotal from cart items', () => {
    const sub = computeSubtotal([
      { unitPriceCents: 1000, quantity: 2 },
      { unitPriceCents: 250, quantity: 4 },
    ]);
    expect(sub).toBe(3000);
  });

  it('applies percentage discount with banker rounding', () => {
    expect(applyPercentageDiscount(100, 10)).toBe(10);
    expect(applyPercentageDiscount(33, 50)).toBe(16); // 16.5 → 16 (banker)
    expect(() => applyPercentageDiscount(100, 150)).toThrow();
  });

  it('caps fixed discount at subtotal', () => {
    expect(applyFixedDiscount(500, 700)).toBe(500);
    expect(applyFixedDiscount(500, 100)).toBe(100);
    expect(() => applyFixedDiscount(500, -1)).toThrow();
  });

  it('computes total = subtotal + shipping + tax - discount', () => {
    expect(
      computeTotal({
        subtotalCents: 1000,
        shippingCents: 500,
        taxCents: 100,
        discountCents: 200,
      }),
    ).toBe(1400);
  });

  it('formats as localized currency', () => {
    expect(formatMoney(1234, 'USD', 'en-US')).toBe('$12.34');
    expect(formatMoney(1234, 'EUR', 'es-ES')).toMatch(/12,34/);
  });
});