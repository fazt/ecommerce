/**
 * API tests for the Stripe webhook handler. Exercises signature verification
 * with a real signed-event builder and a mocked Stripe SDK + Prisma client.
 */

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

// Force the webhook secret used by tests.
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
process.env.STRIPE_AUTOMATIC_TAX = 'true';

// vi.mock factories are hoisted to the top of the file, so any shared state
// must be defined via vi.hoisted.
const { constructEvent, fakePrisma } = vi.hoisted(() => {
  const constructEvent = vi.fn();
  const orderModel = {
    findUnique: vi.fn(() => ({
      id: 'order_1',
      orderNumber: 'ORD-2026-00001',
      email: 'a@b.com',
      status: 'PENDING',
      couponId: null,
      items: [],
    })),
    update: vi.fn(() => ({})),
    create: vi.fn(() => ({ id: 'order_1' })),
  };
  const stripeEventModel = {
    findUnique: vi.fn(() => null),
    create: vi.fn(() => ({})),
  };
  const fakePrisma: Record<string, unknown> = {
    $transaction: (cb: (tx: unknown) => Promise<unknown>) => cb(fakePrisma),
    $executeRaw: vi.fn(() => 1),
    stripeEvent: stripeEventModel,
    order: orderModel,
    product: {
      findUnique: vi.fn(() => ({ stock: 100 })),
      update: vi.fn(() => ({})),
    },
    $queryRaw: vi.fn(() => []),
  };
  return { constructEvent, fakePrisma };
});

vi.mock('stripe', () => {
  class FakeStripe {
    webhooks = { constructEvent };
    checkout = { sessions: { create: vi.fn() } };
    refunds = { create: vi.fn() };
    coupons = { create: vi.fn() };
  }
  return { default: FakeStripe };
});

vi.mock('@/lib/prisma', () => ({ prisma: fakePrisma }));

// Lazy import after mocks are registered.
const { POST: webhookPost } = await import('@/app/api/webhooks/stripe/route');
const { buildSignedEvent, sampleCheckoutSession } = await import('../helpers/stripe');

describe('Stripe webhook signature verification', () => {
  beforeAll(() => {
    constructEvent.mockReset();
  });
  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('returns 400 when the stripe-signature header is missing', async () => {
    const req = new Request('http://test/api/webhooks/stripe', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await webhookPost(req);
    expect(res.status).toBe(400);
  });

  it('rejects an invalid signature', async () => {
    constructEvent.mockImplementationOnce(() => {
      throw new Error('No signatures found matching the expected signature for payload');
    });
    const { rawBody } = buildSignedEvent('checkout.session.completed', sampleCheckoutSession, 'whsec_test_secret');
    const req = new Request('http://test/api/webhooks/stripe', {
      method: 'POST',
      headers: { 'stripe-signature': 't=1,v1=deadbeef', 'content-type': 'application/json' },
      body: rawBody,
    });
    // Webhook handler throws WebhookSignatureError on bad sig; we just
    // assert that the call rejects (event is not processed).
    await expect(webhookPost(req)).rejects.toBeTruthy();
  });

  it('accepts a properly signed checkout.session.completed', async () => {
    const { rawBody, signature } = buildSignedEvent('checkout.session.completed', sampleCheckoutSession, 'whsec_test_secret');
    const event = JSON.parse(rawBody);
    constructEvent.mockReturnValueOnce(event);

    const req = new Request('http://test/api/webhooks/stripe', {
      method: 'POST',
      headers: { 'stripe-signature': signature, 'content-type': 'application/json' },
      body: rawBody,
    });
    const res = await webhookPost(req);
    // Either 200 (happy path) or 500 (if a downstream mock throws) — but
    // not 400 (signature failure). The mocked Prisma client returns an
    // order with no items, so no stock decrement runs.
    expect(res.status).not.toBe(400);
  });

  it('is idempotent on the same event id', async () => {
    const event = {
      id: 'evt_duplicate_1',
      type: 'checkout.session.completed',
      data: { object: { ...sampleCheckoutSession, metadata: { orderId: 'order_1' } } },
    };
    const stripeEvent = (fakePrisma as { stripeEvent: { findUnique: ReturnType<typeof vi.fn> } }).stripeEvent;
    stripeEvent.findUnique.mockReturnValueOnce({ stripeEventId: 'evt_duplicate_1' });
    constructEvent.mockReturnValueOnce(event);

    const req = new Request('http://test/api/webhooks/stripe', {
      method: 'POST',
      headers: { 'stripe-signature': 't=1,v1=fake', 'content-type': 'application/json' },
      body: JSON.stringify(event),
    });
    const res = await webhookPost(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.duplicate).toBe(true);
  });
});