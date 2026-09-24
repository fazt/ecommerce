/**
 * Setup file for integration + API tests. Stubs environment variables and
 * (optionally) drops the test database between runs.
 */

// Cast through `any` so we can override the read-only NODE_ENV.
const env = process.env as Record<string, string | undefined>;
env.NODE_ENV = 'test';
env.AUTH_SECRET = env.AUTH_SECRET ?? 'test-auth-secret';
env.CSRF_SECRET = env.CSRF_SECRET ?? 'test-csrf-secret';
env.STRIPE_WEBHOOK_SECRET = env.STRIPE_WEBHOOK_SECRET ?? 'whsec_test';
env.STRIPE_SECRET_KEY = env.STRIPE_SECRET_KEY ?? 'sk_test_placeholder';
env.RESEND_API_KEY = env.RESEND_API_KEY ?? '';
env.CRON_SECRET = env.CRON_SECRET ?? 'test-cron';
env.STRIPE_AUTOMATIC_TAX = 'true';
env.DATABASE_URL = env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/ecommerce_test?schema=public';