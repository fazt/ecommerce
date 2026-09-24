import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, Package, Scale, Tag, Boxes } from 'lucide-react';
import { getProductBySlug, getCatalog } from '@/lib/services/catalog';
import { listApprovedReviews } from '@/lib/services/review';
import { formatMoney } from '@/lib/money';
import { AddToCartButton } from '@/components/catalog/add-to-cart-button';
import { WishlistButton } from '@/components/catalog/wishlist-button';
import { getOptionalUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { ProductGallery } from '@/components/catalog/product-gallery';
import { ProductReviews } from '@/components/catalog/product-reviews';
import { ProductGrid } from '@/components/catalog/product-grid';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { StarRating } from '@/components/star-rating';
import { awaitParams } from '@/lib/next-params';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await awaitParams(params);
  const product = await getProductBySlug(slug);
  if (!product) return { title: 'Not found' };
  return {
    title: product.name,
    description: product.shortDescription ?? product.description.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.shortDescription ?? product.description.slice(0, 160),
      images: product.images[0]?.url ? [product.images[0].url] : [],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await awaitParams(params);
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const user = await getOptionalUser();
  const [reviews, saved] = await Promise.all([
    listApprovedReviews(product.id),
    user ? prisma.wishlistItem.findFirst({ where: { userId: user.id, productId: product.id }, select: { id: true } }) : null,
  ]);
  const related = await getCatalog({ search: undefined, sort: 'newest', page: 1, pageSize: 5, category: product.category?.slug });
  const relatedItems = related.items.filter((p) => p.id !== product.id).slice(0, 4);

  const onSale = product.compareAtCents && product.compareAtCents > product.priceCents;
  const stockBadge =
    product.stock === 0 ? { label: 'Out of stock', variant: 'destructive' as const } : product.stock < 5
      ? { label: `Only ${product.stock} left`, variant: 'warning' as const }
      : { label: 'In stock', variant: 'success' as const };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav aria-label="Breadcrumb" className="mb-6 flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight aria-hidden className="size-3.5 shrink-0" />
        <Link href="/products" className="hover:text-foreground">Catalog</Link>
        {product.category ? (
          <>
            <ChevronRight aria-hidden className="size-3.5 shrink-0" />
            <Link href={`/products?category=${product.category.slug}`} className="hover:text-foreground">
              {product.category.name}
            </Link>
          </>
        ) : null}
        <ChevronRight aria-hidden className="size-3.5 shrink-0" />
        <span className="truncate text-foreground">{product.name}</span>
      </nav>

      <article className="grid gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images} />
        <div className="space-y-6">
          <div className="space-y-2">
            {product.category ? (
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {product.category.name}
              </p>
            ) : null}
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{product.name}</h1>
            {product.shortDescription ? (
              <p className="text-sm text-muted-foreground">{product.shortDescription}</p>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={stockBadge.variant}>{stockBadge.label}</Badge>
            {onSale ? <Badge variant="clay">On sale</Badge> : null}
          </div>

          <div className="flex items-baseline gap-3">
            <span className={cn('tabular text-3xl font-semibold', onSale && 'text-clay')}>
              {formatMoney(product.priceCents, product.currency as 'USD')}
            </span>
            {onSale ? (
              <span className="text-base text-muted-foreground line-through">
                {formatMoney(product.compareAtCents!, product.currency as 'USD')}
              </span>
            ) : null}
          </div>

          {product.averageRating > 0 ? (
            <div className="flex items-center gap-2 text-sm">
              <StarRating value={product.averageRating} size="md" />
              <span className="font-medium">{product.averageRating.toFixed(1)}</span>
              <span className="text-muted-foreground">({product.reviewCount} reviews)</span>
            </div>
          ) : null}

          <div className="flex gap-2">
            <AddToCartButton productId={product.id} disabled={product.stock === 0} />
            <WishlistButton productId={product.id} initialSaved={Boolean(saved)} variant="icon" />
          </div>

          <Card>
            <CardContent className="p-4">
              <dl className="grid grid-cols-2 gap-y-3 text-sm">
                <Spec icon={Package} label="SKU" value={product.sku ?? '—'} />
                <Spec icon={Tag} label="Category" value={product.category?.name ?? '—'} />
                <Spec icon={Scale} label="Weight" value={product.weightGrams ? `${product.weightGrams} g` : '—'} />
                <Spec icon={Boxes} label="Stock" value={`${product.stock} units`} />
              </dl>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Separator className="my-8" />
          <section>
            <h2 className="mb-4 text-xl font-semibold tracking-tight">Description</h2>
            <p className="max-w-prose whitespace-pre-line text-[15px] leading-7 text-muted-foreground">{product.description}</p>
          </section>

          <Separator className="my-8" />
          <ProductReviews productId={product.id} initialReviews={reviews} />
        </div>
      </article>

      {relatedItems.length > 0 ? (
        <section className="mt-16">
          <h2 className="mb-6 text-xl font-semibold tracking-tight">You may also like</h2>
          <ProductGrid items={relatedItems} />
        </section>
      ) : null}
    </div>
  );
}

function Spec({ icon: Icon, label, value }: { icon?: typeof Package; label: string; value: string }) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
        {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
        {label}
      </dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}