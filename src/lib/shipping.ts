/**
 * Shipping zone + rate selection logic. Pure functions consumed by the
 * checkout service.
 */

export interface ShippingZoneInput {
  id: string;
  name: string;
  countries: string[];
  isActive: boolean;
  rates: ShippingRateInput[];
}

export interface ShippingRateInput {
  id: string;
  zoneId: string;
  name: string;
  description?: string | null;
  basePriceCents: number;
  perKgCents: number;
  minSubtotalCents?: number | null;
  maxSubtotalCents?: number | null;
  minWeightGrams?: number | null;
  maxWeightGrams?: number | null;
  deliveryDaysMin?: number | null;
  deliveryDaysMax?: number | null;
  isActive: boolean;
}

/** Find the first zone whose country list includes the country code. */
export function findZoneByCountry(zones: ShippingZoneInput[], country: string): ShippingZoneInput | null {
  const c = country.toUpperCase();
  return zones.find((z) => z.isActive && z.countries.map((cc) => cc.toUpperCase()).includes(c)) ?? null;
}

export interface PickRateInput {
  zone: ShippingZoneInput;
  subtotalCents: number;
  weightGrams: number;
  preferredName?: string;
  preferredId?: string;
}

/** Select the best rate for the cart. */
export function pickRate({ zone, subtotalCents, weightGrams, preferredName, preferredId }: PickRateInput): ShippingRateInput {
  const candidates = zone.rates.filter(
    (r) =>
      r.isActive &&
      (r.minSubtotalCents == null || subtotalCents >= r.minSubtotalCents) &&
      (r.maxSubtotalCents == null || subtotalCents <= r.maxSubtotalCents) &&
      (r.minWeightGrams == null || weightGrams >= r.minWeightGrams) &&
      (r.maxWeightGrams == null || weightGrams <= r.maxWeightGrams),
  );
  if (candidates.length === 0) {
    throw new Error(`No shipping rate available for zone ${zone.name}`);
  }
  // Prefer exact ID match (used by the checkout form).
  if (preferredId) {
    const byId = candidates.find((r) => r.id === preferredId);
    if (byId) return byId;
  }
  // Fallback to legacy name match (e.g. "standard", "express", "overnight").
  if (preferredName) {
    const preferred = candidates.find((r) => r.name.toLowerCase() === preferredName.toLowerCase());
    if (preferred) return preferred;
  }
  // Cheapest by computed total.
  return candidates.reduce((best, r) => {
    const a = best.basePriceCents + best.perKgCents * Math.ceil(weightGrams / 1000);
    const b = r.basePriceCents + r.perKgCents * Math.ceil(weightGrams / 1000);
    return b < a ? r : best;
  });
}

export function computeRateCostCents(rate: ShippingRateInput, weightGrams: number): number {
  return rate.basePriceCents + rate.perKgCents * Math.ceil(weightGrams / 1000);
}

export function estimateDeliveryDays(rate: ShippingRateInput): string {
  if (rate.description) return rate.description;
  return '';
}