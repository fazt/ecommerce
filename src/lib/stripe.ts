/**
 * Stripe SDK singleton. Centralises API version + secret key handling.
 */

import Stripe from 'stripe';

const secret = process.env.STRIPE_SECRET_KEY;
if (!secret && process.env.NODE_ENV === 'production') {
  throw new Error('STRIPE_SECRET_KEY is required in production');
}

export const stripe = new Stripe(secret ?? 'sk_test_placeholder', {
  apiVersion: '2026-08-26.dahlia' as Stripe.LatestApiVersion,
  typescript: true,
  appInfo: {
    name: 'ecommerce',
    version: '0.1.0',
  },
});

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? '';
export const STRIPE_AUTOMATIC_TAX = process.env.STRIPE_AUTOMATIC_TAX === 'true';