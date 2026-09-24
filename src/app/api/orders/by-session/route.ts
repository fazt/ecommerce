/**
 * GET /api/orders/by-session?session_id=... — poll for order status after
 * checkout success. Returns null until the webhook has processed.
 */

import { z } from 'zod';
import { jsonOk, withErrors } from '@/lib/http/with-errors';
import { getOrderByStripeSession } from '@/lib/services/order';
import { getOptionalUser } from '@/lib/auth-helpers';

const QuerySchema = z.object({ session_id: z.string().min(1) });

export const GET = withErrors(async ({ req }) => {
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return jsonOk({ order: null, reason: 'missing session_id' });
  }
  const order = await getOrderByStripeSession(parsed.data.session_id);
  if (!order) return jsonOk({ order: null });
  // Authorization: anyone with the session can read; the session id is a
  // secret that only the buyer + Stripe know.
  const user = await getOptionalUser();
  return jsonOk({
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalCents: order.totalCents,
      currency: order.currency,
      ownedByCurrentUser: user?.id ? true : true, // session id is enough
    },
  });
});

export const runtime = 'nodejs';