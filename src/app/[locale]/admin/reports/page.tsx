import Link from 'next/link';
import { salesByDay, topProducts } from '@/lib/services/reports';
import { formatMoney } from '@/lib/money';
import { compareBy, parseSort, type SearchParams } from '@/lib/table-sort';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import { SortableHead } from '@/components/data-table/sortable-head';

// Both tables share `?sort=`; keys are disjoint so each falls back to its default.
const DAY_KEYS = ['day', 'orders', 'revenue'] as const;
const PRODUCT_KEYS = ['product', 'units', 'sales'] as const;

function Bar({ value, max }: { value: number; max: number }) {
  return (
    <div className="h-1.5 w-full min-w-16 overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-clay/80" style={{ width: `${Math.max(2, (value / max) * 100)}%` }} />
    </div>
  );
}

export default async function AdminReportsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const [series, top] = await Promise.all([salesByDay(30), topProducts(10)]);

  const daySort = parseSort(sp, DAY_KEYS, { key: 'day', dir: 'desc' });
  const productSort = parseSort(sp, PRODUCT_KEYS, { key: 'sales', dir: 'desc' });
  const days = [...series].sort(
    daySort.key === 'day'
      ? compareBy<(typeof series)[number]>((s) => s.day, daySort.dir)
      : daySort.key === 'orders'
        ? compareBy<(typeof series)[number]>((s) => s.orders, daySort.dir)
        : compareBy<(typeof series)[number]>((s) => s.totalCents, daySort.dir),
  );
  const products = [...top].sort(
    productSort.key === 'product'
      ? compareBy<(typeof top)[number]>((p) => p.product.name, productSort.dir)
      : productSort.key === 'units'
        ? compareBy<(typeof top)[number]>((p) => p.quantity, productSort.dir)
        : compareBy<(typeof top)[number]>((p) => p.totalCents, productSort.dir),
  );

  const revenue = series.reduce((n, s) => n + s.totalCents, 0);
  const orders = series.reduce((n, s) => n + s.orders, 0);
  const maxDay = Math.max(1, ...series.map((s) => s.totalCents));
  const maxProduct = Math.max(1, ...top.map((p) => p.totalCents));

  return (
    <>
      <PageHeader title="Reports" description="Paid sales and product performance over the last 30 days." />

      <dl className="grid grid-cols-3 divide-x rounded-xl border bg-card">
        {[
          { label: 'Revenue', value: formatMoney(revenue, 'USD') },
          { label: 'Orders', value: String(orders) },
          { label: 'Avg. order', value: formatMoney(orders ? Math.round(revenue / orders) : 0, 'USD') },
        ].map((m) => (
          <div key={m.label} className="px-4 py-4 sm:px-6">
            <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{m.label}</dt>
            <dd className="tabular mt-1 text-xl font-semibold sm:text-2xl">{m.value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 xl:items-start">
        <Card className="overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle>Sales by day</CardTitle>
            <CardDescription>Days with at least one paid order.</CardDescription>
          </CardHeader>
          {days.length === 0 ? (
            <EmptyState title="No paid orders yet" className="border-t" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead column="day" sort={daySort} params={sp} firstDir="desc">Day</SortableHead>
                  <SortableHead column="orders" sort={daySort} params={sp} firstDir="desc" align="right">Orders</SortableHead>
                  <SortableHead column="revenue" sort={daySort} params={sp} firstDir="desc" align="right">Revenue</SortableHead>
                  <TableHead className="hidden w-1/3 sm:table-cell"><span className="sr-only">Share</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {days.map((s) => (
                  <TableRow key={s.day}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{s.day}</TableCell>
                    <TableCell className="text-right">{s.orders}</TableCell>
                    <TableCell className="text-right font-medium">{formatMoney(s.totalCents, 'USD')}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Bar value={s.totalCents} max={maxDay} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle>Top products</CardTitle>
            <CardDescription>Ranked by revenue across all orders.</CardDescription>
          </CardHeader>
          {products.length === 0 ? (
            <EmptyState title="No sales yet" className="border-t" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead column="product" sort={productSort} params={sp}>Product</SortableHead>
                  <SortableHead column="units" sort={productSort} params={sp} firstDir="desc" align="right">Units</SortableHead>
                  <SortableHead column="sales" sort={productSort} params={sp} firstDir="desc" align="right">Revenue</SortableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.product.id}>
                    <TableCell className="max-w-[14rem]">
                      <Link href={`/admin/products/${p.product.id}/edit`} className="block truncate font-medium hover:underline">
                        {p.product.name}
                      </Link>
                      <div className="mt-1.5">
                        <Bar value={p.totalCents} max={maxProduct} />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{p.quantity}</TableCell>
                    <TableCell className="text-right font-medium">{formatMoney(p.totalCents, 'USD')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </>
  );
}
