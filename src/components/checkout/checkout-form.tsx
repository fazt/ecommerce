'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Loader2, MapPinOff, Lock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface CheckoutFormProps {
  addresses: Array<{
    id: string;
    label?: string | null;
    line1: string;
    city: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
  }>;
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  eligibleRates: Array<{
    id: string;
    name: string;
    description?: string | null;
    basePriceCents: number;
    perKgCents: number;
    deliveryDaysMin?: number | null;
    deliveryDaysMax?: number | null;
  }>;
  weightGrams: number;
  country: string;
}

function fmtUSD(cents: number): string {
  return cents === 0 ? 'Free' : `$${(cents / 100).toFixed(2)}`;
}

function computeShippingCents(
  rate: CheckoutFormProps['eligibleRates'][number] | undefined,
  weightGrams: number,
): number {
  if (!rate) return 0;
  return rate.basePriceCents + rate.perKgCents * Math.ceil(weightGrams / 1000);
}

export function CheckoutForm(props: CheckoutFormProps) {
  const { addresses, subtotalCents, discountCents, taxCents, eligibleRates, weightGrams } = props;
  const defaultAddr = addresses.find((a) => a.isDefault) ?? addresses[0];

  const [shippingAddressId, setShippingAddressId] = useState(defaultAddr?.id ?? '');
  const [billingAddressId, setBillingAddressId] = useState(defaultAddr?.id ?? '');
  const [shippingRateId, setShippingRateId] = useState(eligibleRates[0]?.id ?? '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const selectedRate = eligibleRates.find((r) => r.id === shippingRateId);
  const shippingCents = computeShippingCents(selectedRate, weightGrams);
  const totalCents = Math.max(0, subtotalCents + shippingCents + taxCents - discountCents);

  const itemCount = useMemo(() => 0, []); // placeholder for future cart indicator

  async function place(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const res = await fetch('/api/checkout/session', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ shippingAddressId, billingAddressId, shippingRateId }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(data?.error?.message ?? 'Checkout failed');
      return;
    }
    const { url } = await res.json();
    if (url) {
      toast.success('Redirecting to Stripe…');
      window.location.href = url;
    }
  }

  if (addresses.length === 0) {
    return (
      <Alert variant="warning">
        <MapPinOff className="size-4" />
        <AlertTitle>Add a shipping address first</AlertTitle>
        <AlertDescription className="mt-2 space-y-3">
          <p>We need to know where to send your order before you can pay.</p>
          <Button asChild size="sm" variant="outline">
            <Link href="/account/addresses">Add an address</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={place} className="space-y-4">
      <div className="space-y-2">
        <Label>Shipping address</Label>
        <Select value={shippingAddressId} onValueChange={setShippingAddressId}>
          <SelectTrigger>
            <SelectValue placeholder="Select address" />
          </SelectTrigger>
          <SelectContent>
            {addresses.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.label ? `${a.label} — ` : ''}
                {a.line1}, {a.city} {a.postalCode} ({a.country})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Billing address</Label>
        <Select value={billingAddressId} onValueChange={setBillingAddressId}>
          <SelectTrigger>
            <SelectValue placeholder="Select address" />
          </SelectTrigger>
          <SelectContent>
            {addresses.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.label ? `${a.label} — ` : ''}
                {a.line1}, {a.city} {a.postalCode} ({a.country})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Shipping method</Label>
        {eligibleRates.length === 0 ? (
          <Alert variant="warning">
            <AlertDescription>
              No shipping options are available for {props.country}. Pick a different address country or contact support.
            </AlertDescription>
          </Alert>
        ) : (
          <Select value={shippingRateId} onValueChange={setShippingRateId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {eligibleRates.map((r) => {
                const cost = computeShippingCents(r, weightGrams);
                const days =
                  r.deliveryDaysMin === r.deliveryDaysMax
                    ? `${r.deliveryDaysMin ?? '?'} day${r.deliveryDaysMin === 1 ? '' : 's'}`
                    : `${r.deliveryDaysMin ?? '?'}–${r.deliveryDaysMax ?? '?'} days`;
                return (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name} · {days} · {fmtUSD(cost)}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Live totals — updates whenever shipping rate changes */}
      <div className="rounded-lg border bg-muted/40 p-3 text-sm space-y-1">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="tabular">{fmtUSD(subtotalCents)}</span>
        </div>
        {discountCents > 0 ? (
          <div className="flex justify-between text-success">
            <span>Discount</span>
            <span className="tabular">−{fmtUSD(discountCents)}</span>
          </div>
        ) : null}
        <div className="flex justify-between">
          <span>Shipping ({selectedRate?.name ?? 'none'})</span>
          <span className="tabular">{fmtUSD(shippingCents)}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax</span>
          <span className="tabular">{fmtUSD(taxCents)}</span>
        </div>
        <div className="flex justify-between border-t pt-1 font-semibold">
          <span>Total</span>
          <span className="tabular">{fmtUSD(totalCents)}</span>
        </div>
      </div>

      {err ? (
        <Alert variant="destructive">
          <AlertDescription>{err}</AlertDescription>
        </Alert>
      ) : null}

      <Button
        type="submit"
        disabled={busy || !shippingRateId || eligibleRates.length === 0}
        className="w-full"
        size="lg"
      >
        {busy ? <Loader2 className="animate-spin" /> : <Lock />}
        {busy ? 'Redirecting to Stripe…' : `Continue to payment · ${fmtUSD(totalCents)}`}
      </Button>
      {/* keep itemCount referenced to satisfy strict TS in case we add a badge later */}
      <span className="hidden">{itemCount}</span>
    </form>
  );
}