import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, ExternalLink } from 'lucide-react';
import { ProductForm } from '@/components/admin/product-form';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/prisma';
import { awaitParams } from '@/lib/next-params';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await awaitParams(params);
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id }, include: { images: true } }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
  ]);
  if (!product) notFound();
  return (
    <>
      <div className="space-y-3">
        <Button variant="ghost" size="sm" asChild className="-ml-3 text-muted-foreground">
          <Link href="/admin/products">
            <ChevronLeft /> Products
          </Link>
        </Button>
        <PageHeader
          title={product.name}
          description={product.sku ? <span className="font-mono">{product.sku}</span> : 'Edit product details'}
          actions={
            product.isActive ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/products/${product.slug}`} target="_blank">
                  View in store <ExternalLink />
                </Link>
              </Button>
            ) : null
          }
        />
      </div>
      <ProductForm categories={categories} initial={{ ...product, tags: product.tags ?? [] }} />
    </>
  );
}
