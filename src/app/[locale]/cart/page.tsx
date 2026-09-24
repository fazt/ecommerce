import Link from 'next/link';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { getOptionalUser } from '@/lib/auth-helpers';
import { getCart } from '@/lib/services/cart';
import { CartView } from '@/components/cart/cart-view';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default async function CartPage() {
  const user = await getOptionalUser();
  const cart = user
    ? await getCart(user.id)
    : {
        items: [] as Awaited<ReturnType<typeof getCart>>['items'],
        couponCode: null as Awaited<ReturnType<typeof getCart>>['couponCode'],
        totals: { subtotalCents: 0, shippingCents: 0, taxCents: 0, discountCents: 0, totalCents: 0 },
        id: 'guest',
      };
  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <ShoppingBag className="h-8 w-8 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Your cart is empty</h1>
            <p className="max-w-sm text-sm text-muted-foreground">
              Browse our catalog and add some products to your cart to get started.
            </p>
            <Button asChild size="lg">
              <Link href="/products">
                Continue shopping <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:py-12">
      <div className="mb-8 space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Your cart</h1>
        <p className="text-sm text-muted-foreground">
          {(() => {
            const n = cart.items.reduce((sum, i) => sum + i.quantity, 0);
            return `${n} ${n === 1 ? 'item' : 'items'}`;
          })()}
        </p>
      </div>
      <CartView initial={cart} />
    </div>
  );
}