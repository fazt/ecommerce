/**
 * next-intl server request config. Reads locale from the URL and loads
 * the right `messages/<lang>.json` file.
 */

import { getRequestConfig } from 'next-intl/server';
import { isLocale, DEFAULT_LOCALE } from '@/lib/i18n';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale: string = isLocale(requested ?? '') ? (requested as string) : DEFAULT_LOCALE;
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    // next-intl v4 uses `onError` for MISSING_MESSAGE handling. Returning
    // the key as the fallback lets the page render in dev while we still
    // see the key name in the console output.
    onError: () => undefined,
    getMessageFallback: ({ key }) => key,
  };
});