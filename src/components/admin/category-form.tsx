'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Loader2, FolderTree, CornerDownRight } from 'lucide-react';
import type { Category } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/empty-state';
import { SortableHead } from '@/components/data-table/sortable-head';
import type { SortState } from '@/lib/table-sort';

type Row = Category & { parent: { name: string } | null; _count: { products: number } };

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function CategoryForm({
  categories,
  sort,
  params,
}: {
  categories: Row[];
  sort: SortState;
  params: Record<string, string>;
}) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [parentId, setParentId] = useState('__none');
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name,
        slug: slug || slugify(name),
        parentId: parentId === '__none' ? undefined : parentId,
      }),
    });
    setBusy(false);
    if (res.ok) {
      toast.success(`Category “${name}” added`);
      router.refresh();
      setName('');
      setSlug('');
      setParentId('__none');
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err?.error?.message ?? 'Could not add category');
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
      <Card className="overflow-hidden">
        {categories.length === 0 ? (
          <EmptyState icon={FolderTree} title="No categories yet" description="Add one with the form to group products." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHead column="name" sort={sort} params={params}>Name</SortableHead>
                <SortableHead column="slug" sort={sort} params={params} className="hidden sm:table-cell">Slug</SortableHead>
                <SortableHead column="parent" sort={sort} params={params} className="hidden md:table-cell">Parent</SortableHead>
                <SortableHead column="products" sort={sort} params={params} firstDir="desc" align="right">Products</SortableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      {c.parentId ? <CornerDownRight aria-hidden className="size-3.5 text-muted-foreground" /> : null}
                      {c.name}
                    </span>
                  </TableCell>
                  <TableCell className="hidden font-mono text-xs text-muted-foreground sm:table-cell">/{c.slug}</TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">{c.parent?.name ?? '—'}</TableCell>
                  <TableCell className="text-right">{c._count.products}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Plus className="size-4 text-muted-foreground" /> New category
          </CardTitle>
          <CardDescription>The slug is generated from the name if left empty.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={add} className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Name</Label>
              <Input id="cat-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Outerwear" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-slug">Slug</Label>
              <Input
                id="cat-slug"
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                placeholder={slugify(name) || 'outerwear'}
                className="font-mono text-[13px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-parent">Parent</Label>
              <Select value={parentId} onValueChange={setParentId}>
                <SelectTrigger id="cat-parent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">None (top level)</SelectItem>
                  {categories
                    .filter((c) => !c.parentId)
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={busy || !name} className="sm:col-span-3 xl:col-span-1">
              {busy ? <Loader2 className="animate-spin" /> : <Plus />}
              Add category
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
