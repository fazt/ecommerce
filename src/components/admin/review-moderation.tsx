'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Check, X, Loader2, MessageSquareText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/empty-state';
import { StarRating } from '@/components/star-rating';
import { formatDate } from '@/lib/utils';

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  isApproved: boolean;
  createdAt: Date;
  user: { email: string; name: string | null };
  product: { name: string; slug: string };
}

export function ReviewModeration({ reviews, status }: { reviews: Review[]; status: 'pending' | 'approved' | 'all' }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function moderate(id: string, approved: boolean) {
    setBusyId(id);
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ isApproved: approved }),
    });
    setBusyId(null);
    if (res.ok) {
      toast.success(approved ? 'Review approved' : 'Review rejected');
      router.refresh();
    } else toast.error('Could not update review');
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={MessageSquareText}
          title={status === 'pending' ? 'Nothing to moderate' : 'No reviews here'}
          description={status === 'pending' ? 'New customer reviews will wait here for approval.' : undefined}
        />
      </Card>
    );
  }

  return (
    <Card className="divide-y overflow-hidden">
      {reviews.map((r) => (
        <article key={r.id} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-6 sm:p-5">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <StarRating value={r.rating} />
              <Link href={`/products/${r.product.slug}`} className="truncate text-sm font-medium hover:underline">
                {r.product.name}
              </Link>
              {status === 'all' ? (
                <Badge variant={r.isApproved ? 'success' : 'outline'}>{r.isApproved ? 'Approved' : 'Pending'}</Badge>
              ) : null}
            </div>
            {r.title ? <p className="text-sm font-medium">{r.title}</p> : null}
            {r.comment ? (
              <p className="max-w-prose text-sm text-muted-foreground">{r.comment}</p>
            ) : (
              <p className="text-sm italic text-muted-foreground">No comment</p>
            )}
            <p className="text-xs text-muted-foreground">
              {r.user.name ?? r.user.email} · {formatDate(r.createdAt)}
            </p>
          </div>
          <div className="flex items-start gap-2">
            {!r.isApproved ? (
              <Button size="sm" disabled={busyId === r.id} onClick={() => moderate(r.id, true)}>
                {busyId === r.id ? <Loader2 className="animate-spin" /> : <Check />}
                Approve
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                disabled={busyId === r.id}
                onClick={() => moderate(r.id, false)}
                className="text-destructive hover:text-destructive"
              >
                {busyId === r.id ? <Loader2 className="animate-spin" /> : <X />}
                Unpublish
              </Button>
            )}
          </div>
        </article>
      ))}
    </Card>
  );
}
