# Ecommerce

Production-ready ecommerce on Next.js 16 (App Router) + PostgreSQL + Prisma + Auth.js v5 + Stripe (Checkout + Tax + multi-currency) + Resend + next-intl + Vitest. No Server Actions — every mutation is a typed Route Handler under `src/app/api/**/route.ts`. Deployed-Vercel-ready, developed locally against the running PostgreSQL 17 service.

## Quick start

```bash
pnpm install
cp .env.example .env.local
# Fill in DATABASE_URL, AUTH_SECRET, STRIPE_*, RESEND_API_KEY, etc.
pnpm prisma:migrate
pnpm seed
pnpm dev
```

The seed script creates:
- 1 `SUPER_ADMIN` (`admin@example.com` / `admin1234`)
- 1 `ADMIN` (`manager@example.com` / `manager1234`)
- 2 `USER`s (`alice@example.com` / `alice1234`, `bob@example.com` / `bob1234`)
- 6 categories (with a parent + child hierarchy)
- 24 products with multiple images (placeholder URLs; replace via `/admin/products/[id]/edit`)
- 2 coupons (one percentage, one fixed)
- 2 shipping zones (US + EU) with 4 rates each

## Architecture

- **App Router** with `[locale]` segment (en, es).
- **`src/proxy.ts`** (Next.js 16 renamed from `middleware.ts`) composes Auth.js + next-intl.
- **Route Handlers** under `src/app/api/**/route.ts` (outside the `[locale]` segment) are the only mutation surface.
- **`src/lib/services/**`** is the only place that touches Prisma for writes; route handlers stay thin.
- **`src/lib/http/**`** wraps every handler with `withAuth`, `withCsrf`, `withRateLimit`, `withErrors`, `zodParse`.
- **`src/lib/storage/adapter.ts`** abstracts the storage backend (default: local disk under `public/uploads/`).

## Testing

```bash
pnpm test                 # unit + component (Vitest projects)
pnpm test:integration     # integration + api (uses pglite by default)
pnpm test:coverage        # v8 coverage with thresholds
```

Integration and API tests use pglite — an in-process Postgres build — so they run without the local service. Set `INTEGRATION_USE_DOCKER=1` to use `testcontainers-postgres` instead.

## Stripe webhooks (local)

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the `whsec_...` printed by Stripe CLI into `STRIPE_WEBHOOK_SECRET`.

## End-to-end smoke

1. Register an account at `/auth/register`.
2. Browse `/products`, open a PDP, add to cart.
3. Apply a coupon (try `WELCOME10` for 10% off, `FLAT5` for $5 off).
4. Click **Checkout**; use Stripe test card `4242 4242 4242 4242`, any future expiry, any CVC, any ZIP.
5. Webhook (via Stripe CLI) transitions the order to `PAID`, decrements stock, sends confirmation email.
6. Land on `/checkout/success`; the page polls until status is `PAID`, then redirects to `/account/orders/[orderNumber]`.
7. Log in as `admin@example.com`, mark the order `SHIPPED`, add a tracking number; the customer email is enqueued.

## Production deployment notes

- Set `AUTH_URL` to the public URL.
- Rotate `AUTH_SECRET`, `CSRF_SECRET`, `CRON_SECRET` (use `openssl rand -base64 32`).
- Configure Stripe Tax in the Stripe Dashboard and set `STRIPE_AUTOMATIC_TAX=true`.
- Configure Resend with a verified sending domain.
- If swapping the local storage adapter, implement `VercelBlobAdapter` (or `S3Adapter`) against `src/lib/storage/adapter.ts` and flip `storageAdapter` in `src/lib/storage/index.ts`.

## Project layout

See the canonical plan for the complete file map. Highlights:

```
src/
├── app/[locale]/        # App Router pages + API routes
├── auth.ts              # Auth.js v5
├── proxy.ts             # Next.js 16 proxy (auth + i18n)
├── lib/
│   ├── services/        # Business logic (writes)
│   ├── validators/      # zod schemas (single source of truth)
│   ├── http/            # Route handler wrappers
│   └── storage/         # StorageAdapter (local default)
├── components/          # UI components
└── i18n/                # next-intl config
```