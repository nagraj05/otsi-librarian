import { Library } from 'lucide-react';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/notification-bell';
import { Notification } from '@/lib/types';
import sql from '@/lib/db';

interface NavbarProps {
  isAdmin?: boolean;
  activePath?: 'dashboard' | 'catalog' | 'leaderboard' | 'admin';
}

async function getNotifications(userId: string): Promise<Notification[]> {
  try {
    const rows = await sql`
      SELECT * FROM notifications
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 30
    `;
    return rows as Notification[];
  } catch {
    return [];
  }
}

export async function Navbar({ isAdmin, activePath }: NavbarProps) {
  const { userId } = await auth();
  const notifications = userId ? await getNotifications(userId) : [];

  const navLinks = [
    { href: '/dashboard',   label: 'Dashboard',   key: 'dashboard' },
    { href: '/catalog',     label: 'Catalog',     key: 'catalog' },
    { href: '/leaderboard', label: 'Leaderboard', key: 'leaderboard' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-brand flex items-center justify-center shadow-md shadow-brand/20">
            <Library style={{ width: 16, height: 16 }} className="text-white" />
          </div>
          <span className="font-bold text-foreground text-[14px] tracking-tight hidden sm:block">OTSI LIBRARY</span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-0.5">
          {navLinks.map(({ href, label, key }) => (
            <Link
              key={key}
              href={href}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-colors ${
                activePath === key
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />
          {isAdmin && (
            <Link href="/admin">
              <Button size="sm" variant="outline" className="rounded-xl h-8 px-3 text-[12px] font-semibold hidden sm:flex">
                Admin
              </Button>
            </Link>
          )}
          <NotificationBell initial={notifications} />
          <UserButton />
        </div>
      </div>
    </header>
  );
}
