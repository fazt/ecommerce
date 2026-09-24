'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Globe, Loader2 } from 'lucide-react';
import type { ShippingZone, ShippingRate } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/empty-state';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';

interface Zone extends ShippingZone {
  rates: ShippingRate[];
}

function deliveryWindow(r: ShippingRate) {
  if (r.deliveryDaysMin == null && r.deliveryDaysMax == null) return null;
  if (r.deliveryDaysMin === r.deliveryDaysMax || r.deliveryDaysMax == null) return `${r.deliveryDaysMin} days`;
  return `${r.deliveryDaysMin ?? 0}–${r.deliveryDaysMax} days`;
}

export function ShippingForm({ zones }: { zones: Zone[] }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [countries, setCountries] = useState('');
  const [busy, setBusy] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const parsed = countries
    .split(/[\s,]+/)
    .map((c) => c.trim().toUpperCase())
    .filter((c) => /^[A-Z]{2}$/.test(c));

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch('/api/admin/shipping/zones', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, countries: parsed }),
    });
    setBusy(false);
    if (res.ok) {
      toast.success(`Zone “${name}” added`);
      router.refresh();
      setName('');
      setCountries('');
    } else toast.error('Could not add zone');
  }

  async function toggle(z: Zone, isActive: boolean) {
    setTogglingId(z.id);
    const res = await fetch(`/api/admin/shipping/zones/${z.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ isActive }),
    });
    setTogglingId(null);
    if (res.ok) {
      toast.success(`${z.name} ${isActive ? 'enabled' : 'disabled'}`);
      router.refresh();
    } else toast.error('Could not update zone');
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
      <div className="space-y-4">
        {zones.length === 0 ? (
          <Card>
            <EmptyState icon={Globe} title="No shipping zones" description="Customers can’t check out until a zone covers their country." />
          </Card>
        ) : (
          zones.map((z) => (
            <Card key={z.id} className={cn(!z.isActive && 'bg-muted/30')}>
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-3">
                <div className="min-w-0 space-y-2">
                  <CardTitle className={cn(!z.isActive && 'text-muted-foreground')}>{z.name}</CardTitle>
                  <div className="flex flex-wrap gap-1">
                    {z.countries.map((c) => (
                      <span key={c} className="rounded border bg-background px-1.5 py-px font-mono text-[11px] text-muted-foreground">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
                <label className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                  {z.isActive ? 'Active' : 'Off'}
                  <Switch
                    checked={z.isActive}
                    disabled={togglingId === z.id}
                    onCheckedChange={(v) => toggle(z, v)}
                    aria-label={`Toggle ${z.name}`}
                  />
                </label>
              </CardHeader>
              <CardContent>
                {z.rates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No rates in this zone yet.</p>
                ) : (
                  <ul className="divide-y rounded-lg border">
                    {z.rates.map((r) => (
                      <li key={r.id} className="flex items-center gap-4 px-3 py-2.5 text-sm">
                        <span className={cn('flex-1 truncate', !r.isActive && 'text-muted-foreground line-through')}>{r.name}</span>
                        {deliveryWindow(r) ? <span className="text-xs text-muted-foreground">{deliveryWindow(r)}</span> : null}
                        <span className="tabular w-20 text-right font-medium">
                          {r.basePriceCents === 0 ? 'Free' : formatMoney(r.basePriceCents, 'USD')}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Plus className="size-4 text-muted-foreground" /> New zone
          </CardTitle>
          <CardDescription>Group countries that share the same rates.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={add} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <div className="space-y-2">
              <Label htmlFor="zone-name">Zone name</Label>
              <Input id="zone-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="North America" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="countries">Countries</Label>
              <Input
                id="countries"
                required
                value={countries}
                onChange={(e) => setCountries(e.target.value)}
                placeholder="US, CA, MX"
                className="font-mono text-[13px] uppercase"
              />
              <p className="text-xs text-muted-foreground">
                {parsed.length > 0 ? `${parsed.length} valid ISO-2 codes` : 'Two-letter ISO codes, comma separated.'}
              </p>
            </div>
            <Button type="submit" disabled={busy || !name || parsed.length === 0} className="sm:col-span-2 xl:col-span-1">
              {busy ? <Loader2 className="animate-spin" /> : <Plus />}
              Add zone
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
