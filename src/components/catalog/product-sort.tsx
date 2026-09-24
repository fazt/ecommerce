'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function ProductSort({ initial }: { initial: string }) {
  const t = useTranslations('catalog');
  const router = useRouter();
  const sp = useSearchParams();
  function change(v: string) {
    const params = new URLSearchParams(sp.toString());
    if (v === 'newest') params.delete('sort');
    else params.set('sort', v);
    params.delete('page');
    router.push(`/products${params.size ? `?${params}` : ''}`, { scroll: false });
  }
  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-sm text-muted-foreground sm:inline">{t('sort')}</span>
      <Select value={initial} onValueChange={change}>
        <SelectTrigger className="h-9 w-[190px]" aria-label={t('sort')}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          <SelectItem value="newest">{t('sortNewest')}</SelectItem>
          <SelectItem value="price_asc">{t('sortPriceAsc')}</SelectItem>
          <SelectItem value="price_desc">{t('sortPriceDesc')}</SelectItem>
          <SelectItem value="popular">{t('sortPopular')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
