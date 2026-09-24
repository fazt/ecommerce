/**
 * POST /api/checkout/session — create a Stripe Checkout Session for the
 * current user's cart.
 */

import { withAuth } from '@/lib/http/with-auth';
import { withCsrf } from '@/lib/http/with-csrf';
import { zodParse } from '@/lib/http/zod-parse';
import { jsonOk } from '@/lib/http/with-errors';
import { CheckoutSessionSchema } from '@/lib/validators/checkout';
import { createStripeCheckoutSession } from '@/lib/services/checkout';
import { requireUser } from '@/lib/auth-helpers';

export const POST = withCsrf(withAuth(async ({ req }) => {
  const user = await requireUser();
  const input = await zodParse(req, CheckoutSessionSchema);
  const result = await createStripeCheckoutSession(user.id, input);
  return jsonOk(result);
}));

export const runtime = 'nodejs';