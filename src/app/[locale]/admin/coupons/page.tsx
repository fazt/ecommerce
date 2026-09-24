import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { parseSort, plainParams, type SearchParams } from '@/lib/table-sort';
import { PageHeader } from '@/components/page-header';
import { CouponForm } from '@/components/admin/coupon-form';

const SORT_KEYS = ['code', 'type', 'value', 'uses', 'active', 'created'] as const;

export default async function AdminCouponsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const sort = parseSort(sp, SORT_KEYS, { key: 'created', dir: 'desc' });
  const orderBy: Prisma.CouponOrderByWithRelationInput = {
    code: { code: sort.dir },
    type: { type: sort.dir },
    value: { value: sort.dir },
    uses: { currentUses: sort.dir },
    active: { isActive: sort.dir },
    created: { createdAt: sort.dir },
  }[sort.key];
  const coupons = await prisma.coupon.findMany({ orderBy: [orderBy, { id: 'asc' }] });
  return (
    <>
      <PageHeader title="Coupons" description="Discount codes customers can apply at checkout." />
      <CouponForm coupons={coupons} sort={sort} params={plainParams(sp)} />
    </>
  );
}
