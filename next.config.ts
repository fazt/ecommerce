import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Server-only packages must stay on the Node server (not bundled to Edge).
  // Next.js 16 moved this from experimental to top-level.
  serverExternalPackages: [
    '@prisma/client',
    'prisma',
    'bcryptjs',
    'stripe',
    'pino',
    'pino-pretty',
    'resend',
  ],
  images: {
    remotePatterns: [
      // Add CDN providers when swapping the storage adapter.
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
      // Real product photography scraped from Unsplash for the demo dataset.
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  // Hide source maps in production for security.
  productionBrowserSourceMaps: false,
};

export default withNextIntl(nextConfig);