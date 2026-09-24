'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Category } from '@prisma/client';

interface Props {
  categories: (Category & { _count: { products: number } })[];
  initial: {
    category?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
  };
}

export function ProductFilters({ categories, initial }: Props) {
  const t = useTranslations('catalog');
  const tc = useTranslations('common');
  const router = useRouter();
  const sp = useSearchParams();
  const [search, setSearch] = useState(initial.search ?? '');
  const [category, setCategory] = useState(initial.category ?? '');
  const [minPrice, setMinPrice] = useState(initial.minPrice?.toString() ?? '');
  const [maxPrice, setMaxPrice] = useState(initial.maxPrice?.toString() ?? '');
  const [inStock, setInStock] = useState(!!initial.inStock);

  function push(next: { search: string; category: string; minPrice: string; maxPrice: string; inStock: boolean }) {
    const params = new URLSearchParams(sp.toString());
    params.delete('page');
    const set = (k: string, v: string) => (v ? params.set(k, v) : params.delete(k));
    set('search', next.search.trim());
    set('category', next.category);
    set('minPrice', next.minPrice);
    set('maxPrice', next.maxPrice);
    set('inStock', next.inStock ? '1' : '');
    router.push(`/products?${params.toString()}`, { scroll: false });
  }

  const state = { search, category, minPrice, maxPrice, inStock };
  const apply = () => push(state);

  function clear() {
    setSearch('');
    setCategory('');
    setMinPrice('');
    setMaxPrice('');
    setInStock(false);
    const params = new URLSearchParams();
    const sort = sp.get('sort');
    if (sort) params.set('sort', sort);
    router.push(`/products${params.size ? `?${params}` : ''}`, { scroll: false });
  }

  const activeCount = [initial.search, initial.category, initial.minPrice, initial.maxPrice, initial.inStock].filter(Boolean).length;

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
    >
      <div className="flex h-8 items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <SlidersHorizontal className="size-4 text-muted-foreground" />
          {t('filters')}
          {activeCount > 0 ? (
            <span className="tabular flex size-5 items-center justify-center rounded-full bg-clay text-[11px] font-medium text-clay-foreground">
              {activeCount}
            </span>
          ) : null}
        </h2>
        {activeCount > 0 ? (
          <Button type="button" variant="ghost" size="sm" onClick={clear} className="h-8 px-2 text-xs text-muted-foreground">
            <X /> Clear
          </Button>
        ) : null}
      </div>

      <div className="relative">
        <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={tc('search')}
          aria-label={tc('search')}
          className="pl-9"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">{t('category')}</Label>
        <Select
          value={category || '__all'}
          onValueChange={(v) => {
            const next = v === '__all' ? '' : v;
            setCategory(next);
            push({ ...state, category: next });
          }}
        >
          <SelectTrigger id="category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.slug}>
                <span className="flex w-full items-center justify-between gap-6">
                  {c.name}
                  <span className="tabular text-xs text-muted-foreground">{c._count.products}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-medium">{t('priceRange')}</legend>
        <div className="flex items-center gap-2">
          <PriceInput id="min" label="Min" value={minPrice} onChange={setMinPrice} />
          <span aria-hidden className="text-muted-foreground">–</span>
          <PriceInput id="max" label="Max" value={maxPrice} onChange={setMaxPrice} />
        </div>
      </fieldset>

      <div className="flex items-center gap-2.5">
        <Checkbox
          id="inStock"
          checked={inStock}
          onCheckedChange={(c) => {
            setInStock(c === true);
            push({ ...state, inStock: c === true });
          }}
        />
        <Label htmlFor="inStock" className="cursor-pointer font-normal">
          {t('inStockOnly')}
        </Label>
      </div>

      <Button type="submit" variant="outline" className="w-full">
        Apply
      </Button>
    </form>
  );
}

function PriceInput({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative flex-1">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
      <Input
        id={id}
        type="number"
        min={0}
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
        aria-label={`${label} price`}
        className="tabular pl-7"
      />
    </div>
  );
}
