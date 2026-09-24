import { cn } from '@/lib/utils';

/** Label/amount line used in cart, checkout and order totals. */
export function SummaryRow({
  label,
  value,
  total,
  tone,
}: {
  label: string;
  value: string;
  total?: boolean;
  tone?: 'success';
}) {
  return (
    <div
      className={cn(
        'flex items-baseline justify-between gap-4 text-sm',
        total ? 'pt-1 text-base font-semibold' : 'text-muted-foreground',
        tone === 'success' && 'text-success',
      )}
    >
      <dt>{label}</dt>
      <dd className={cn('tabular', !tone && 'text-foreground', total && 'text-lg')}>{value}</dd>
    </div>
  );
}
