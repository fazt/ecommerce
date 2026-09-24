import { describe, expect, it } from 'vitest';
import { emptyTaxBreakdown, normaliseStripeTax } from '@/lib/tax';

describe('tax', () => {
  it('returns empty breakdown by default', () => {
    expect(emptyTaxBreakdown).toEqual({ taxCents: 0, byJurisdiction: {} });
  });

  it('normalises Stripe Tax breakdown', () => {
    const result = normaliseStripeTax(500, [
      { jurisdiction: { display_name: 'California' }, amount: 300 },
      { jurisdiction: { display_name: 'San Francisco County' }, amount: 200 },
    ]);
    expect(result.taxCents).toBe(500);
    expect(result.byJurisdiction.California).toBe(300);
    expect(result.byJurisdiction['San Francisco County']).toBe(200);
  });

  it('handles missing breakdown', () => {
    const result = normaliseStripeTax(123);
    expect(result.taxCents).toBe(123);
    expect(result.byJurisdiction).toEqual({});
  });
});