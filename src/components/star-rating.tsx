import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StarRating({ value, className, size = 'sm' }: { value: number; className?: string; size?: 'xs' | 'sm' | 'md' }) {
  const rounded = Math.round(value);
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} role="img" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          aria-hidden
          className={cn(
            size === 'xs' ? 'size-3' : size === 'sm' ? 'size-3.5' : 'size-4',
            n <= rounded ? 'fill-rating text-rating' : 'fill-muted text-border',
          )}
        />
      ))}
    </span>
  );
}
