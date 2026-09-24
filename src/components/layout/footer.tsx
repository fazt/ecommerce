import Link from 'next/link';
import { Github, Twitter, Mail } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { siteConfig } from '@/config/site';

export function Footer() {
  return (
    <footer className="mt-16 border-t bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-md bg-foreground text-background">
                <span className="text-[13px] font-semibold">E</span>
              </div>
              <span className="font-semibold">{siteConfig.name}</span>
            </div>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">{siteConfig.description}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Shop</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/products" className="hover:text-foreground">
                  Catalog
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-foreground">
                  Cart
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="hover:text-foreground">
                  Wishlist
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Support</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="mailto:support@example.com" className="hover:text-foreground">
                  Contact
                </a>
              </li>
              <li>
                <Link href="/account" className="hover:text-foreground">
                  My account
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <Separator className="my-8" />
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-3 text-muted-foreground">
            <a href="#" aria-label="GitHub" className="hover:text-foreground">
              <Github className="h-4 w-4" />
            </a>
            <a href="#" aria-label="Twitter" className="hover:text-foreground">
              <Twitter className="h-4 w-4" />
            </a>
            <a href={`mailto:${siteConfig.supportEmail}`} aria-label="Email" className="hover:text-foreground">
              <Mail className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}