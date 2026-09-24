'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Trash2, Plus, Loader2, MapPin, Star } from 'lucide-react';
import type { Address } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

export function AddressList({ initial }: { initial: Address[] }) {
  const [list, setList] = useState<Address[]>(initial);
  const [label, setLabel] = useState('');
  const [line1, setLine1] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('US');
  const [postalCode, setPostalCode] = useState('');
  const [isDefault, setIsDefault] = useState(initial.length === 0);
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch('/api/account/addresses', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'SHIPPING', label, line1, city, country, postalCode, isDefault }),
    });
    setBusy(false);
    if (res.ok) {
      const addr = await res.json();
      setList([...list, addr]);
      toast.success('Address added');
      setLabel('');
      setLine1('');
      setCity('');
      setPostalCode('');
      setIsDefault(false);
    } else toast.error('Could not add address');
  }

  async function remove(id: string) {
    setBusy(true);
    const res = await fetch(`/api/account/addresses/${id}`, { method: 'DELETE' });
    setBusy(false);
    if (res.ok) {
      setList(list.filter((a) => a.id !== id));
      toast.success('Address removed');
    } else toast.error('Could not remove');
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Saved addresses</CardTitle>
        </CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <div className="rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground">
              No addresses yet. Add one to enable checkout.
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {[...list].sort((a, b) => Number(b.isDefault) - Number(a.isDefault)).map((a) => (
                <li key={a.id} className={`flex items-start justify-between gap-2 rounded-lg border p-4 ${a.isDefault ? 'border-foreground/25' : ''}`}>
                  <div className="flex gap-3">
                    <MapPin className="mt-1 h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{a.label ?? a.line1}</p>
                        {a.isDefault ? (
                          <Badge variant="secondary" className="gap-1">
                            <Star className="h-3 w-3" /> Default
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {a.line1}
                        {a.line2 ? `, ${a.line2}` : ''}, {a.city} {a.postalCode}
                      </p>
                      <p className="text-xs text-muted-foreground">{a.country}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={busy}
                    onClick={() => remove(a.id)}
                    className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                    aria-label={`Remove ${a.label ?? a.line1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add a new address
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={add} className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="label">Label</Label>
              <Input id="label" placeholder="Home, Office, …" value={label} onChange={(e) => setLabel(e.target.value)} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="line1">Address line</Label>
              <Input id="line1" required value={line1} onChange={(e) => setLine1(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" required value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postal">Postal code</Label>
              <Input id="postal" required value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="country">Country (ISO-2)</Label>
              <Input
                id="country"
                required
                maxLength={2}
                value={country}
                onChange={(e) => setCountry(e.target.value.toUpperCase())}
                placeholder="US"
                className="w-24 font-mono uppercase"
              />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <Checkbox id="default" checked={isDefault} onCheckedChange={(c) => setIsDefault(c as boolean)} />
              <Label htmlFor="default" className="cursor-pointer font-normal">
                Set as default address
              </Label>
            </div>
            <Button type="submit" disabled={busy} className="col-span-2 sm:w-fit">
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save address
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}