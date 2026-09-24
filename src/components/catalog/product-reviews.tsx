'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StarRating } from '@/components/star-rating';

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  isApproved: boolean;
  user: { id: string; name: string | null };
}

export function ProductReviews({
  productId,
  initialReviews,
}: {
  productId: string;
  initialReviews: Review[];
}) {
  const [reviews, setReviews] = useState(initialReviews);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState('5');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = {
      productId,
      rating: Number(rating),
      title: String(fd.get('title') ?? '') || undefined,
      comment: String(fd.get('comment') ?? '') || undefined,
    };
    setBusy(true);
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err?.error?.message ?? 'Could not submit');
      return;
    }
    toast.success('Submitted — awaiting approval.');
    setShowForm(false);
    setReviews([{ id: 'temp', rating: body.rating, title: body.title ?? null, comment: body.comment ?? null, isApproved: false, user: { id: 'me', name: 'You' } }, ...reviews]);
  }

  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Customer reviews</h2>
          <p className="text-sm text-muted-foreground">{reviews.filter((r) => r.isApproved).length} approved reviews</p>
        </div>
        <Button variant="outline" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Cancel' : 'Write a review'}
        </Button>
      </div>

      {showForm ? (
        <Card className="mb-6">
          <CardContent className="p-6">
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rating">Rating</Label>
                <Select value={rating} onValueChange={setRating}>
                  <SelectTrigger id="rating" className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 4, 3, 2, 1].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        <span className="flex items-center gap-2">
                          <StarRating value={n} size="xs" />
                          <span className="text-muted-foreground">{n}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title (optional)</Label>
                <Input id="title" name="title" placeholder="Loved the material" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="comment">Comment (optional)</Label>
                <Textarea id="comment" name="comment" rows={4} placeholder="Tell us what you think…" />
              </div>
              <Button type="submit" disabled={busy}>Submit review</Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {reviews.length === 0 ? (
        <p className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">No reviews yet. Be the first to share your thoughts.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {reviews.map((r) => (
            <li key={r.id}>
              <Card>
                <CardContent className="space-y-2 p-5">
                  <StarRating value={r.rating} />
                  {r.title ? <p className="font-medium">{r.title}</p> : null}
                  {r.comment ? <p className="text-sm text-muted-foreground">{r.comment}</p> : null}
                  <p className="text-xs text-muted-foreground">
                    {r.user.name ?? 'Anonymous'}
                    {!r.isApproved ? ' · pending approval' : ''}
                  </p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}