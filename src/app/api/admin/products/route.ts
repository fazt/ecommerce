/**
 * POST /api/admin/products — create product.
 * GET  /api/admin/products — list (paginated).
 */

import { withRole } from '@/lib/http/with-auth';
import { withCsrf } from '@/lib/http/with-csrf';
import { zodParse } from '@/lib/http/zod-parse';
import { jsonOk } from '@/lib/http/with-errors';
import { ProductCreateSchema } from '@/lib/validators/product';
import { prisma } from '@/lib/prisma';
import { writeAudit } from '@/lib/audit';
import { requireRole } from '@/lib/auth-helpers';

export const POST = withCsrf(withRole(['ADMIN', 'SUPER_ADMIN'], async ({ req }, _params) => {
  const sessionUser = await requireRole(['ADMIN', 'SUPER_ADMIN']);
  const input = await zodParse(req, ProductCreateSchema);
  const { images, ...data } = input;
  const created = await prisma.product.create({
    data: {
      ...data,
      images: { create: images.map((i) => ({ url: i.url, alt: i.alt, position: i.position })) },
    },
    include: { images: true },
  });
  await writeAudit({
    userId: sessionUser.id,
    action: 'product.created',
    entity: 'Product',
    entityId: created.id,
    changes: { slug: created.slug, name: created.name },
  });
  return jsonOk(created);
}));

export const GET = withRole(['ADMIN', 'SUPER_ADMIN'], async ({ req }) => {
  const url = new URL(req.url);
  const page = Number(url.searchParams.get('page') ?? '1');
  const pageSize = Math.min(Number(url.searchParams.get('pageSize') ?? '20'), 100);
  const [items, total] = await Promise.all([
    prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { category: true, _count: { select: { reviews: true, orderItems: true } } },
    }),
    prisma.product.count(),
  ]);
  return jsonOk({ items, total, page, pageSize });
});

export const runtime = 'nodejs';