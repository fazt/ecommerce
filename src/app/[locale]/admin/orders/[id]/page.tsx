import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, Truck } from 'lucide-react';
import { getOrderById } from '@/lib/services/order';
import { formatMoney } from '@/lib/money';
import { formatDateTime } from '@/lib/utils';
import { AdminOrderActions } from '@/components/admin/order-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OrderStatusBadge } from '@/components/order-status-badge';
import { OrderSummary, AddressBlock } from '@/components/order-summary';
import { awaitParams } from '@/lib/next-params';

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await awaitParams(params);
  const order = await getOrderById(id);
  if (!order) notFound();
  const cur = order.currency as 'USD';
  return (
    <>
      <div className="space-y-3">
        <Button variant="ghost" size="sm" asChild className="-ml-3 text-muted-foreground">
          <Link href="/admin/orders">
            <ChevronLeft /> Orders
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-2xl font-semibold tracking-tight">{order.orderNumber}</h1>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="text-sm text-muted-foreground">
          Placed {formatDateTime(order.createdAt)} by{' '}
          <span className="font-medium text-foreground">{order.user.name ?? order.user.email}</span>
          {order.user.name ? ` (${order.user.email})` : ''}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>
                {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OrderSummary order={order} />
            </CardContent>
          </Card>

          {order.refunds.length > 0 ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Refunds</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y text-sm">
                  {order.refunds.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-4 py-2.5">
                      <span className="tabular font-medium">{formatMoney(r.amountCents, cur)}</span>
                      <span className="capitalize text-muted-foreground">{r.status}</span>
                      <span className="truncate font-mono text-xs text-muted-foreground">{r.stripeRefundId}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <AdminOrderActions orderId={order.id} status={order.status} totalCents={order.totalCents} />
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Ship to</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <AddressBlock address={order.shippingAddress} />
              {order.trackingNumber ? (
                <div className="flex items-start gap-2.5 rounded-lg bg-muted/60 p-3 text-sm">
                  <Truck aria-hidden className="mt-0.5 size-4 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="font-medium uppercase">{order.carrierName}</p>
                    <p className="truncate font-mono text-xs text-muted-foreground">{order.trackingNumber}</p>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
