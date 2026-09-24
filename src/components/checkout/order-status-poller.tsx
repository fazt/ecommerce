'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export function OrderStatusPoller({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const tick = async () => {
      if (cancelled) return;
      attempts++;
      try {
        const res = await fetch(`/api/orders/by-session?session_id=${encodeURIComponent(sessionId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.order?.orderNumber) {
            router.push(`/account/orders/${data.order.orderNumber}`);
            return;
          }
        }
      } catch {
        // ignore
      }
      if (attempts < 20) setTimeout(tick, 1500);
    };
    setTimeout(tick, 1000);
    return () => {
      cancelled = true;
    };
  }, [router, sessionId]);

  return (
    <p className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" /> Finalizing your order…
    </p>
  );
}