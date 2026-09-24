import { formatMoney } from '@/lib/money';
import { Separator } from '@/components/ui/separator';
import { SummaryRow } from '@/components/summary-row';

interface Snapshot {
  name?: string;
  imageUrl?: string | null;
  sku?: string | null;
}

interface OrderLike {
  currency: string;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
  items: Array<{ id: string; quantity: number; unitPriceCents: number; totalCents: number; productSnapshot: unknown }>;
}

/** Line items followed by the totals block, shared by the customer and admin order pages. */
export function OrderSummary({ order }: { order: OrderLike }) {
  const cur = order.currency as 'USD';
  return (
    <div className="space-y-4">
      <ul className="divide-y">
        {order.items.map((item) => {
          const snap = (item.productSnapshot ?? {}) as Snapshot;
          return (
            <li key={item.id} className="flex items-center gap-4 py-3 first:pt-0">
              <div className="size-12 shrink-0 overflow-hidden rounded-md bg-muted outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10">
                {snap.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={snap.imageUrl} alt="" className="size-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{snap.name ?? 'Product'}</p>
                <p className="tabular text-xs text-muted-foreground">
                  {item.quantity} × {formatMoney(item.unitPriceCents, cur)}
                  {snap.sku ? <span className="font-mono"> · {snap.sku}</span> : null}
                </p>
              </div>
              <p className="tabular text-sm font-medium">{formatMoney(item.totalCents, cur)}</p>
            </li>
          );
        })}
      </ul>
      <Separator />
      <dl className="space-y-1.5">
        <SummaryRow label="Subtotal" value={formatMoney(order.subtotalCents, cur)} />
        {order.discountCents > 0 ? (
          <SummaryRow label="Discount" value={`−${formatMoney(order.discountCents, cur)}`} tone="success" />
        ) : null}
        <SummaryRow label="Shipping" value={order.shippingCents === 0 ? 'Free' : formatMoney(order.shippingCents, cur)} />
        <SummaryRow label="Tax" value={formatMoney(order.taxCents, cur)} />
        <Separator className="!my-3" />
        <SummaryRow label="Total" value={formatMoney(order.totalCents, cur)} total />
      </dl>
    </div>
  );
}

interface AddressJson {
  name?: string;
  line1?: string;
  line2?: string | null;
  city?: string;
  state?: string | null;
  postalCode?: string;
  country?: string;
}

export function AddressBlock({ address }: { address: unknown }) {
  const a = (address ?? {}) as AddressJson;
  if (!a.line1) return <p className="text-sm text-muted-foreground">No address on file.</p>;
  return (
    <address className="text-sm not-italic leading-6">
      {a.name ? <span className="block font-medium">{a.name}</span> : null}
      {a.line1}
      {a.line2 ? `, ${a.line2}` : ''}
      <br />
      {[a.city, a.state, a.postalCode].filter(Boolean).join(', ')}
      <br />
      <span className="text-muted-foreground">{a.country}</span>
    </address>
  );
}
