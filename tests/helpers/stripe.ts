/**
 * Stripe webhook event builders for tests.
 */

import crypto from 'node:crypto';

export interface SignedEvent<T = unknown> {
  rawBody: string;
  signature: string;
  event: { id: string; type: string; data: { object: T } };
}

export function buildSignedEvent<T>(type: string, object: T, secret: string, id?: string): SignedEvent<T> {
  const event = {
    id: id ?? `evt_${crypto.randomBytes(8).toString('hex')}`,
    type,
    data: { object },
  };
  const rawBody = JSON.stringify(event);
  const ts = Math.floor(Date.now() / 1000);
  const sig = crypto
    .createHmac('sha256', secret)
    .update(`${ts}.${rawBody}`)
    .digest('hex');
  const header = `t=${ts},v1=${sig}`;
  return { rawBody, signature: header, event };
}

export const sampleCheckoutSession = {
  id: 'cs_test_123',
  object: 'checkout.session',
  amount_total: 5000,
  payment_intent: 'pi_test_123',
  customer: 'cus_test_123',
  metadata: { orderId: 'order_1' },
  payment_status: 'paid',
  status: 'complete',
  total_details: { amount_tax: 400, amount_shipping: 500 },
} as const;