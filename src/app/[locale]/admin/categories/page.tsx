import { prisma } from '@/lib/prisma';
import { compareBy, parseSort, plainParams, type SearchParams } from '@/lib/table-sort';
import { PageHeader } from '@/components/page-header';
import { CategoryForm } from '@/components/admin/category-form';

const SORT_KEYS = ['name', 'slug', 'parent', 'products'] as const;

export default async function AdminCategoriesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const sort = parseSort(sp, SORT_KEYS, { key: 'name', dir: 'asc' });
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: { parent: { select: { name: true } }, _count: { select: { products: true } } },
  });
  // Small table: sort in memory so "parent" can fall back to the category's own name.
  const rows = [...categories].sort(
    {
      name: compareBy<(typeof categories)[number]>((c) => c.name, sort.dir),
      slug: compareBy<(typeof categories)[number]>((c) => c.slug, sort.dir),
      parent: compareBy<(typeof categories)[number]>((c) => c.parent?.name, sort.dir),
      products: compareBy<(typeof categories)[number]>((c) => c._count.products, sort.dir),
    }[sort.key],
  );
  return (
    <>
      <PageHeader title="Categories" description="Organize the catalog into categories and subcategories." />
      <CategoryForm categories={rows} sort={sort} params={plainParams(sp)} />
    </>
  );
}
