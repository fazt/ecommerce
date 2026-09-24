import { describe, expect, it } from 'vitest';
import { findZoneByCountry, pickRate, computeRateCostCents } from '@/lib/shipping';
import type { ShippingZoneInput } from '@/lib/shipping';

const usZone: ShippingZoneInput = {
  id: 'us',
  name: 'US',
  countries: ['US'],
  isActive: true,
  rates: [
    {
      id: 'std',
      zoneId: 'us',
      name: 'Standard',
      basePriceCents: 599,
      perKgCents: 100,
      minSubtotalCents: null,
      maxSubtotalCents: null,
      minWeightGrams: null,
      maxWeightGrams: null,
      isActive: true,
    },
    {
      id: 'exp',
      zoneId: 'us',
      name: 'Express',
      basePriceCents: 1499,
      perKgCents: 200,
      minSubtotalCents: null,
      maxSubtotalCents: null,
      minWeightGrams: null,
      maxWeightGrams: null,
      isActive: true,
    },
  ],
};

describe('shipping', () => {
  it('finds the right zone for a country', () => {
    expect(findZoneByCountry([usZone], 'us')?.id).toBe('us');
    expect(findZoneByCountry([usZone], 'ca')).toBeNull();
  });

  it('picks cheapest rate by default', () => {
    const rate = pickRate({ zone: usZone, subtotalCents: 1000, weightGrams: 1000 });
    expect(rate.id).toBe('std');
  });

  it('honours preferred rate name', () => {
    const rate = pickRate({ zone: usZone, subtotalCents: 1000, weightGrams: 1000, preferredName: 'Express' });
    expect(rate.id).toBe('exp');
  });

  it('computes cost including perKg surcharge', () => {
    expect(computeRateCostCents(usZone.rates[0]!, 2500)).toBe(599 + 100 * 3);
  });

  it('throws when no rate is eligible', () => {
    const restrictive: ShippingZoneInput = {
      ...usZone,
      rates: [
        {
          id: 'heavy',
          zoneId: 'us',
          name: 'Heavy only',
          basePriceCents: 999,
          perKgCents: 0,
          minSubtotalCents: 100_000, // $1000 minimum
          maxSubtotalCents: null,
          minWeightGrams: null,
          maxWeightGrams: null,
          isActive: true,
        },
      ],
    };
    expect(() => pickRate({ zone: restrictive, subtotalCents: 5000, weightGrams: 500 })).toThrow();
  });
});