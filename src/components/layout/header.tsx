'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { signOut } from 'next-auth/react';
import { ShoppingCart, User, Menu, Globe, LogOut, Package, Settings, Heart, ChevronDown } from 'lucide-react';
import type { Session } from 'next-auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

export function Header({ locale, session }: { locale: string; session: Session | null }) {
  const t = useTranslations('common');
  const currentLocale = useLocale();
  const user = session?.user as { id?: string; role?: string; name?: string | null; email?: string } | undefined;
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const path = usePathname().replace(/^\/(en|es)(?=\/|$)/, '') || '/';
  const navClass = (href: string) =>
    cn(
      'relative py-1 transition-colors hover:text-foreground',
      path === href || path.startsWith(`${href}/`)
        ? 'text-foreground after:absolute after:inset-x-0 after:-bottom-[21px] after:h-0.5 after:bg-clay'
        : 'text-muted-foreground',
    );

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href={`/${currentLocale}`} className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-foreground text-background">
              <span className="text-[13px] font-semibold">E</span>
            </div>
            <span className="text-base font-semibold tracking-tight">{t('brand')}</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm md:flex" aria-label="Main">
            <Link
              href={`/${currentLocale}/products`}
              className={navClass('/products')}
            >
              Products
            </Link>
            <Link
              href={`/${currentLocale}/wishlist`}
              className={navClass('/wishlist')}
            >
              Wishlist
            </Link>
            {isAdmin ? (
              <Link
                href={`/${currentLocale}/admin`}
                className={navClass('/admin')}
              >
                Admin
              </Link>
            ) : null}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/${currentLocale}/cart`}
            aria-label={t('cart')}
            className={cn(
              'inline-flex size-10 items-center justify-center rounded-md transition-colors hover:bg-accent',
              path === '/cart' && 'bg-accent',
            )}
          >
            <ShoppingCart className="size-[18px]" />
          </Link>

          <LocaleSwitcher currentLocale={currentLocale} />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2">
                  <div className="flex size-7 items-center justify-center rounded-full bg-clay text-xs font-semibold text-clay-foreground">
                    {user.email?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                  <ChevronDown className="hidden h-4 w-4 md:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Signed in as</span>
                  <span className="truncate text-sm font-medium">{user.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/${currentLocale}/account`} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" /> Account
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/${currentLocale}/account/orders`} className="cursor-pointer">
                    <Package className="mr-2 h-4 w-4" /> Orders
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/${currentLocale}/wishlist`} className="cursor-pointer">
                    <Heart className="mr-2 h-4 w-4" /> Wishlist
                  </Link>
                </DropdownMenuItem>
                {isAdmin ? (
                  <DropdownMenuItem asChild>
                    <Link href={`/${currentLocale}/admin`} className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" /> Admin
                    </Link>
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    signOut({ callbackUrl: `/${currentLocale}` });
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" /> {t('logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Button variant="ghost" asChild>
                <Link href={`/${currentLocale}/auth/login`}>{t('login')}</Link>
              </Button>
              <Button asChild>
                <Link href={`/${currentLocale}/auth/register`}>{t('register')}</Link>
              </Button>
            </div>
          )}

          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>{t('brand')}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-1 text-sm [&>a]:rounded-md [&>a]:px-3 [&>a]:py-2.5 [&>a:hover]:bg-accent">
                <Link href={`/${currentLocale}/products`}>Products</Link>
                <Link href={`/${currentLocale}/cart`}>{t('cart')}</Link>
                <Link href={`/${currentLocale}/wishlist`}>Wishlist</Link>
                {user ? (
                  <>
                    <Link href={`/${currentLocale}/account`}>{t('account')}</Link>
                    <Link href={`/${currentLocale}/account/orders`}>Orders</Link>
                    {isAdmin ? <Link href={`/${currentLocale}/admin`}>Admin</Link> : null}
                    <Button
                      variant="outline"
                      className="mt-3"
                      onClick={() => signOut({ callbackUrl: `/${currentLocale}` })}
                    >
                      {t('logout')}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild>
                      <Link href={`/${currentLocale}/auth/login`}>{t('login')}</Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href={`/${currentLocale}/auth/register`}>{t('register')}</Link>
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

function LocaleSwitcher({ currentLocale }: { currentLocale: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Language">
          <Globe className="size-[18px]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onSelect={() => (window.location.href = window.location.pathname.replace(/^\/(en|es)/, '/en'))}
          className={cn(currentLocale === 'en' && 'bg-accent')}
        >
          <span className="mr-2">🇺🇸</span> English
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => (window.location.href = window.location.pathname.replace(/^\/(en|es)/, '/es'))}
          className={cn(currentLocale === 'es' && 'bg-accent')}
        >
          <span className="mr-2">🇪🇸</span> Español
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}