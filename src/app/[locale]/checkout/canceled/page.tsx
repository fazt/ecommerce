import Link from 'next/link';
import { XCircle, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function CheckoutCanceledPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warning-soft">
            <XCircle className="h-9 w-9 text-warning" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Payment canceled</h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            Your cart has been preserved. You can try again whenever you&apos;re ready.
          </p>
          <Button asChild variant="outline" className="mt-2">
            <Link href="/cart">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to cart
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}