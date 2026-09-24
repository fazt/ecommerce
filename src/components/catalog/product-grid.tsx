import type { CatalogItem } from '@/lib/services/catalog';
import { ProductCard } from './product-card';
import { Card, CardContent } from '@/components/ui/card';

export function ProductGrid({ items }: { items: CatalogItem[] }) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="flex h-40 items-center justify-center text-sm text-muted-foreground">
          No products found.
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-3">
      {items.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}