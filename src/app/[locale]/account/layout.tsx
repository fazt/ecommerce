import { LayoutGrid, Package, UserRound, MapPin, Star, Heart } from 'lucide-react';
import { requireUser } from '@/lib/auth-helpers';
import { SideNav } from '@/components/layout/side-nav';

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const items = [
    { href: '/account', label: 'Overview', icon: <LayoutGrid />, exact: true },
    { href: '/account/orders', label: 'Orders', icon: <Package /> },
    { href: '/account/profile', label: 'Profile', icon: <UserRound /> },
    { href: '/account/addresses', label: 'Addresses', icon: <MapPin /> },
    { href: '/account/reviews', label: 'My reviews', icon: <Star /> },
    { href: '/wishlist', label: 'Wishlist', icon: <Heart /> },
  ];
  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[216px_minmax(0,1fr)] lg:gap-10 lg:py-10">
      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className="hidden px-3 lg:block">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Signed in as</p>
          <p className="mt-1 truncate text-sm font-medium">{user.email}</p>
        </div>
        <SideNav items={items} label="Account" />
      </aside>
      <section className="min-w-0 space-y-6">{children}</section>
    </div>
  );
}
