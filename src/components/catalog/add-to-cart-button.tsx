'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { ShoppingCart, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AddToCartButton({ productId, disabled }: { productId: string; disabled?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function add() {
    setBusy(true);
    try {
      const res = await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      if (res.status === 401) {
        toast.error('Please sign in to add items to your cart.');
        window.location.href = '/auth/login?callbackUrl=' + encodeURIComponent(window.location.pathname);
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error?.message ?? 'Could not add to cart');
        return;
      }
      toast.success('Added to cart');
      setDone(true);
      setTimeout(() => setDone(false), 1500);
      window.dispatchEvent(new CustomEvent('cart:updated'));
    } finally {
      setBusy(false);
    }
  }

  if (disabled) {
    return (
      <Button size="lg" disabled variant="secondary" className="w-full">
        Out of stock
      </Button>
    );
  }
  return (
    <Button size="lg" onClick={add} disabled={busy} className="w-full">
      {busy ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding…
        </>
      ) : done ? (
        <>
          <Check className="mr-2 h-4 w-4" /> Added!
        </>
      ) : (
        <>
          <ShoppingCart className="mr-2 h-4 w-4" /> Add to cart
        </>
      )}
    </Button>
  );
}