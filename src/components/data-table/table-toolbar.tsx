'use client';

import { useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

function useParamWriter() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();
  function write(patch: Record<string, string | undefined>) {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    next.delete('page');
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }
  return { sp, write, pending };
}

/** Debounced search box bound to a URL param (default `q`). */
export function TableSearch({ placeholder, param = 'q', className }: { placeholder: string; param?: string; className?: string }) {
  const { sp, write, pending } = useParamWriter();
  const current = sp.get(param) ?? '';
  const [value, setValue] = useState(current);

  useEffect(() => {
    const next = value.trim();
    if (next === current) return;
    const t = setTimeout(() => write({ [param]: next || undefined }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className={cn('relative w-full sm:max-w-xs', className)}>
      <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-9 pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden"
      />
      {pending ? (
        <Loader2 aria-hidden className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      ) : value ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setValue('')}
          aria-label="Clear search"
          className="absolute right-1.5 top-1/2 size-6 -translate-y-1/2 text-muted-foreground [&_svg]:size-3.5"
        >
          <X />
        </Button>
      ) : null}
    </div>
  );
}

/** Select bound to a URL param. `__all` clears the param. */
export function TableFilter({
  param,
  options,
  allLabel,
  className,
}: {
  param: string;
  options: Array<{ value: string; label: string }>;
  allLabel: string;
  className?: string;
}) {
  const { sp, write } = useParamWriter();
  return (
    <Select value={sp.get(param) ?? '__all'} onValueChange={(v) => write({ [param]: v === '__all' ? undefined : v })}>
      <SelectTrigger className={cn('h-9 w-full sm:w-44', className)} aria-label={allLabel}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all">{allLabel}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Resets every filter/sort param listed in `params`. Renders nothing when none is set. */
export function ClearFilters({ params }: { params: string[] }) {
  const { sp, write } = useParamWriter();
  if (!params.some((p) => sp.get(p))) return null;
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-9 text-muted-foreground"
      onClick={() => write(Object.fromEntries(params.map((p) => [p, undefined])))}
    >
      <X /> Reset
    </Button>
  );
}
