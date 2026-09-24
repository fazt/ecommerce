/**
 * PATCH /api/admin/orders/[id]/status — admin updates an order status.
 */

import { withRole } from '@/lib/http/with-auth';
import { withCsrf } from '@/lib/http/with-csrf';
import { zodParse } from '@/lib/http/zod-parse';
import { jsonOk } from '@/lib/http/with-errors';
import { OrderStatusUpdateSchema } from '@/lib/validators/admin';
import { updateOrderStatus } from '@/lib/services/order';
import { requireRole } from '@/lib/auth-helpers';
import { awaitParams } from '@/lib/next-params';

export const PATCH = withCsrf(withRole(['ADMIN', 'SUPER_ADMIN'], async ({ req }, params) => {
  const sessionUser = await requireRole(['ADMIN', 'SUPER_ADMIN']);
  const { id } = await awaitParams(params as Promise<{ id: string }>);
  const input = await zodParse(req, OrderStatusUpdateSchema);
  const updated = await updateOrderStatus(id, input, sessionUser.id, clientIp(req), req.headers.get('user-agent') ?? undefined);
  return jsonOk(updated);
}));

function clientIp(req: Request): string | undefined {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined;
}

export const runtime = 'nodejs';