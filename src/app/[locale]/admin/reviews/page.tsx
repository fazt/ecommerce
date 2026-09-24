import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { param, withParams, type SearchParams } from '@/lib/table-sort';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/page-header';
import { ReviewModeration } from '@/components/admin/review-moderation';
import { TableFilter } from '@/components/data-table/table-toolbar';

const ORDER: Record<string, Prisma.ReviewOrderByWithRelationInput> = {
  newest: { createdAt: 'desc' },
  oldest: { createdAt: 'asc' },
  rating_desc: { rating: 'desc' },
  rating_asc: { rating: 'asc' },
};

export default async function AdminReviewsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const status = param(sp, 'status') === 'approved' ? 'approved' : param(sp, 'status') === 'all' ? 'all' : 'pending';
  const order = ORDER[param(sp, 'order') ?? ''] ?? ORDER.newest!;

  const [reviews, pending, approved] = await Promise.all([
    prisma.review.findMany({
      where: status === 'all' ? {} : { isApproved: status === 'approved' },
      include: { user: { select: { email: true, name: true } }, product: { select: { name: true, slug: true } } },
      orderBy: [order, { id: 'asc' }],
      take: 100,
    }),
    prisma.review.count({ where: { isApproved: false } }),
    prisma.review.count({ where: { isApproved: true } }),
  ]);

  const tabs = [
    { value: 'pending', label: 'Pending', count: pending },
    { value: 'approved', label: 'Approved', count: approved },
    { value: 'all', label: 'All', count: pending + approved },
  ];

  return (
    <>
      <PageHeader title="Reviews" description="Approve reviews before they appear on product pages." />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label="Review status" className="inline-flex w-fit rounded-lg bg-muted p-1">
          {tabs.map((t) => (
            <Link
              key={t.value}
              href={`?${withParams(sp, { status: t.value === 'pending' ? undefined : t.value })}`}
              replace
              scroll={false}
              aria-current={status === t.value ? 'page' : undefined}
              className={cn(
                'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                status === t.value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
              <span
                className={cn(
                  'tabular rounded-full px-1.5 text-xs',
                  t.value === 'pending' && t.count > 0 ? 'bg-clay text-clay-foreground' : 'bg-background/60 text-muted-foreground',
                )}
              >
                {t.count}
              </span>
            </Link>
          ))}
        </nav>
        <TableFilter
          param="order"
          allLabel="Newest first"
          options={[
            { value: 'oldest', label: 'Oldest first' },
            { value: 'rating_desc', label: 'Highest rating' },
            { value: 'rating_asc', label: 'Lowest rating' },
          ]}
        />
      </div>
      <ReviewModeration reviews={reviews} status={status} />
    </>
  );
}
