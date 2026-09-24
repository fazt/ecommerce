import Link from 'next/link';
import { ArrowRight, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { getFeaturedProducts } from '@/lib/services/catalog';
import { ProductCard } from '@/components/catalog/product-card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/empty-state';

export default async function HomePage() {
  const featured = await getFeaturedProducts(8);
  const mosaic = featured.filter((p) => p.image).slice(0, 3);
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="border-b">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 md:py-20 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div className="space-y-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-clay">New season · curated essentials</p>
            <h1 className="text-[2.5rem] font-semibold leading-[1.05] tracking-[-0.03em] md:text-6xl">
              Fewer things.
              <br />
              <span className="text-muted-foreground">Better made.</span>
            </h1>
            <p className="max-w-md text-base leading-relaxed text-muted-foreground">
              Apparel, electronics and home goods chosen to last. Secure checkout and shipping to wherever you are.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/products">
                  Shop the catalog <ArrowRight />
                </Link>
              </Button>
              <Button size="lg" variant="ghost" asChild>
                <Link href="/products?sort=popular">Most loved</Link>
              </Button>
            </div>
          </div>

          {mosaic.length === 3 ? (
            <div className="grid h-[22rem] grid-cols-2 grid-rows-2 gap-3 md:h-[28rem]">
              {mosaic.map((p, i) => (
                <Link
                  key={p.id}
                  href={`/products/${p.slug}`}
                  className={`group relative overflow-hidden rounded-xl bg-muted outline outline-1 -outline-offset-1 outline-black/5 dark:outline-white/10 ${i === 0 ? 'row-span-2' : ''}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.image!}
                    alt={p.name}
                    className="size-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.03]"
                  />
                  <span className="absolute bottom-2.5 left-2.5 rounded-md bg-background/90 px-2 py-1 text-xs font-medium backdrop-blur">
                    {p.name}
                  </span>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* Promises */}
      <section className="border-b bg-secondary/40">
        <ul className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:grid-cols-3">
          {[
            { icon: Truck, title: 'Free shipping over $75', desc: 'Tracked delivery on every order' },
            { icon: ShieldCheck, title: 'Secure checkout', desc: 'Payments handled by Stripe' },
            { icon: RotateCcw, title: '30-day returns', desc: 'Changed your mind? Send it back' },
          ].map(({ icon: Icon, title, desc }) => (
            <li key={title} className="flex items-center gap-3">
              <Icon aria-hidden className="size-5 shrink-0 text-clay" />
              <div>
                <p className="text-sm font-medium">{title}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Featured */}
      <section className="mx-auto w-full max-w-7xl px-4 py-14">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">Featured</h2>
            <p className="text-sm text-muted-foreground">Hand-picked by our team this month.</p>
          </div>
          <Button variant="ghost" asChild className="text-muted-foreground">
            <Link href="/products">
              View all <ArrowRight />
            </Link>
          </Button>
        </div>
        {featured.length === 0 ? (
          <EmptyState title="No featured products yet" className="rounded-xl border border-dashed" />
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
