import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { ChevronRight, Package } from 'lucide-react';
import { requireUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { formatMoney } from '@/lib/money';
import { formatDate } from '@/lib/utils';
import { parseSort, type SearchParams } from '@/lib/table-sort';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import { OrderStatusBadge } from '@/components/order-status-badge';
import { SortableHead } from '@/components/data-table/sortable-head';

const SORT_KEYS = ['number', 'date', 'status', 'items', 'total'] as const;

export default async function OrdersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const sort = parseSort(sp, SORT_KEYS, { key: 'date', dir: 'desc' });
  const orderBy: Prisma.OrderOrderByWithRelationInput = {
    number: { orderNumber: sort.dir },
    date: { createdAt: sort.dir },
    status: { status: sort.dir },
    items: { items: { _count: sort.dir } },
    total: { totalCents: sort.dir },
  }[sort.key];

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: [orderBy, { id: 'asc' }],
    select: {
      id: true,
      orderNumber: true,
      status: true,
      totalCents: true,
      currency: true,
      createdAt: true,
      _count: { select: { items: true } },
    },
  });

  return (
    <>
      <PageHeader
        title="Orders"
        description={orders.length === 0 ? 'Your order history.' : `${orders.length} ${orders.length === 1 ? 'order' : 'orders'} placed`}
      />
      <Card className="overflow-hidden">
        {orders.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No orders yet"
            description="When you place an order it will appear here with its tracking details."
            action={
              <Button asChild>
                <Link href="/products">Start shopping</Link>
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHead column="number" sort={sort} params={sp}>Order</SortableHead>
                <SortableHead column="date" sort={sort} params={sp} firstDir="desc">Placed</SortableHead>
                <SortableHead column="status" sort={sort} params={sp} className="hidden sm:table-cell">Status</SortableHead>
                <SortableHead column="items" sort={sort} params={sp} firstDir="desc" align="right" className="hidden md:table-cell">Items</SortableHead>
                <SortableHead column="total" sort={sort} params={sp} firstDir="desc" align="right">Total</SortableHead>
                <TableHead className="w-0"><span className="sr-only">Open</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id} className="group relative">
                  <TableCell>
                    <Link
                      href={`/account/orders/${o.orderNumber}`}
                      className="font-mono text-[13px] font-medium after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-ring"
                    >
                      {o.orderNumber}
                    </Link>
                    <div className="mt-1 sm:hidden">
                      <OrderStatusBadge status={o.status} />
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(o.createdAt)}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <OrderStatusBadge status={o.status} />
                  </TableCell>
                  <TableCell className="hidden text-right text-muted-foreground md:table-cell">{o._count.items}</TableCell>
                  <TableCell className="text-right font-medium">{formatMoney(o.totalCents, o.currency as 'USD')}</TableCell>
                  <TableCell className="pr-3">
                    <ChevronRight aria-hidden className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </>
  );
}
