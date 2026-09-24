import { prisma } from '@/lib/prisma';
import { ShippingForm } from '@/components/admin/shipping-form';
import { PageHeader } from '@/components/page-header';

export default async function AdminShippingPage() {
  const zones = await prisma.shippingZone.findMany({
    include: { rates: { orderBy: { basePriceCents: 'asc' } } },
    orderBy: { name: 'asc' },
  });
  return (
    <>
      <PageHeader title="Shipping" description="Zones group countries; each zone offers its own rates at checkout." />
      <ShippingForm zones={zones} />
    </>
  );
}