import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { MessageSquareText } from 'lucide-react';
import { requireUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { formatDate } from '@/lib/utils';
import { param, type SearchParams } from '@/lib/table-sort';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import { StarRating } from '@/components/star-rating';
import { TableFilter } from '@/components/data-table/table-toolbar';

const ORDER: Record<string, Prisma.ReviewOrderByWithRelationInput> = {
  newest: { createdAt: 'desc' },
  oldest: { createdAt: 'asc' },
  rating_desc: { rating: 'desc' },
  rating_asc: { rating: 'asc' },
};

export default async function MyReviewsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const reviews = await prisma.review.findMany({
    where: { userId: user.id },
    include: { product: { select: { name: true, slug: true } } },
    orderBy: [ORDER[param(sp, 'order') ?? ''] ?? ORDER.newest!, { id: 'asc' }],
  });
  return (
    <>
      <PageHeader
        title="My reviews"
        description="Reviews are published once our team approves them."
        actions={
          reviews.length > 1 ? (
            <TableFilter
              param="order"
              allLabel="Newest first"
              options={[
                { value: 'oldest', label: 'Oldest first' },
                { value: 'rating_desc', label: 'Highest rating' },
                { value: 'rating_asc', label: 'Lowest rating' },
              ]}
            />
          ) : null
        }
      />
      <Card className="overflow-hidden">
        {reviews.length === 0 ? (
          <EmptyState
            icon={MessageSquareText}
            title="No reviews yet"
            description="Share what you think about products you’ve bought — it helps other shoppers."
            action={
              <Button variant="outline" asChild>
                <Link href="/account/orders">Go to my orders</Link>
              </Button>
            }
          />
        ) : (
          <ul className="divide-y">
            {reviews.map((r) => (
              <li key={r.id} className="space-y-2 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link href={`/products/${r.product.slug}`} className="text-sm font-medium hover:underline">
                    {r.product.name}
                  </Link>
                  <Badge variant={r.isApproved ? 'success' : 'outline'}>{r.isApproved ? 'Published' : 'In review'}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <StarRating value={r.rating} />
                  <span className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</span>
                </div>
                {r.title ? <p className="text-sm font-medium">{r.title}</p> : null}
                {r.comment ? <p className="max-w-prose text-sm text-muted-foreground">{r.comment}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
