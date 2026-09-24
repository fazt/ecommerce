import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingBag,
  Ticket,
  Truck,
  Users,
  Star,
  BarChart3,
  ScrollText,
} from 'lucide-react';
import { requireRole } from '@/lib/auth-helpers';
import { SideNav } from '@/components/layout/side-nav';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(['ADMIN', 'SUPER_ADMIN']);
  const items = [
    { href: '/admin', label: 'Dashboard', icon: <LayoutDashboard />, exact: true },
    { href: '/admin/orders', label: 'Orders', icon: <ShoppingBag /> },
    { href: '/admin/products', label: 'Products', icon: <Package /> },
    { href: '/admin/categories', label: 'Categories', icon: <FolderTree /> },
    { href: '/admin/reviews', label: 'Reviews', icon: <Star /> },
    { href: '/admin/coupons', label: 'Coupons', icon: <Ticket /> },
    { href: '/admin/shipping', label: 'Shipping', icon: <Truck /> },
    { href: '/admin/users', label: 'Users', icon: <Users /> },
    { href: '/admin/reports', label: 'Reports', icon: <BarChart3 /> },
    { href: '/admin/audit-log', label: 'Audit log', icon: <ScrollText /> },
  ];
  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[216px_minmax(0,1fr)] lg:gap-10 lg:py-10">
      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className="hidden px-3 lg:block">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Back office</p>
          <p className="mt-1 truncate text-sm font-medium">{user.email}</p>
        </div>
        <SideNav items={items} label="Admin" />
      </aside>
      <section className="min-w-0 space-y-6">{children}</section>
    </div>
  );
}
