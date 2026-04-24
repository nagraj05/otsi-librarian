'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/dashboard',      label: 'Dashboard'  },
  { href: '/catalog',        label: 'Catalog'    },
  { href: '/personal-books', label: 'My Books'   },
  { href: '/leaderboard',    label: 'Leaderboard'},
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="hidden sm:flex items-center gap-0.5">
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={`px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-colors ${
            pathname === href || pathname.startsWith(href + '/')
              ? 'bg-brand text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
