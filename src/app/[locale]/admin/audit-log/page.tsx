import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { param, parseSort, type SearchParams } from '@/lib/table-sort';
import { PageHeader } from '@/components/page-header';
import { AuditLogTable } from '@/components/admin/audit-log-table';

const SORT_KEYS = ['when', 'actor', 'action', 'entity'] as const;
const LIMIT = 200;

export default async function AdminAuditLogPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const sort = parseSort(sp, SORT_KEYS, { key: 'when', dir: 'desc' });
  const q = param(sp, 'q');
  const entity = param(sp, 'entity');

  const orderBy: Prisma.AuditLogOrderByWithRelationInput = {
    when: { createdAt: sort.dir },
    actor: { user: { email: sort.dir } },
    action: { action: sort.dir },
    entity: { entity: sort.dir },
  }[sort.key];
  const where: Prisma.AuditLogWhereInput = {
    ...(entity ? { entity } : {}),
    ...(q
      ? {
          OR: [
            { action: { contains: q, mode: 'insensitive' } },
            { entityId: { contains: q, mode: 'insensitive' } },
            { user: { email: { contains: q, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  const [entries, entities] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: [orderBy, { id: 'asc' }],
      take: LIMIT,
      include: { user: { select: { email: true } } },
    }),
    prisma.auditLog.findMany({ distinct: ['entity'], select: { entity: true }, orderBy: { entity: 'asc' } }),
  ]);

  return (
    <>
      <PageHeader title="Audit log" description="Every admin change, with who made it and when." />
      <AuditLogTable
        entries={entries}
        sort={sort}
        params={sp}
        entities={entities.map((e) => e.entity)}
        filtered={Boolean(q || entity)}
        limit={LIMIT}
      />
    </>
  );
}
