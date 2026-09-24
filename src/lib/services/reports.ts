/**
 * Reports service. Aggregations for the admin dashboard.
 */

import { prisma } from '../prisma';
import type { OrderStatus } from '@prisma/client';

export interface DashboardKpis {
  salesTodayCents: number;
  salesLast30dCents: number;
  ordersByStatus: Array<{ status: OrderStatus; count: number }>;
  lowStock: Array<{ id: string; slug: string; name: string; stock: number }>;
}

export async function getDashboardKpis(): Promise<DashboardKpis> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [salesToday, sales30, statusGroups, lowStock] = await Promise.all([
    prisma.order.aggregate({
      _sum: { totalCents: true },
      where: { paidAt: { gte: startOfDay }, status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } },
    }),
    prisma.order.aggregate({
      _sum: { totalCents: true },
      where: { paidAt: { gte: last30 }, status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } },
    }),
    prisma.order.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { stock: 'asc' },
      take: 10,
    }),
  ]);

  return {
    salesTodayCents: salesToday._sum.totalCents ?? 0,
    salesLast30dCents: sales30._sum.totalCents ?? 0,
    ordersByStatus: statusGroups.map((g) => ({ status: g.status as OrderStatus, count: g._count._all })),
    lowStock: lowStock.map((p) => ({ id: p.id, slug: p.slug, name: p.name, stock: p.stock })),
  };
}

export async function salesByDay(days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  // Raw query for date-bucketed aggregation.
  const rows = await prisma.$queryRaw<Array<{ day: Date; total: bigint; orders: number }>>`
    SELECT date_trunc('day', "paidAt") AS day,
           SUM("totalCents")::bigint AS total,
           COUNT(*)::int AS orders
    FROM "Order"
    WHERE "paidAt" >= ${since}
      AND "status" IN ('PAID','PROCESSING','SHIPPED','DELIVERED')
    GROUP BY day
    ORDER BY day ASC
  `;
  return rows.map((r) => ({
    day: r.day.toISOString().slice(0, 10),
    totalCents: Number(r.total),
    orders: r.orders,
  }));
}

export async function topProducts(limit = 10) {
  const rows = await prisma.orderItem.groupBy({
    by: ['productId'],
    _sum: { quantity: true, totalCents: true },
    orderBy: { _sum: { totalCents: 'desc' } },
    take: limit,
  });
  const productIds = rows.map((r) => r.productId).filter((id): id is string => Boolean(id));
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, slug: true, name: true },
  });
  const map = new Map(products.map((p) => [p.id, p]));
  return rows
    .filter((r) => r.productId && map.has(r.productId))
    .map((r) => ({
      product: map.get(r.productId!)!,
      quantity: r._sum.quantity ?? 0,
      totalCents: r._sum.totalCents ?? 0,
    }));
}