'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Ticket, Loader2 } from 'lucide-react';
import type { Coupon } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/empty-state';
import { SortableHead } from '@/components/data-table/sortable-head';
import type { SortState } from '@/lib/table-sort';

type CouponType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';

const TYPE_LABEL: Record<CouponType, string> = {
  PERCENTAGE: 'Percent off',
  FIXED_AMOUNT: 'Flat amount',
  FREE_SHIPPING: 'Free shipping',
};

function formatValue(c: Pick<Coupon, 'type' | 'value'>) {
  if (c.type === 'PERCENTAGE') return `${c.value}%`;
  if (c.type === 'FIXED_AMOUNT') return `$${(c.value / 100).toFixed(2)}`;
  return '—';
}

export function CouponForm({
  coupons,
  sort,
  params,
}: {
  coupons: Coupon[];
  sort: SortState;
  params: Record<string, string>;
}) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [type, setType] = useState<CouponType>('PERCENTAGE');
  const [value, setValue] = useState('10');
  const [busy, setBusy] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    // Fixed amounts are typed in dollars and stored in cents.
    const raw = type === 'FREE_SHIPPING' ? 0 : Number(value);
    const res = await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: code.toUpperCase(), type, value: type === 'FIXED_AMOUNT' ? Math.round(raw * 100) : raw }),
    });
    setBusy(false);
    if (res.ok) {
      toast.success(`Coupon ${code.toUpperCase()} created`);
      router.refresh();
      setCode('');
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err?.error?.message ?? 'Could not create coupon');
    }
  }

  async function toggle(c: Coupon, isActive: boolean) {
    setTogglingId(c.id);
    const res = await fetch(`/api/admin/coupons/${c.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ isActive }),
    });
    setTogglingId(null);
    if (res.ok) {
      toast.success(`${c.code} ${isActive ? 'enabled' : 'disabled'}`);
      router.refresh();
    } else toast.error('Could not update coupon');
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
      <Card className="overflow-hidden xl:order-1">
        {coupons.length === 0 ? (
          <EmptyState icon={Ticket} title="No coupons yet" description="Create a code with the form to offer a discount." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHead column="code" sort={sort} params={params}>Code</SortableHead>
                <SortableHead column="type" sort={sort} params={params} className="hidden sm:table-cell">Type</SortableHead>
                <SortableHead column="value" sort={sort} params={params} firstDir="desc" align="right">Value</SortableHead>
                <SortableHead column="uses" sort={sort} params={params} firstDir="desc" align="right">Uses</SortableHead>
                <SortableHead column="active" sort={sort} params={params} firstDir="desc" align="right">Active</SortableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((c) => (
                <TableRow key={c.id} className={c.isActive ? undefined : 'text-muted-foreground'}>
                  <TableCell className="font-mono text-[13px] font-medium">{c.code}</TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">{TYPE_LABEL[c.type as CouponType]}</TableCell>
                  <TableCell className="text-right">{formatValue(c)}</TableCell>
                  <TableCell className="text-right">
                    {c.currentUses}
                    {c.maxUses ? <span className="text-muted-foreground"> / {c.maxUses}</span> : null}
                  </TableCell>
                  <TableCell className="text-right">
                    <Switch
                      checked={c.isActive}
                      disabled={togglingId === c.id}
                      onCheckedChange={(v) => toggle(c, v)}
                      aria-label={`${c.isActive ? 'Disable' : 'Enable'} ${c.code}`}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card className="xl:order-2">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Plus className="size-4 text-muted-foreground" /> New coupon
          </CardTitle>
          <CardDescription>Codes are uppercase and unique.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={add} className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                placeholder="WELCOME10"
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coupon-type">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as CouponType)}>
                <SelectTrigger id="coupon-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(TYPE_LABEL) as CouponType[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {TYPE_LABEL[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">{type === 'FIXED_AMOUNT' ? 'Amount (USD)' : 'Percent'}</Label>
              <div className="relative">
                <Input
                  id="value"
                  type="number"
                  min={0}
                  max={type === 'PERCENTAGE' ? 100 : undefined}
                  step={type === 'FIXED_AMOUNT' ? '0.01' : '1'}
                  required={type !== 'FREE_SHIPPING'}
                  value={type === 'FREE_SHIPPING' ? '' : value}
                  onChange={(e) => setValue(e.target.value)}
                  disabled={type === 'FREE_SHIPPING'}
                  className="pr-8"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {type === 'FIXED_AMOUNT' ? '$' : type === 'PERCENTAGE' ? '%' : ''}
                </span>
              </div>
            </div>
            <Button type="submit" disabled={busy || !code} className="sm:col-span-3 xl:col-span-1">
              {busy ? <Loader2 className="animate-spin" /> : <Plus />}
              Create coupon
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
