'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Initial {
  id?: string;
  slug?: string;
  name?: string;
  description?: string;
  shortDescription?: string | null;
  priceCents?: number;
  compareAtCents?: number | null;
  currency?: string;
  sku?: string | null;
  stock?: number;
  categoryId?: string | null;
  isActive?: boolean;
  isFeatured?: boolean;
  tags?: string[];
}

interface Cat {
  id: string;
  name: string;
}

export function ProductForm({ categories, initial }: { categories: Cat[]; initial?: Initial }) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [short, setShort] = useState(initial?.shortDescription ?? '');
  const [price, setPrice] = useState(((initial?.priceCents ?? 0) / 100).toString());
  const [compare, setCompare] = useState(
    initial?.compareAtCents ? (initial.compareAtCents / 100).toString() : '',
  );
  const [stock, setStock] = useState((initial?.stock ?? 0).toString());
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '__none');
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [isFeatured, setIsFeatured] = useState(initial?.isFeatured ?? false);
  const [tags, setTags] = useState((initial?.tags ?? []).join(', '));
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const body = {
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      description,
      shortDescription: short,
      priceCents: Math.round(Number(price) * 100),
      compareAtCents: compare ? Math.round(Number(compare) * 100) : null,
      currency: initial?.currency ?? 'USD',
      stock: Number(stock),
      categoryId: categoryId === '__none' ? null : categoryId,
      isActive,
      isFeatured,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      images: [],
    };
    const url = initial?.id ? `/api/admin/products/${initial.id}` : '/api/admin/products';
    const method = initial?.id ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (res.ok) {
      toast.success('Product saved');
      router.push('/admin/products');
      router.refresh();
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err?.error?.message ?? 'Failed to save');
    }
  }

  return (
    <form onSubmit={save} className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder={name ? name.toLowerCase().replace(/\s+/g, '-') : 'auto from name'}
                  className="font-mono text-[13px]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="short">Short description</Label>
              <Input id="short" value={short} onChange={(e) => setShort(e.target.value)} placeholder="One line shown under the title" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea id="desc" required rows={6} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Pricing & inventory</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <MoneyField id="price" label="Price" required value={price} onChange={setPrice} />
            <MoneyField id="compare" label="Compare-at price" value={compare} onChange={setCompare} hint="Shows as a sale when higher than price" />
            <div className="space-y-2">
              <Label htmlFor="stock">Stock</Label>
              <Input id="stock" type="number" min={0} required value={stock} onChange={(e) => setStock(e.target.value)} className="tabular" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6 lg:sticky lg:top-24">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Visibility</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ToggleRow id="active" label="Active" hint="Visible in the catalog" checked={isActive} onChange={setIsActive} />
            <Separator />
            <ToggleRow id="featured" label="Featured" hint="Shown on the home page" checked={isFeatured} onChange={setIsFeatured} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Organization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">No category</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="cotton, summer" />
              <p className="text-xs text-muted-foreground">Comma separated.</p>
            </div>
          </CardContent>
        </Card>
        <Button type="submit" disabled={busy} className="w-full" size="lg">
          {busy ? <Loader2 className="animate-spin" /> : <Save />}
          {initial?.id ? 'Save changes' : 'Create product'}
        </Button>
      </div>
    </form>
  );
}

function MoneyField({
  id,
  label,
  value,
  onChange,
  required,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
        <Input
          id={id}
          type="number"
          step="0.01"
          min={0}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="tabular pl-7"
        />
      </div>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function ToggleRow({
  id,
  label,
  hint,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Label htmlFor={id} className="cursor-pointer space-y-0.5">
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs font-normal text-muted-foreground">{hint}</span>
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
