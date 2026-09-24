import Link from 'next/link';
import { Heart } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getOptionalUser } from '@/lib/auth-helpers';
import { listWishlist } from '@/lib/services/wishlist';
import { formatMoney } from '@/lib/money';
import { compareBy, param, type SearchParams } from '@/lib/table-sort';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/empty-state';
import { WishlistButton } from '@/components/catalog/wishlist-button';
import { TableFilter } from '@/components/data-table/table-toolbar';

type Item = Awaited<ReturnType<typeof listWishlist>>[number];

const SORTS: Record<string, (a: Item, b: Item) => number> = {
  price_asc: compareBy<Item>((i) => i.product.priceCents, 'asc'),
  price_desc: compareBy<Item>((i) => i.product.priceCents, 'desc'),
  name: compareBy<Item>((i) => i.product.name, 'asc'),
};

export default async function WishlistPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await getOptionalUser();
  if (!user) redirect('/auth/login?callbackUrl=/wishlist');
  const sp = await searchParams;
  const items = await listWishlist(user.id); // newest first
  const sorter = SORTS[param(sp, 'order') ?? ''];
  const rows = sorter ? [...items].sort(sorter) : items;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Wishlist</h1>
          <p className="text-sm text-muted-foreground">
            {items.length === 0 ? 'Things you save show up here.' : `${items.length} saved ${items.length === 1 ? 'item' : 'items'}`}
          </p>
        </div>
        {items.length > 1 ? (
          <TableFilter
            param="order"
            allLabel="Recently saved"
            options={[
              { value: 'price_asc', label: 'Price: low to high' },
              { value: 'price_desc', label: 'Price: high to low' },
              { value: 'name', label: 'Name A–Z' },
            ]}
          />
        ) : null}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Tap the heart on any product to keep it here for later."
          action={
            <Button asChild>
              <Link href="/products">Browse the catalog</Link>
            </Button>
          }
          className="rounded-xl border border-dashed py-20"
        />
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
          {rows.map((it) => {
            const out = it.product.stock === 0;
            return (
              <li key={it.id} className="group relative">
                <Link href={`/products/${it.product.slug}`} className="block">
                  <div className="aspect-[4/5] overflow-hidden rounded-xl bg-muted outline outline-1 -outline-offset-1 outline-black/5 dark:outline-white/10">
                    {it.product.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={it.product.images[0].url}
                        alt={it.product.name}
                        className={cn(
                          'size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]',
                          out && 'opacity-60 grayscale',
                        )}
                      />
                    ) : null}
                  </div>
                  <div className="space-y-1 px-0.5 pt-3">
                    <p className="line-clamp-1 text-sm font-medium group-hover:underline">{it.product.name}</p>
                    <p className="tabular text-sm font-semibold">
                      {formatMoney(it.product.priceCents, it.product.currency as 'USD')}
                      {out ? <span className="ml-2 text-xs font-normal text-muted-foreground">Sold out</span> : null}
                    </p>
                  </div>
                </Link>
                <div className="absolute right-2.5 top-2.5 [&_button]:size-9 [&_button]:bg-background/90 [&_button]:backdrop-blur">
                  <WishlistButton productId={it.productId} initialSaved variant="icon" />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
