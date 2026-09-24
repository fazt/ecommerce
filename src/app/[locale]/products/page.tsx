import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ChevronLeft, ChevronRight, PackageSearch } from 'lucide-react';
import { getCatalog, getCategoriesWithCounts } from '@/lib/services/catalog';
import { ProductFilterSchema } from '@/lib/validators/product';
import { ProductGrid } from '@/components/catalog/product-grid';
import { ProductFilters } from '@/components/catalog/product-filters';
import { ProductSort } from '@/components/catalog/product-sort';
import { awaitSearchParams } from '@/lib/next-params';
import { withParams } from '@/lib/table-sort';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MobileFilters } from '@/components/catalog/mobile-filters';
import { EmptyState } from '@/components/empty-state';

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await awaitSearchParams(searchParams);
  const t = await getTranslations('catalog');
  const tc = await getTranslations('common');
  const filter = ProductFilterSchema.parse({
    search: typeof raw.search === 'string' ? raw.search : undefined,
    category: typeof raw.category === 'string' ? raw.category : undefined,
    minPrice: typeof raw.minPrice === 'string' ? Number(raw.minPrice) : undefined,
    maxPrice: typeof raw.maxPrice === 'string' ? Number(raw.maxPrice) : undefined,
    inStock: raw.inStock === '1' || raw.inStock === 'true',
    sort:
      typeof raw.sort === 'string' && ['price_asc', 'price_desc', 'newest', 'popular'].includes(raw.sort)
        ? (raw.sort as 'price_asc' | 'price_desc' | 'newest' | 'popular')
        : 'newest',
    page: typeof raw.page === 'string' ? Math.max(1, Number(raw.page)) : 1,
  });
  const [categories, result] = await Promise.all([getCategoriesWithCounts(), getCatalog(filter)]);
  const pages = Math.max(1, Math.ceil(result.total / filter.pageSize));
  const from = result.total === 0 ? 0 : (filter.page - 1) * filter.pageSize + 1;
  const to = Math.min(result.total, filter.page * filter.pageSize);
  const activeCategory = categories.find((c) => c.slug === filter.category);
  const pageHref = (p: number) => `/products?${withParams(raw, { page: p > 1 ? String(p) : undefined })}`;
  const activeFilters = [filter.search, filter.category, filter.minPrice, filter.maxPrice, filter.inStock].filter(Boolean).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:py-12">
      <div className="mb-8 space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">{activeCategory?.name ?? t('title')}</h1>
        <p className="text-sm text-muted-foreground">
          {filter.search ? (
            <>
              “{filter.search}” · {result.total} {result.total === 1 ? 'result' : 'results'}
            </>
          ) : (
            <>
              {result.total} {result.total === 1 ? 'product' : 'products'}
            </>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <ProductFilters categories={categories} initial={filter} />
          </div>
        </aside>

        <section className="min-w-0 space-y-5">
          <div className="flex items-center justify-between gap-3 border-b pb-4">
            <MobileFilters categories={categories} initial={filter} activeCount={activeFilters} />
            <p className="tabular hidden text-sm text-muted-foreground lg:block">
              {tc('showing', { from, to, total: result.total })}
            </p>
            <ProductSort initial={filter.sort} />
          </div>

          {result.items.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title={t('noResults')}
              description="Try a broader search or clear some filters."
              action={
                <Button variant="outline" asChild>
                  <Link href="/products">Clear all filters</Link>
                </Button>
              }
              className="rounded-xl border border-dashed"
            />
          ) : (
            <ProductGrid items={result.items} />
          )}

          {pages > 1 ? (
            <nav aria-label="Pagination" className="flex items-center justify-between gap-2 border-t pt-6">
              <Button variant="outline" size="sm" asChild={filter.page > 1} disabled={filter.page <= 1}>
                {filter.page > 1 ? (
                  <Link href={pageHref(filter.page - 1)}>
                    <ChevronLeft /> {tc('previous')}
                  </Link>
                ) : (
                  <span>
                    <ChevronLeft /> {tc('previous')}
                  </span>
                )}
              </Button>
              <ol className="hidden items-center gap-1 sm:flex">
                {Array.from({ length: pages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === pages || Math.abs(p - filter.page) <= 1)
                  .map((p, i, arr) => (
                    <li key={p} className="flex items-center gap-1">
                      {i > 0 && p - arr[i - 1]! > 1 ? <span className="px-1 text-muted-foreground">…</span> : null}
                      <Link
                        href={pageHref(p)}
                        aria-current={p === filter.page ? 'page' : undefined}
                        className={cn(
                          'tabular flex size-9 items-center justify-center rounded-md text-sm transition-colors',
                          p === filter.page ? 'bg-primary text-primary-foreground' : 'hover:bg-accent',
                        )}
                      >
                        {p}
                      </Link>
                    </li>
                  ))}
              </ol>
              <span className="tabular text-sm text-muted-foreground sm:hidden">
                {filter.page} / {pages}
              </span>
              <Button variant="outline" size="sm" asChild={filter.page < pages} disabled={filter.page >= pages}>
                {filter.page < pages ? (
                  <Link href={pageHref(filter.page + 1)}>
                    {tc('next')} <ChevronRight />
                  </Link>
                ) : (
                  <span>
                    {tc('next')} <ChevronRight />
                  </span>
                )}
              </Button>
            </nav>
          ) : null}
        </section>
      </div>
    </div>
  );
}
