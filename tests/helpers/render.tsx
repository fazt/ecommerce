/**
 * Component test wrapper. Provides next-intl + a mock session.
 */

import { NextIntlClientProvider } from 'next-intl';
import { SessionProvider } from 'next-auth/react';
import { render, type RenderOptions } from '@testing-library/react';
import enMessages from '../../messages/en.json';

export function renderWithProviders(ui: React.ReactNode, options?: RenderOptions) {
  return render(
    <SessionProvider session={null}>
      <NextIntlClientProvider locale="en" messages={enMessages}>
        {ui}
      </NextIntlClientProvider>
    </SessionProvider>,
    options,
  );
}