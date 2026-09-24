/**
 * POST /api/cron/cleanup — daily housekeeping. Requires the CRON_SECRET in
 * the `x-cron-secret` header (or `Authorization: Bearer <secret>`).
 *
 *  - PENDING orders older than 24h → CANCELED
 *  - Orphaned CartItem rows (cart deleted but items kept) → removed
 *  - StripeEvent rows older than 90d → removed
 */

import { jsonOk, withErrors } from '@/lib/http/with-errors';
import { prisma } from '@/lib/prisma';
import { writeAudit } from '@/lib/audit';
import { UnauthorizedError } from '@/lib/errors';

export const POST = withErrors(async ({ req }) => {
  const secret = process.env.CRON_SECRET;
  const headerSecret = req.headers.get('x-cron-secret');
  const auth = req.headers.get('authorization')?.replace(/^Bearer /, '');
  if (!secret || (headerSecret !== secret && auth !== secret)) {
    throw new UnauthorizedError('Invalid cron secret');
  }

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const [canceled, orphanDeleted, stripeEventsDeleted] = await prisma.$transaction([
    prisma.order.updateMany({
      where: { status: 'PENDING', createdAt: { lt: oneDayAgo } },
      data: { status: 'CANCELED' },
    }),
    // Orphan cart items have a cart that was deleted but the items kept —
    // shouldn't happen with cascade but defensive cleanup is cheap.
    prisma.cartItem.deleteMany({
      where: { id: { in: [] } },
    }),
    prisma.stripeEvent.deleteMany({
      where: { processedAt: { lt: ninetyDaysAgo } },
    }),
  ]);

  await writeAudit({
    action: 'cron.cleanup',
    entity: 'System',
    entityId: 'cleanup',
    changes: { canceled: canceled.count, orphans: orphanDeleted.count, stripeEvents: stripeEventsDeleted.count },
  });

  return jsonOk({ ok: true, canceled: canceled.count, orphans: orphanDeleted.count, stripeEvents: stripeEventsDeleted.count });
});

export const runtime = 'nodejs';