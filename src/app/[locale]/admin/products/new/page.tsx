import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { ProductForm } from '@/components/admin/product-form';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/prisma';

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  return (
    <>
      <div className="space-y-3">
        <Button variant="ghost" size="sm" asChild className="-ml-3 text-muted-foreground">
          <Link href="/admin/products">
            <ChevronLeft /> Products
          </Link>
        </Button>
        <PageHeader title="New product" description="Add an item to the catalog. Drafts stay hidden from customers." />
      </div>
      <ProductForm categories={categories} />
    </>
  );
}
