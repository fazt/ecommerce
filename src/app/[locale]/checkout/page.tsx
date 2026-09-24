import { redirect } from 'next/navigation';
import { CreditCard, MapPin, Truck } from 'lucide-react';
import { requireUser } from '@/lib/auth-helpers';
import { getCart } from '@/lib/services/cart';
import { listAddresses } from '@/lib/services/user';
import { listEligibleRatesForCountry } from '@/lib/services/shipping';
import { CheckoutForm, type CheckoutFormProps } from '@/components/checkout/checkout-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { SummaryRow } from '@/components/summary-row';
import { computeRateCostCents } from '@/lib/shipping';

export default async function CheckoutPage() {
  const user = await requireUser();
  const [cart, addresses] = await Promise.all([getCart(user.id), listAddresses(user.id)]);
  if (cart.items.length === 0) redirect('/cart');

  // Determine country from default (or first) shipping address.
  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];
  const country = defaultAddress?.country ?? 'US';

  const subtotalCents = cart.totals.subtotalCents;
  const discountCents = cart.totals.discountCents;
  const taxCents = cart.totals.taxCents;
  // Cart items don't carry weight info; default to 0 (per-kg shipping falls back to base).
  const weightGrams = 0;

  // Eligible shipping rates for the user's country.
  const eligibleRates = defaultAddress
    ? await listEligibleRatesForCountry({ country, subtotalCents, weightGrams })
    : [];

  const formProps: CheckoutFormProps = {
    addresses,
    subtotalCents,
    discountCents,
    taxCents,
    eligibleRates,
    weightGrams,
    country,
  };

  // For the static summary, show the cheapest rate as a default preview.
  const previewShipping = eligibleRates.length
    ? computeRateCostCents(eligibleRates[0]!, weightGrams)
    : 0;
  const previewTotal = Math.max(0, subtotalCents + previewShipping + taxCents - discountCents);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:py-12">
      <div className="mb-8 space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Checkout</h1>
        <p className="text-sm text-muted-foreground">Confirm where it goes, then pay securely with Stripe.</p>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 space-y-0">
              <MapPin className="h-4 w-4" />
              <CardTitle className="text-base">Shipping address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CheckoutForm {...formProps} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-2 space-y-0">
              <Truck className="h-4 w-4" />
              <CardTitle className="text-base">Order summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="divide-y">
                {cart.items.map((it) => (
                  <li key={it.itemId} className="flex items-center gap-3 py-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md border bg-muted">
                      {it.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={it.image} alt={it.name} className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{it.name}</p>
                      <p className="text-xs text-muted-foreground">Qty {it.quantity}</p>
                    </div>
                    <p className="tabular text-sm font-medium">
                      ${(it.unitPriceCents * it.quantity / 100).toFixed(2)}
                    </p>
                  </li>
                ))}
              </ul>
              <Separator />
              <dl className="space-y-2">
                <SummaryRow label="Subtotal" value={`$${(subtotalCents / 100).toFixed(2)}`} />
                {discountCents > 0 ? (
                  <SummaryRow label="Discount" value={`−$${(discountCents / 100).toFixed(2)}`} tone="success" />
                ) : null}
                <SummaryRow
                  label="Shipping"
                  value={previewShipping === 0 ? 'Free' : `$${(previewShipping / 100).toFixed(2)}`}
                />
                <SummaryRow label="Tax" value={`$${(taxCents / 100).toFixed(2)}`} />
                <Separator className="!my-3" />
                <SummaryRow label="Total" value={`$${(previewTotal / 100).toFixed(2)}`} total />
              </dl>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit lg:sticky lg:top-24">
          <CardHeader className="flex flex-row items-center gap-2 space-y-0">
            <CreditCard className="h-4 w-4" />
            <CardTitle className="text-base">Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>You will be redirected to Stripe to enter your card details securely.</p>
            <p>Tax is calculated automatically based on your shipping address.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}