/**
 * Currency helpers (formatting and user preference).
 */

import type { Currency } from './money';

export const CURRENCY_LOCALE_DEFAULTS: Record<Currency, string> = {
  USD: 'en-US',
  EUR: 'es-ES',
  GBP: 'en-GB',
  CAD: 'en-CA',
  MXN: 'es-MX',
};

export function formatCurrency(amountCents: number, currency: Currency, locale?: string): string {
  const resolvedLocale = locale ?? CURRENCY_LOCALE_DEFAULTS[currency];
  return new Intl.NumberFormat(resolvedLocale, {
    style: 'currency',
    currency,
  }).format(amountCents / 100);
}

export function isSupportedCurrency(value: string | null | undefined): value is Currency {
  if (!value) return false;
  return ['USD', 'EUR', 'GBP', 'CAD', 'MXN'].includes(value);
}