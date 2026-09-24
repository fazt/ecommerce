'use client';

import { useTranslations } from 'next-intl';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ProductFilters } from '@/components/catalog/product-filters';

type Props = React.ComponentProps<typeof ProductFilters> & { activeCount: number };

/** Filters in a left sheet for viewports below `lg`. */
export function MobileFilters({ activeCount, ...props }: Props) {
  const t = useTranslations('catalog');
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 lg:hidden">
          <SlidersHorizontal /> {t('filters')}
          {activeCount > 0 ? (
            <span className="tabular flex size-5 items-center justify-center rounded-full bg-clay text-[11px] text-clay-foreground">
              {activeCount}
            </span>
          ) : null}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[320px] overflow-y-auto">
        <SheetHeader className="sr-only">
          <SheetTitle>{t('filters')}</SheetTitle>
        </SheetHeader>
        <div className="pt-6">
          <ProductFilters {...props} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
