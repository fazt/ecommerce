import Link from 'next/link';
import { ArrowRight, ChevronRight, Package, Heart, MapPin } from 'lucide-react';
import { requireUser } from '@/lib/auth-helpers';
import { listOrdersForUser } from '@/lib/services/order';
import { prisma } from '@/lib/prisma';
import { formatMoney } from '@/lib/money';
import { formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import { OrderStatusBadge } from '@/components/order-status-badge';

const OPEN = ['PAID', 'PROCESSING', 'SHIPPED'];

export default async function AccountHome() {
  const user = await requireUser();
  const [recent, wishlist, addresses, dbUser] = await Promise.all([
    listOrdersForUser(user.id, 1, 5),
    prisma.wishlistItem.count({ where: { userId: user.id } }),
    prisma.address.count({ where: { userId: user.id } }),
    prisma.user.findUnique({ where: { id: user.id }, select: { name: true } }),
  ]);
  const inTransit = recent.items.find((o) => OPEN.includes(o.status));
  const firstName = dbUser?.name?.split(' ')[0];

  return (
    <>
      <PageHeader title={firstName ? `Hi, ${firstName}` : 'Your account'} description="Orders, addresses and saved items in one place." />

      {inTransit ? (
        <Link
          href={`/account/orders/${inTransit.orderNumber}`}
          className="group flex items-center gap-4 rounded-xl border border-clay/30 bg-clay/5 px-5 py-4 transition-colors hover:border-clay/50"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-clay text-clay-foreground">
            <Package className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">
              Order <span className="font-mono">{inTransit.orderNumber}</span> is on its way
            </span>
            <span className="block text-xs text-muted-foreground">Placed {formatDate(inTransit.createdAt)} · tap for tracking</span>
          </span>
          <OrderStatusBadge status={inTransit.status} />
          <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </Link>
      ) : null}

      <dl className="grid grid-cols-3 divide-x rounded-xl border bg-card">
        {[
          { label: 'Orders', value: recent.total, href: '/account/orders', icon: Package },
          { label: 'Saved items', value: wishlist, href: '/wishlist', icon: Heart },
          { label: 'Addresses', value: addresses, href: '/account/addresses', icon: MapPin },
        ].map((s) => (
          <Link key={s.label} href={s.href} className="group px-4 py-4 transition-colors first:rounded-l-xl last:rounded-r-xl hover:bg-accent/50 sm:px-6">
            <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              <s.icon className="size-3.5" /> {s.label}
            </dt>
            <dd className="tabular mt-1 text-2xl font-semibold">{s.value}</dd>
          </Link>
        ))}
      </dl>

      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Recent orders</CardTitle>
          {recent.items.length > 0 ? (
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
              <Link href="/account/orders">
                View all <ArrowRight />
              </Link>
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {recent.items.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No orders yet"
              action={
                <Button asChild>
                  <Link href="/products">Start shopping</Link>
                </Button>
              }
            />
          ) : (
            <ul className="divide-y border-t">
              {recent.items.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/account/orders/${o.orderNumber}`}
                    className="group grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 px-6 py-3 transition-colors hover:bg-accent/40"
                  >
                    <span className="min-w-0">
                      <span className="block font-mono text-[13px] font-medium">{o.orderNumber}</span>
                      <span className="block text-xs text-muted-foreground">{formatDate(o.createdAt)}</span>
                    </span>
                    <OrderStatusBadge status={o.status} />
                    <span className="tabular w-20 text-right text-sm font-medium">{formatMoney(o.totalCents, o.currency as 'USD')}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
