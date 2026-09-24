import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, ExternalLink, Truck } from 'lucide-react';
import { requireUser } from '@/lib/auth-helpers';
import { getOrderByNumber } from '@/lib/services/order';
import { formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OrderStatusBadge } from '@/components/order-status-badge';
import { OrderSummary, AddressBlock } from '@/components/order-summary';
import { awaitParams } from '@/lib/next-params';
import { cn } from '@/lib/utils';

const STEPS = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] as const;

export default async function OrderDetailPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const user = await requireUser();
  const { orderNumber } = await awaitParams(params);
  const order = await getOrderByNumber(orderNumber, user.id);
  if (!order) notFound();
  const step = STEPS.indexOf(order.status as (typeof STEPS)[number]);

  return (
    <>
      <div className="space-y-3">
        <Button variant="ghost" size="sm" asChild className="-ml-3 text-muted-foreground">
          <Link href="/account/orders">
            <ChevronLeft /> Orders
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-2xl font-semibold tracking-tight">{order.orderNumber}</h1>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="text-sm text-muted-foreground">Placed {formatDate(order.createdAt)}</p>
      </div>

      {step >= 0 ? (
        <Card>
          <CardContent className="p-5">
            <ol className="grid grid-cols-4 gap-2" aria-label="Order progress">
              {STEPS.map((s, i) => (
                <li key={s} className="space-y-2" aria-current={i === step ? 'step' : undefined}>
                  <div className={cn('h-1 rounded-full', i <= step ? 'bg-clay' : 'bg-muted')} />
                  <p className={cn('text-xs', i <= step ? 'font-medium text-foreground' : 'text-muted-foreground')}>
                    {s === 'PAID' ? 'Confirmed' : s.charAt(0) + s.slice(1).toLowerCase()}
                  </p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderSummary order={order} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          {order.trackingNumber ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Truck className="size-4 text-muted-foreground" /> Tracking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="font-medium uppercase">{order.carrierName}</p>
                  <p className="break-all font-mono text-xs text-muted-foreground">{order.trackingNumber}</p>
                </div>
                {order.trackingUrl ? (
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <a href={order.trackingUrl} target="_blank" rel="noreferrer">
                      Track package <ExternalLink />
                    </a>
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Shipping to</CardTitle>
            </CardHeader>
            <CardContent>
              <AddressBlock address={order.shippingAddress} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
