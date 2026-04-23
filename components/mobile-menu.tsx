'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';
import { ThemeToggle } from '@/components/theme-toggle';

const links = [
  { href: '/dashboard',   label: 'Dashboard' },
  { href: '/catalog',     label: 'Catalog' },
  { href: '/leaderboard', label: 'Leaderboard' },
];

export function MobileMenu({ isAdmin }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <div className="sm:hidden">
      <button
        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle menu"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {open && (
        <div className="fixed inset-x-0 top-16 z-50 bg-card/95 backdrop-blur-xl border-b border-border shadow-lg">
          <nav className="flex flex-col p-3 gap-1 max-w-5xl mx-auto">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`px-4 py-3 rounded-xl text-[14px] font-semibold transition-colors ${
                  pathname === href || pathname.startsWith(href + '/')
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                {label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className={`px-4 py-3 rounded-xl text-[14px] font-semibold transition-colors ${
                  pathname === '/admin'
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                Admin
              </Link>
            )}

            <div className="my-1 border-t border-border" />

            <div className="flex items-center justify-between px-4 py-2">
              <span className="text-[14px] font-semibold text-muted-foreground">Theme</span>
              <ThemeToggle />
            </div>

            <div className="flex items-center justify-between px-4 py-2">
              <span className="text-[14px] font-semibold text-muted-foreground">Profile</span>
              <UserButton />
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
