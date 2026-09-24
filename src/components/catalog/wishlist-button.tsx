'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function WishlistButton({
  productId,
  initialSaved,
  variant = 'full',
}: {
  productId: string;
  initialSaved: boolean;
  variant?: 'full' | 'icon';
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const next = !saved;
    setSaved(next); // optimistic
    const res = next
      ? await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ productId }),
        })
      : await fetch(`/api/wishlist/${productId}`, { method: 'DELETE' });
    setBusy(false);
    if (res.status === 401) {
      setSaved(!next);
      window.location.href = '/auth/login?callbackUrl=' + encodeURIComponent(window.location.pathname);
      return;
    }
    if (!res.ok) {
      setSaved(!next);
      toast.error('Could not update your wishlist');
      return;
    }
    toast.success(next ? 'Saved to wishlist' : 'Removed from wishlist');
    router.refresh();
  }

  const label = saved ? 'Remove from wishlist' : 'Save to wishlist';
  return (
    <Button
      type="button"
      variant="outline"
      size={variant === 'icon' ? 'icon' : 'lg'}
      onClick={toggle}
      disabled={busy}
      aria-pressed={saved}
      aria-label={variant === 'icon' ? label : undefined}
      className={cn(variant === 'icon' ? 'size-11 shrink-0' : 'w-full', saved && 'text-clay hover:text-clay')}
    >
      <Heart className={cn('transition-transform', saved && 'fill-current')} />
      {variant === 'full' ? (saved ? 'Saved' : 'Save for later') : null}
    </Button>
  );
}
