'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { Role } from '@prisma/client';
import { Users } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/empty-state';
import { SortableHead } from '@/components/data-table/sortable-head';
import { ClearFilters, TableFilter, TableSearch } from '@/components/data-table/table-toolbar';
import { formatDate } from '@/lib/utils';
import type { SortState } from '@/lib/table-sort';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: Date;
  _count: { orders: number };
}

const ROLE_OPTIONS = [
  { value: 'USER', label: 'Customer' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'SUPER_ADMIN', label: 'Super admin' },
];

export function UserTable({
  users,
  sort,
  params,
  filtered,
}: {
  users: User[];
  sort: SortState;
  params: Record<string, string>;
  filtered: boolean;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function changeRole(id: string, role: Role) {
    setBusyId(id);
    const res = await fetch(`/api/admin/users/${id}/role`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    setBusyId(null);
    if (res.ok) {
      toast.success('Role updated');
      router.refresh();
    } else toast.error('Could not update role');
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-2 border-b p-3 sm:flex-row sm:items-center">
        <TableSearch placeholder="Search email or name…" />
        <TableFilter param="role" allLabel="All roles" options={ROLE_OPTIONS} />
        <ClearFilters params={['q', 'role', 'sort', 'dir']} />
      </div>
      {users.length === 0 ? (
        <EmptyState icon={Users} title={filtered ? 'No users match' : 'No users yet'} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead column="email" sort={sort} params={params}>Email</SortableHead>
              <SortableHead column="name" sort={sort} params={params} className="hidden md:table-cell">Name</SortableHead>
              <SortableHead column="orders" sort={sort} params={params} firstDir="desc" align="right" className="hidden sm:table-cell">Orders</SortableHead>
              <SortableHead column="role" sort={sort} params={params}>Role</SortableHead>
              <SortableHead column="joined" sort={sort} params={params} firstDir="desc" className="hidden md:table-cell">Joined</SortableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="max-w-[16rem] truncate font-medium">{u.email}</TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">{u.name ?? '—'}</TableCell>
                <TableCell className="hidden text-right sm:table-cell">{u._count.orders}</TableCell>
                <TableCell>
                  <Select value={u.role} onValueChange={(v) => changeRole(u.id, v as Role)} disabled={busyId === u.id}>
                    <SelectTrigger className="h-8 w-36" aria-label={`Role for ${u.email}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="hidden whitespace-nowrap text-muted-foreground md:table-cell">{formatDate(u.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}
