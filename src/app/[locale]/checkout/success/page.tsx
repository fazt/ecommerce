import Link from 'next/link';
import { Suspense } from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { OrderStatusPoller } from '@/components/checkout/order-status-poller';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-soft">
            <CheckCircle2 className="h-9 w-9 text-success" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Order placed!</h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            Thanks for your order. We&apos;ll send you a confirmation email with tracking details shortly.
          </p>
          {params.session_id ? (
            <Suspense fallback={<p className="text-sm text-muted-foreground">Finalizing your order…</p>}>
              <OrderStatusPoller sessionId={params.session_id} />
            </Suspense>
          ) : null}
          <Button asChild className="mt-2">
            <Link href="/account/orders">
              View my orders <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}