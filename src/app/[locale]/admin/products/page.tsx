import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { Pencil, Plus, Package } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { formatMoney } from '@/lib/money';
import { param, parseSort, type SearchParams } from '@/lib/table-sort';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import { SortableHead } from '@/components/data-table/sortable-head';
import { ClearFilters, TableFilter, TableSearch } from '@/components/data-table/table-toolbar';

const SORT_KEYS = ['name', 'category', 'price', 'stock', 'status', 'created'] as const;

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const sort = parseSort(sp, SORT_KEYS, { key: 'created', dir: 'desc' });
  const q = param(sp, 'q');
  const status = param(sp, 'status');

  const orderBy: Prisma.ProductOrderByWithRelationInput = {
    name: { name: sort.dir },
    category: { category: { name: sort.dir } },
    price: { priceCents: sort.dir },
    stock: { stock: sort.dir },
    status: { isActive: sort.dir },
    created: { createdAt: sort.dir },
  }[sort.key];

  const where: Prisma.ProductWhereInput = {
    ...(q
      ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { sku: { contains: q, mode: 'insensitive' } }] }
      : {}),
    ...(status === 'active' ? { isActive: true } : status === 'draft' ? { isActive: false } : {}),
    ...(status === 'low' ? { stock: { lt: 5 } } : {}),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({ where, orderBy: [orderBy, { id: 'asc' }], include: { category: true } }),
    prisma.product.count(),
  ]);
  const filtered = Boolean(q || status);

  return (
    <>
      <PageHeader
        title="Products"
        description={filtered ? `${products.length} of ${total} products` : `${total} products in catalog`}
        actions={
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus /> New product
            </Link>
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-2 border-b p-3 sm:flex-row sm:items-center">
          <TableSearch placeholder="Search name or SKU…" />
          <TableFilter
            param="status"
            allLabel="All products"
            options={[
              { value: 'active', label: 'Active' },
              { value: 'draft', label: 'Drafts' },
              { value: 'low', label: 'Low stock (< 5)' },
            ]}
          />
          <ClearFilters params={['q', 'status', 'sort', 'dir']} />
        </div>
        {products.length === 0 ? (
          <EmptyState
            icon={Package}
            title={filtered ? 'No products match' : 'No products yet'}
            description={filtered ? 'Try another search term or filter.' : 'Create your first product to start selling.'}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHead column="name" sort={sort} params={sp}>Product</SortableHead>
                <SortableHead column="category" sort={sort} params={sp} className="hidden md:table-cell">Category</SortableHead>
                <SortableHead column="price" sort={sort} params={sp} firstDir="desc" align="right">Price</SortableHead>
                <SortableHead column="stock" sort={sort} params={sp} align="right">Stock</SortableHead>
                <SortableHead column="status" sort={sort} params={sp} firstDir="desc">Status</SortableHead>
                <TableHead className="w-0"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link href={`/admin/products/${p.id}/edit`} className="font-medium hover:underline">
                      {p.name}
                    </Link>
                    {p.sku ? <p className="font-mono text-xs text-muted-foreground">{p.sku}</p> : null}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">{p.category?.name ?? '—'}</TableCell>
                  <TableCell className="text-right">{formatMoney(p.priceCents, p.currency as 'USD')}</TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        p.stock === 0 ? 'font-medium text-destructive' : p.stock < 5 ? 'font-medium text-warning' : undefined
                      }
                    >
                      {p.stock}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.isActive ? 'success' : 'outline'}>{p.isActive ? 'Active' : 'Draft'}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="size-8" asChild>
                      <Link href={`/admin/products/${p.id}/edit`} aria-label={`Edit ${p.name}`}>
                        <Pencil />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </>
  );
}
