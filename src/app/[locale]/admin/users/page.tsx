import type { Prisma, Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { param, parseSort, plainParams, type SearchParams } from '@/lib/table-sort';
import { PageHeader } from '@/components/page-header';
import { UserTable } from '@/components/admin/user-table';

const SORT_KEYS = ['email', 'name', 'role', 'orders', 'joined'] as const;
const ROLES: Role[] = ['USER', 'ADMIN', 'SUPER_ADMIN'];

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const sort = parseSort(sp, SORT_KEYS, { key: 'joined', dir: 'desc' });
  const q = param(sp, 'q');
  const role = param(sp, 'role');

  const orderBy: Prisma.UserOrderByWithRelationInput = {
    email: { email: sort.dir },
    name: { name: { sort: sort.dir, nulls: 'last' as const } },
    role: { role: sort.dir },
    orders: { orders: { _count: sort.dir } },
    joined: { createdAt: sort.dir },
  }[sort.key];

  const where: Prisma.UserWhereInput = {
    ...(ROLES.includes(role as Role) ? { role: role as Role } : {}),
    ...(q
      ? { OR: [{ email: { contains: q, mode: 'insensitive' } }, { name: { contains: q, mode: 'insensitive' } }] }
      : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: [orderBy, { id: 'asc' }],
      select: { id: true, email: true, name: true, role: true, createdAt: true, _count: { select: { orders: true } } },
    }),
    prisma.user.count(),
  ]);

  return (
    <>
      <PageHeader
        title="Users"
        description={q || role ? `${users.length} of ${total} accounts` : `${total} customer and staff accounts`}
      />
      <UserTable users={users} sort={sort} params={plainParams(sp)} filtered={Boolean(q || role)} />
    </>
  );
}
