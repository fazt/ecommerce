/**
 * Shipping service. Loads active zones + rates from the DB and exposes them
 * for the checkout flow.
 */

import { prisma } from '../prisma';
import { findZoneByCountry, pickRate, computeRateCostCents, type ShippingZoneInput } from '../shipping';

export async function listZonesWithRates(): Promise<ShippingZoneInput[]> {
  const zones = await prisma.shippingZone.findMany({
    where: { isActive: true },
    include: { rates: { where: { isActive: true } } },
  });
  return zones.map((z) => ({
    id: z.id,
    name: z.name,
    countries: z.countries,
    isActive: z.isActive,
    rates: z.rates.map((r) => ({
      id: r.id,
      zoneId: r.zoneId,
      name: r.name,
      description: r.description,
      basePriceCents: r.basePriceCents,
      perKgCents: r.perKgCents,
      minSubtotalCents: r.minSubtotalCents,
      maxSubtotalCents: undefined, // not in schema; documented
      minWeightGrams: r.minWeightGrams,
      maxWeightGrams: r.maxWeightGrams,
      deliveryDaysMin: r.deliveryDaysMin,
      deliveryDaysMax: r.deliveryDaysMax,
      isActive: r.isActive,
    })),
  }));
}

export async function pickShippingForCountry(args: {
  country: string;
  subtotalCents: number;
  weightGrams: number;
  preferredRateId?: string;
  preferredRateName?: string;
}) {
  const zones = await listZonesWithRates();
  const zone = findZoneByCountry(zones, args.country);
  if (!zone) throw new Error(`No shipping zone for country ${args.country}`);
  const rate = pickRate({
    zone,
    subtotalCents: args.subtotalCents,
    weightGrams: args.weightGrams,
    preferredId: args.preferredRateId,
    preferredName: args.preferredRateName,
  });
  const cost = computeRateCostCents(rate, args.weightGrams);
  return { zone, rate, costCents: cost };
}

/** List rates applicable to a country+subtotal combo (for the checkout form). */
export async function listEligibleRatesForCountry(args: {
  country: string;
  subtotalCents: number;
  weightGrams: number;
}) {
  const zones = await listZonesWithRates();
  const zone = findZoneByCountry(zones, args.country);
  if (!zone) return [];
  return zone.rates.filter(
    (r) =>
      r.isActive &&
      (r.minSubtotalCents == null || args.subtotalCents >= r.minSubtotalCents) &&
      (r.maxSubtotalCents == null || args.subtotalCents <= r.maxSubtotalCents) &&
      (r.minWeightGrams == null || args.weightGrams >= r.minWeightGrams) &&
      (r.maxWeightGrams == null || args.weightGrams <= r.maxWeightGrams),
  );
}