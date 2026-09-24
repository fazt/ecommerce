'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Truck, Undo2, Loader2 } from 'lucide-react';
import type { OrderStatus } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { orderStatusLabel } from '@/components/order-status-badge';

/** Forward transitions offered from each status; staff can still cancel any open order. */
const NEXT: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PENDING: ['CANCELED'],
  PAID: ['PROCESSING', 'SHIPPED', 'CANCELED'],
  PROCESSING: ['SHIPPED', 'CANCELED'],
  SHIPPED: ['DELIVERED'],
};

export function AdminOrderActions({
  orderId,
  status,
  totalCents,
}: {
  orderId: string;
  status: OrderStatus;
  totalCents: number;
}) {
  const router = useRouter();
  const [carrier, setCarrier] = useState('ups');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState((totalCents / 100).toFixed(2));

  async function setStatus(s: OrderStatus) {
    setBusy(s);
    const res = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: s }),
    });
    setBusy(null);
    if (res.ok) {
      toast.success(`Order marked ${orderStatusLabel(s).toLowerCase()}`);
      router.refresh();
    } else toast.error('Could not update status');
  }

  async function ship(e: React.FormEvent) {
    e.preventDefault();
    setBusy('ship');
    const res = await fetch(`/api/admin/orders/${orderId}/tracking`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ carrierName: carrier, trackingNumber }),
    });
    setBusy(null);
    if (res.ok) {
      toast.success('Tracking saved');
      setTrackingNumber('');
      router.refresh();
    } else toast.error('Could not save tracking');
  }

  async function refund(e: React.FormEvent) {
    e.preventDefault();
    const cents = Math.round(Number(refundAmount) * 100);
    if (!Number.isFinite(cents) || cents < 1 || cents > totalCents) {
      toast.error('Enter an amount between $0.01 and the order total');
      return;
    }
    setBusy('refund');
    const res = await fetch(`/api/admin/orders/${orderId}/refund`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ amountCents: cents, restock: false }),
    });
    setBusy(null);
    if (res.ok) {
      toast.success('Refund issued');
      setRefundOpen(false);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data?.error?.message ?? 'Refund failed');
    }
  }

  const next = NEXT[status] ?? [];
  const canShip = ['PAID', 'PROCESSING', 'SHIPPED'].includes(status);
  const canRefund = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'PARTIALLY_REFUNDED'].includes(
    status,
  );

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Fulfilment</CardTitle>
        <CardDescription>Currently {orderStatusLabel(status).toLowerCase()}.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {next.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {next.map((s) => (
              <Button
                key={s}
                variant={s === 'CANCELED' ? 'ghost' : s === next[0] ? 'default' : 'outline'}
                size="sm"
                disabled={busy !== null}
                onClick={() => setStatus(s)}
                className={s === 'CANCELED' ? 'text-destructive hover:text-destructive' : undefined}
              >
                {busy === s ? <Loader2 className="animate-spin" /> : null}
                {s === 'CANCELED' ? 'Cancel order' : `Mark ${orderStatusLabel(s).toLowerCase()}`}
              </Button>
            ))}
          </div>
        ) : null}

        {canShip ? (
          <form onSubmit={ship} className="space-y-2">
            <Label htmlFor="tracking">Tracking</Label>
            <div className="flex gap-2">
              <Select value={carrier} onValueChange={setCarrier}>
                <SelectTrigger className="w-28 shrink-0" aria-label="Carrier">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ups">UPS</SelectItem>
                  <SelectItem value="usps">USPS</SelectItem>
                  <SelectItem value="fedex">FedEx</SelectItem>
                  <SelectItem value="dhl">DHL</SelectItem>
                </SelectContent>
              </Select>
              <Input
                id="tracking"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="1Z999AA10123456784"
                className="font-mono text-[13px]"
              />
            </div>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={busy !== null || !trackingNumber}
              className="w-full"
            >
              {busy === 'ship' ? <Loader2 className="animate-spin" /> : <Truck />}
              {status === 'SHIPPED' ? 'Update tracking' : 'Save tracking & mark shipped'}
            </Button>
          </form>
        ) : null}

        {canRefund ? (
          <>
            <Separator />
            <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive w-full"
                >
                  <Undo2 /> Issue refund…
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-sm">
                <form onSubmit={refund} className="space-y-5">
                  <DialogHeader>
                    <DialogTitle>Issue a refund</DialogTitle>
                    <DialogDescription>
                      The amount is returned to the customer’s card through Stripe. This can’t be
                      undone.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2">
                    <Label htmlFor="refund-amount">Amount (USD)</Label>
                    <div className="relative">
                      <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">
                        $
                      </span>
                      <Input
                        id="refund-amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={(totalCents / 100).toFixed(2)}
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(e.target.value)}
                        className="tabular pl-7"
                        autoFocus
                      />
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Order total ${(totalCents / 100).toFixed(2)}
                    </p>
                  </div>
                  <DialogFooter className="gap-2">
                    <Button type="button" variant="outline" onClick={() => setRefundOpen(false)}>
                      Keep order
                    </Button>
                    <Button type="submit" variant="destructive" disabled={busy === 'refund'}>
                      {busy === 'refund' ? <Loader2 className="animate-spin" /> : null}
                      Refund ${Number(refundAmount || 0).toFixed(2)}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
