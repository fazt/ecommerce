import Link from 'next/link';
import { ArrowUpRight, PackageCheck, MessageSquareText, TriangleAlert } from 'lucide-react';
import { getDashboardKpis, salesByDay } from '@/lib/services/reports';
import { prisma } from '@/lib/prisma';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import { orderStatusLabel } from '@/components/order-status-badge';

/** Status → token colour for the stacked order bar. One hue family per meaning. */
const STATUS_TONE: Record<string, string> = {
  PENDING: 'bg-muted-foreground/30',
  PAID: 'bg-clay',
  PROCESSING: 'bg-clay/60',
  SHIPPED: 'bg-foreground/70',
  DELIVERED: 'bg-success',
  CANCELED: 'bg-destructive/60',
  FAILED: 'bg-destructive',
  REFUNDED: 'bg-warning/70',
  PARTIALLY_REFUNDED: 'bg-warning/40',
};

export default async function AdminDashboard() {
  const [kpis, series, pendingReviews] = await Promise.all([
    getDashboardKpis(),
    salesByDay(14),
    prisma.review.count({ where: { isApproved: false } }),
  ]);
  const count = (s: string) => kpis.ordersByStatus.find((g) => g.status === s)?.count ?? 0;
  const toFulfil = count('PAID') + count('PROCESSING');
  const lowStock = kpis.lowStock.filter((p) => p.stock < 5);
  const totalOrders = kpis.ordersByStatus.reduce((n, g) => n + g.count, 0);
  const maxDay = Math.max(1, ...series.map((s) => s.totalCents));

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* Focal: revenue */}
        <Card>
          <CardContent className="flex h-full flex-col gap-6 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Sales · last 30 days</p>
                <p className="tabular mt-2 text-4xl font-semibold tracking-tight">{formatMoney(kpis.salesLast30dCents, 'USD')}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  <span className="tabular font-medium text-foreground">{formatMoney(kpis.salesTodayCents, 'USD')}</span> today
                </p>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
                <Link href="/admin/reports">
                  Reports <ArrowUpRight />
                </Link>
              </Button>
            </div>
            <div className="mt-auto">
              <div className="flex h-20 items-end gap-1" aria-label="Paid sales, last 14 days" role="img">
                {series.length === 0 ? (
                  <p className="self-center text-sm text-muted-foreground">No paid orders in the last two weeks.</p>
                ) : (
                  series.map((s) => (
                    <div
                      key={s.day}
                      title={`${s.day}: ${formatMoney(s.totalCents, 'USD')}`}
                      className="flex-1 rounded-sm bg-clay/80 transition-colors hover:bg-clay"
                      style={{ height: `${Math.max(4, (s.totalCents / maxDay) * 100)}%` }}
                    />
                  ))
                )}
              </div>
              {series.length > 0 ? (
                <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
                  <span>{series[0]!.day}</span>
                  <span>{series[series.length - 1]!.day}</span>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {/* Needs attention */}
        <div className="grid gap-3">
          <AttentionLink
            href="/admin/orders?status=PAID"
            icon={PackageCheck}
            value={toFulfil}
            label="orders to fulfil"
            hint="Paid or processing"
          />
          <AttentionLink
            href="/admin/reviews"
            icon={MessageSquareText}
            value={pendingReviews}
            label="reviews to moderate"
            hint="Waiting for approval"
          />
          <AttentionLink
            href="/admin/products?status=low"
            icon={TriangleAlert}
            value={lowStock.length}
            label="products low on stock"
            hint="Fewer than 5 units"
            tone="warning"
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Orders by status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {totalOrders === 0 ? (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              <>
                <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
                  {kpis.ordersByStatus.map((g) => (
                    <div
                      key={g.status}
                      className={STATUS_TONE[g.status] ?? 'bg-muted-foreground'}
                      style={{ width: `${(g.count / totalOrders) * 100}%` }}
                    />
                  ))}
                </div>
                <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  {[...kpis.ordersByStatus]
                    .sort((a, b) => b.count - a.count)
                    .map((g) => (
                      <li key={g.status}>
                        <Link
                          href={`/admin/orders?status=${g.status}`}
                          className="flex items-center gap-2 rounded-sm hover:text-foreground"
                        >
                          <span aria-hidden className={cn('size-2 rounded-full', STATUS_TONE[g.status])} />
                          <span className="text-muted-foreground">{orderStatusLabel(g.status)}</span>
                          <span className="tabular ml-auto font-medium">{g.count}</span>
                        </Link>
                      </li>
                    ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Lowest stock</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-2">
            {kpis.lowStock.length === 0 ? (
              <EmptyState title="No active products" className="py-8" />
            ) : (
              <ul className="divide-y">
                {kpis.lowStock.slice(0, 6).map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="flex items-center justify-between gap-4 px-6 py-2.5 text-sm transition-colors hover:bg-accent/50"
                    >
                      <span className="truncate">{p.name}</span>
                      <span
                        className={cn(
                          'tabular shrink-0 font-medium',
                          p.stock === 0 ? 'text-destructive' : p.stock < 5 ? 'text-warning' : 'text-muted-foreground',
                        )}
                      >
                        {p.stock === 0 ? 'Out' : `${p.stock} left`}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function AttentionLink({
  href,
  icon: Icon,
  value,
  label,
  hint,
  tone,
}: {
  href: string;
  icon: typeof PackageCheck;
  value: number;
  label: string;
  hint: string;
  tone?: 'warning';
}) {
  const hot = value > 0;
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-xl border bg-card px-5 py-4 transition-colors hover:border-foreground/20"
    >
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-lg',
          hot ? (tone === 'warning' ? 'bg-warning-soft text-warning' : 'bg-clay/10 text-clay') : 'bg-muted text-muted-foreground',
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-1.5">
          <span className="tabular text-xl font-semibold">{value}</span>
          <span className="truncate text-sm">{label}</span>
        </span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
      <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </Link>
  );
}
