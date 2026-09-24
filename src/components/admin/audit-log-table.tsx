import { ScrollText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/empty-state';
import { SortableHead } from '@/components/data-table/sortable-head';
import { ClearFilters, TableFilter, TableSearch } from '@/components/data-table/table-toolbar';
import { formatDateTime } from '@/lib/utils';
import type { SearchParams, SortState } from '@/lib/table-sort';

interface Entry {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string;
  createdAt: Date;
  user: { email: string } | null;
}

/** `order.status_changed` → verb tone: deletions read as destructive, creations as success. */
function actionVariant(action: string) {
  if (/delete|remov|cancel|refund/i.test(action)) return 'destructive' as const;
  if (/creat|add/i.test(action)) return 'success' as const;
  return 'outline' as const;
}

export function AuditLogTable({
  entries,
  sort,
  params,
  entities,
  filtered,
  limit,
}: {
  entries: Entry[];
  sort: SortState;
  params: SearchParams;
  entities: string[];
  filtered: boolean;
  limit: number;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-2 border-b p-3 sm:flex-row sm:items-center">
        <TableSearch placeholder="Action, actor or ID…" />
        <TableFilter param="entity" allLabel="All entities" options={entities.map((e) => ({ value: e, label: e }))} />
        <ClearFilters params={['q', 'entity', 'sort', 'dir']} />
        <p className="text-xs text-muted-foreground sm:ml-auto">
          {entries.length === limit ? `Latest ${limit} events` : `${entries.length} events`}
        </p>
      </div>
      {entries.length === 0 ? (
        <EmptyState icon={ScrollText} title={filtered ? 'No events match' : 'No audit events yet'} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead column="when" sort={sort} params={params} firstDir="desc">When</SortableHead>
              <SortableHead column="actor" sort={sort} params={params} className="hidden md:table-cell">Actor</SortableHead>
              <SortableHead column="action" sort={sort} params={params}>Action</SortableHead>
              <SortableHead column="entity" sort={sort} params={params}>Entity</SortableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="whitespace-nowrap text-muted-foreground">{formatDateTime(e.createdAt)}</TableCell>
                <TableCell className="hidden max-w-[14rem] truncate md:table-cell">{e.user?.email ?? 'system'}</TableCell>
                <TableCell>
                  <Badge variant={actionVariant(e.action)} className="font-mono text-[11px]">
                    {e.action}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  <span className="text-foreground">{e.entity}</span>#{e.entityId.slice(-8)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}
