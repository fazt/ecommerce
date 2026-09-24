import Link from 'next/link';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { TableHead } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { withParams, type SearchParams, type SortDir, type SortState } from '@/lib/table-sort';

interface Props {
  column: string;
  sort: SortState;
  params: SearchParams;
  children: React.ReactNode;
  /** Direction applied on the first click — numbers and dates usually want `desc`. */
  firstDir?: SortDir;
  align?: 'left' | 'right';
  className?: string;
}

/** Table header cell that toggles `?sort=&dir=` for its column. */
export function SortableHead({ column, sort, params, children, firstDir = 'asc', align = 'left', className }: Props) {
  const active = sort.key === column;
  const nextDir: SortDir = active ? (sort.dir === 'asc' ? 'desc' : 'asc') : firstDir;
  const Icon = !active ? ChevronsUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown;
  return (
    <TableHead
      aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={cn(align === 'right' && 'text-right', className)}
    >
      <Link
        href={`?${withParams(params, { sort: column, dir: nextDir, page: undefined })}`}
        scroll={false}
        replace
        className={cn(
          'group/sort -mx-2 inline-flex h-7 items-center gap-1 rounded-md px-2 transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          active && 'text-foreground',
          align === 'right' && 'flex-row-reverse',
        )}
      >
        {children}
        <Icon
          aria-hidden
          className={cn(
            'size-3.5 shrink-0 transition-opacity',
            active ? 'text-clay' : 'opacity-40 group-hover/sort:opacity-80',
          )}
        />
      </Link>
    </TableHead>
  );
}
