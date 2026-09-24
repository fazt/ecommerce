import Link from 'next/link';
import { Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { CatalogItem } from '@/lib/services/catalog';

export function ProductCard({ product }: { product: CatalogItem }) {
  const outOfStock = product.stock === 0;
  const onSale = product.compareAtCents != null && product.compareAtCents > product.priceCents;
  const discount = onSale ? Math.round((1 - product.priceCents / product.compareAtCents!) * 100) : 0;
  const cur = product.currency as 'USD';
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-muted outline outline-1 -outline-offset-1 outline-black/5 dark:outline-white/10">
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className={cn(
              'size-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.03]',
              outOfStock && 'opacity-60 grayscale',
            )}
          />
        ) : (
          <div className="flex size-full items-center justify-center text-xs text-muted-foreground">No image</div>
        )}
        <div className="absolute left-2.5 top-2.5 flex gap-1">
          {outOfStock ? (
            <Badge variant="secondary" className="bg-background/90 backdrop-blur">
              Sold out
            </Badge>
          ) : onSale ? (
            <Badge variant="clay">−{discount}%</Badge>
          ) : null}
        </div>
      </div>
      <div className="space-y-1 px-0.5 pt-3">
        {product.categoryName ? (
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{product.categoryName}</p>
        ) : null}
        <h3 className="line-clamp-1 text-sm font-medium underline-offset-4 group-hover:underline">{product.name}</h3>
        <div className="flex items-center justify-between gap-2">
          <p className="tabular flex items-baseline gap-1.5">
            <span className={cn('text-sm font-semibold', onSale && 'text-clay')}>{formatMoney(product.priceCents, cur)}</span>
            {onSale ? (
              <span className="text-xs text-muted-foreground line-through">{formatMoney(product.compareAtCents!, cur)}</span>
            ) : null}
          </p>
          {product.reviewCount > 0 ? (
            <span className="tabular flex items-center gap-1 text-xs text-muted-foreground">
              <Star aria-hidden className="size-3 fill-rating text-rating" />
              {product.averageRating.toFixed(1)}
              <span className="sr-only">out of 5, {product.reviewCount} reviews</span>
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
