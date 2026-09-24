'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Trash2, Loader2, Tag, X, Minus, Plus, ArrowRight, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { SummaryRow } from '@/components/summary-row';
import { formatMoney } from '@/lib/money';

interface CartItemView {
  itemId: string;
  productId: string;
  name: string;
  slug: string;
  unitPriceCents: number;
  quantity: number;
  image: string | null;
  stock: number;
}

interface CartView {
  id: string;
  items: CartItemView[];
  couponCode: string | null;
  totals: { subtotalCents: number; shippingCents: number; taxCents: number; discountCents: number; totalCents: number };
}

export function CartView({ initial }: { initial: CartView }) {
  const router = useRouter();
  const [cart, setCart] = useState<CartView>(initial);
  const [coupon, setCoupon] = useState('');
  const [busyItem, setBusyItem] = useState<string | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);

  async function updateQty(itemId: string, quantity: number) {
    setBusyItem(itemId);
    const res = await fetch(`/api/cart/items/${itemId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ quantity }),
    });
    setBusyItem(null);
    if (res.ok) {
      setCart(await res.json());
      window.dispatchEvent(new CustomEvent('cart:updated'));
      router.refresh();
    } else toast.error('Could not update quantity');
  }

  async function remove(item: CartItemView) {
    setBusyItem(item.itemId);
    const res = await fetch(`/api/cart/items/${item.itemId}`, { method: 'DELETE' });
    setBusyItem(null);
    if (res.ok) {
      setCart(await res.json());
      window.dispatchEvent(new CustomEvent('cart:updated'));
      toast.success(`${item.name} removed`);
      router.refresh();
    } else toast.error('Could not remove item');
  }

  async function applyCoupon(e: React.FormEvent) {
    e.preventDefault();
    setCouponBusy(true);
    const res = await fetch('/api/cart/coupon', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: coupon.trim().toUpperCase() }),
    });
    setCouponBusy(false);
    if (res.ok) {
      setCart(await res.json());
      setCoupon('');
      toast.success('Coupon applied');
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err?.error?.message ?? 'Invalid coupon');
    }
  }

  async function removeCoupon() {
    setCouponBusy(true);
    const res = await fetch('/api/cart/coupon', { method: 'DELETE' });
    setCouponBusy(false);
    if (!res.ok) {
      toast.error('Could not remove coupon');
      return;
    }
    const next = await res.json().catch(() => null);
    setCart(next?.items ? next : { ...cart, couponCode: null });
    toast.success('Coupon removed');
  }

  if (cart.items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-sm text-muted-foreground">Your cart is empty now.</p>
          <Button asChild>
            <Link href="/products">Continue shopping</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <ul className="divide-y border-y">
        {cart.items.map((it) => {
          const busy = busyItem === it.itemId;
          return (
            <li key={it.itemId} className="flex gap-4 py-5">
              <Link
                href={`/products/${it.slug}`}
                className="size-24 shrink-0 overflow-hidden rounded-lg bg-muted outline outline-1 -outline-offset-1 outline-black/5 dark:outline-white/10"
              >
                {it.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.image} alt={it.name} className="size-full object-cover" />
                ) : null}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Link href={`/products/${it.slug}`} className="line-clamp-2 text-sm font-medium hover:underline">
                      {it.name}
                    </Link>
                    <p className="tabular mt-0.5 text-xs text-muted-foreground">
                      {formatMoney(it.unitPriceCents, 'USD')} each
                      {it.stock <= 5 ? <span className="text-warning"> · only {it.stock} left</span> : null}
                    </p>
                  </div>
                  <p className="tabular text-sm font-semibold">{formatMoney(it.unitPriceCents * it.quantity, 'USD')}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center rounded-md border" role="group" aria-label={`Quantity for ${it.name}`}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-r-none"
                      disabled={busy || it.quantity <= 1}
                      onClick={() => updateQty(it.itemId, it.quantity - 1)}
                      aria-label="Decrease quantity"
                    >
                      <Minus />
                    </Button>
                    <span className="tabular flex w-9 items-center justify-center text-sm" aria-live="polite">
                      {busy ? <Loader2 className="size-3.5 animate-spin text-muted-foreground" /> : it.quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-l-none"
                      disabled={busy || it.quantity >= it.stock}
                      onClick={() => updateQty(it.itemId, it.quantity + 1)}
                      aria-label="Increase quantity"
                    >
                      <Plus />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy}
                    onClick={() => remove(it)}
                    className="h-8 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 /> Remove
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <Card className="lg:sticky lg:top-24">
        <CardContent className="space-y-5 p-6">
          <h2 className="text-base font-semibold">Order summary</h2>

          {cart.couponCode ? (
            <div className="flex items-center justify-between rounded-lg bg-success-soft px-3 py-2 text-sm">
              <span className="flex items-center gap-2 text-success">
                <Tag className="size-4" />
                <Badge variant="success" className="bg-background font-mono">
                  {cart.couponCode}
                </Badge>
              </span>
              <Button variant="ghost" size="icon" className="size-7" onClick={removeCoupon} disabled={couponBusy} aria-label="Remove coupon">
                <X />
              </Button>
            </div>
          ) : (
            <form onSubmit={applyCoupon} className="flex gap-2">
              <Input
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                placeholder="Promo code"
                aria-label="Promo code"
                className="font-mono uppercase placeholder:font-sans placeholder:normal-case"
              />
              <Button type="submit" disabled={couponBusy || !coupon.trim()} variant="outline">
                {couponBusy ? <Loader2 className="animate-spin" /> : 'Apply'}
              </Button>
            </form>
          )}

          <dl className="space-y-2">
            <SummaryRow label="Subtotal" value={formatMoney(cart.totals.subtotalCents, 'USD')} />
            {cart.totals.discountCents > 0 ? (
              <SummaryRow label="Discount" value={`−${formatMoney(cart.totals.discountCents, 'USD')}`} tone="success" />
            ) : null}
            <SummaryRow label="Shipping" value={cart.totals.shippingCents === 0 ? 'Calculated at checkout' : formatMoney(cart.totals.shippingCents, 'USD')} />
            <SummaryRow label="Tax" value={cart.totals.taxCents === 0 ? 'Calculated at checkout' : formatMoney(cart.totals.taxCents, 'USD')} />
            <Separator className="!my-3" />
            <SummaryRow label="Total" value={formatMoney(cart.totals.totalCents, 'USD')} total />
          </dl>

          <Button asChild className="w-full" size="lg">
            <Link href="/checkout">
              Checkout <ArrowRight />
            </Link>
          </Button>
          <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="size-3" /> Secure payment with Stripe
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
