/**
 * Tax helpers. The actual tax computation happens server-side via Stripe Tax
 * (automatic_tax: { enabled: true }). This module provides utility helpers
 * for displaying tax on order confirmations and reports.
 */

export interface TaxBreakdown {
  /** Total tax in minor units (cents). */
  taxCents: number;
  /** Map of jurisdiction → cents. */
  byJurisdiction: Record<string, number>;
}

/** Empty breakdown used as a fallback. */
export const emptyTaxBreakdown: TaxBreakdown = { taxCents: 0, byJurisdiction: {} };

/**
 * Normalise a Stripe Tax `tax_amount_exclusive` / `tax_breakdown` array into
 * the format this app uses internally.
 */
export function normaliseStripeTax(taxTotalCents: number, breakdown?: Array<{ jurisdiction?: { display_name?: string }; amount?: number }>): TaxBreakdown {
  const byJurisdiction: Record<string, number> = {};
  if (breakdown) {
    for (const b of breakdown) {
      const name = b.jurisdiction?.display_name ?? 'Unknown';
      byJurisdiction[name] = (byJurisdiction[name] ?? 0) + (b.amount ?? 0);
    }
  }
  return { taxCents: taxTotalCents, byJurisdiction };
}