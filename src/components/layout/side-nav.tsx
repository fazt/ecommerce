'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export interface SideNavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  /** Match only the exact path (for section roots like `/admin`). */
  exact?: boolean;
}

/** Section navigation: horizontal scroller on mobile, vertical list from `lg`. */
export function SideNav({ items, label }: { items: SideNavItem[]; label: string }) {
  const pathname = usePathname().replace(/^\/(en|es)(?=\/|$)/, '') || '/';
  return (
    <nav aria-label={label} className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden">
      <ul className="flex gap-1 lg:flex-col">
        {items.map((it) => {
          const active = it.exact ? pathname === it.href : pathname === it.href || pathname.startsWith(`${it.href}/`);
          return (
            <li key={it.href} className="shrink-0">
              <Link
                href={it.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors [&_svg]:size-4 [&_svg]:shrink-0',
                  active
                    ? 'bg-accent font-medium text-foreground [&_svg]:text-clay'
                    : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                )}
              >
                {active ? (
                  <span aria-hidden className="absolute inset-y-2 left-0 hidden w-0.5 rounded-full bg-clay lg:block" />
                ) : null}
                {it.icon}
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
