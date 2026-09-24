import { Badge, type BadgeProps } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Variant = NonNullable<BadgeProps['variant']>;

const STATUS: Record<string, { variant: Variant; label: string }> = {
  PENDING: { variant: 'outline', label: 'Pending' },
  PAID: { variant: 'success', label: 'Paid' },
  PROCESSING: { variant: 'secondary', label: 'Processing' },
  SHIPPED: { variant: 'default', label: 'Shipped' },
  DELIVERED: { variant: 'success', label: 'Delivered' },
  CANCELED: { variant: 'destructive', label: 'Canceled' },
  REFUNDED: { variant: 'warning', label: 'Refunded' },
  PARTIALLY_REFUNDED: { variant: 'warning', label: 'Partly refunded' },
  FAILED: { variant: 'destructive', label: 'Failed' },
};

export const ORDER_STATUS_OPTIONS = Object.entries(STATUS).map(([value, s]) => ({ value, label: s.label }));

export function orderStatusLabel(status: string) {
  return STATUS[status]?.label ?? status;
}

export function OrderStatusBadge({ status, className }: { status: string; className?: string }) {
  const s = STATUS[status] ?? { variant: 'outline' as const, label: status };
  return (
    <Badge variant={s.variant} className={cn(className)}>
      <span aria-hidden className="size-1.5 rounded-full bg-current opacity-70" />
      {s.label}
    </Badge>
  );
}
