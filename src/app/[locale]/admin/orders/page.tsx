import Link from 'next/link';
import type { OrderStatus, Prisma } from '@prisma/client';
import { ShoppingBag, ChevronRight } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { formatMoney } from '@/lib/money';
import { formatDate } from '@/lib/utils';
import { param, parseSort, type SearchParams } from '@/lib/table-sort';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import { OrderStatusBadge, ORDER_STATUS_OPTIONS } from '@/components/order-status-badge';
import { SortableHead } from '@/components/data-table/sortable-head';
import { ClearFilters, TableFilter, TableSearch } from '@/components/data-table/table-toolbar';

const SORT_KEYS = ['number', 'customer', 'date', 'status', 'total'] as const;
const LIMIT = 100;

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const sort = parseSort(sp, SORT_KEYS, { key: 'date', dir: 'desc' });
  const q = param(sp, 'q');
  const status = param(sp, 'status');
  const validStatus = ORDER_STATUS_OPTIONS.some((o) => o.value === status) ? (status as OrderStatus) : undefined;

  const orderBy: Prisma.OrderOrderByWithRelationInput = {
    number: { orderNumber: sort.dir },
    customer: { email: sort.dir },
    date: { createdAt: sort.dir },
    status: { status: sort.dir },
    total: { totalCents: sort.dir },
  }[sort.key];

  const where: Prisma.OrderWhereInput = {
    ...(validStatus ? { status: validStatus } : {}),
    ...(q
      ? {
          OR: [
            { orderNumber: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { user: { email: { contains: q, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({ where, orderBy: [orderBy, { id: 'asc' }], include: { user: { select: { email: true } } }, take: LIMIT }),
    prisma.order.count({ where }),
  ]);
  const filtered = Boolean(q || validStatus);

  return (
    <>
      <PageHeader
        title="Orders"
        description={total > LIMIT ? `Showing ${LIMIT} of ${total} orders` : `${total} ${filtered ? 'matching' : ''} orders`}
      />
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-2 border-b p-3 sm:flex-row sm:items-center">
          <TableSearch placeholder="Order # or customer email…" />
          <TableFilter param="status" allLabel="All statuses" options={ORDER_STATUS_OPTIONS} />
          <ClearFilters params={['q', 'status', 'sort', 'dir']} />
        </div>
        {orders.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title={filtered ? 'No orders match' : 'No orders yet'}
            description={filtered ? 'Try another search term or status.' : 'Orders appear here as soon as customers check out.'}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHead column="number" sort={sort} params={sp}>Order</SortableHead>
                <SortableHead column="customer" sort={sort} params={sp} className="hidden md:table-cell">Customer</SortableHead>
                <SortableHead column="date" sort={sort} params={sp} firstDir="desc">Date</SortableHead>
                <SortableHead column="status" sort={sort} params={sp}>Status</SortableHead>
                <SortableHead column="total" sort={sort} params={sp} firstDir="desc" align="right">Total</SortableHead>
                <TableHead className="w-0"><span className="sr-only">Open</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id} className="group relative">
                  <TableCell>
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="font-mono text-[13px] font-medium after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-ring"
                    >
                      {o.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden max-w-[16rem] truncate text-muted-foreground md:table-cell">{o.user.email}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(o.createdAt)}</TableCell>
                  <TableCell>
                    <OrderStatusBadge status={o.status} />
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatMoney(o.totalCents, o.currency as 'USD')}</TableCell>
                  <TableCell className="pr-3 text-right">
                    <ChevronRight aria-hidden className="ml-auto size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
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
