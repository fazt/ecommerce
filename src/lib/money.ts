/**
 * Money math helpers. All values are stored as integer cents; this module
 * provides pure, allocation-free arithmetic so tests stay deterministic.
 */

export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'MXN';

export const SUPPORTED_CURRENCIES: Currency[] = ['USD', 'EUR', 'GBP', 'CAD', 'MXN'];

/** Sum a list of cent values without floating-point errors. */
export function sumCents(values: number[]): number {
  let total = 0;
  for (const v of values) total += Math.trunc(v);
  return total;
}

/** Multiply cents by a unit quantity (e.g. unitPrice * qty). */
export function timesCents(unitPriceCents: number, quantity: number): number {
  if (!Number.isInteger(unitPriceCents)) {
    throw new Error(`unitPriceCents must be integer, got ${unitPriceCents}`);
  }
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new Error(`quantity must be non-negative integer, got ${quantity}`);
  }
  return unitPriceCents * quantity;
}

/** Apply a percentage discount (0-100) and round half-to-even. */
export function applyPercentageDiscount(subtotalCents: number, percent: number): number {
  if (percent < 0 || percent > 100) {
    throw new Error(`percent must be 0..100, got ${percent}`);
  }
  // Banker's rounding for fairness.
  const raw = subtotalCents * (percent / 100);
  const floored = Math.floor(raw);
  const diff = raw - floored;
  if (diff > 0.5) return floored + 1;
  if (diff < 0.5) return floored;
  return floored % 2 === 0 ? floored : floored + 1;
}

/** Apply a fixed-amount discount capped at subtotal. */
export function applyFixedDiscount(subtotalCents: number, discountCents: number): number {
  if (discountCents < 0) throw new Error('discountCents must be non-negative');
  return Math.min(subtotalCents, discountCents);
}

/** Compute the cart subtotal from a list of { unitPriceCents, quantity }. */
export function computeSubtotal(
  items: ReadonlyArray<{ unitPriceCents: number; quantity: number }>,
): number {
  return sumCents(items.map((i) => timesCents(i.unitPriceCents, i.quantity)));
}

/** Compute total = subtotal + shipping + tax - discount. */
export interface TotalsInput {
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  discountCents: number;
}

export function computeTotal(input: TotalsInput): number {
  return (
    Math.max(0, input.subtotalCents) +
    Math.max(0, input.shippingCents) +
    Math.max(0, input.taxCents) -
    Math.max(0, input.discountCents)
  );
}

/** Format cents as a localized currency string. */
export function formatMoney(cents: number, currency: Currency, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(cents / 100);
}