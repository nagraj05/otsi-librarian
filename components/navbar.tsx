import { Library } from 'lucide-react';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/notification-bell';
import { NavLinks } from '@/components/nav-links';
import { MobileMenu } from '@/components/mobile-menu';
import { Notification } from '@/lib/types';
import sql from '@/lib/db';

async function getNavData(userId: string) {
  const [notifRows, userRow] = await Promise.all([
    sql`
      SELECT * FROM notifications
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 30
    `,
    sql`SELECT role FROM users WHERE id = ${userId}`,
  ]);
  return {
    notifications: notifRows as Notification[],
    isAdmin: (userRow[0] as { role: string } | undefined)?.role === 'admin',
  };
}

export async function Navbar() {
  const { userId } = await auth();
  const { notifications, isAdmin } = userId
    ? await getNavData(userId)
    : { notifications: [], isAdmin: false };

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

        {/* Desktop nav links */}
        <NavLinks />

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-2">
            <ThemeToggle />
            {isAdmin && (
              <Link href="/admin">
                <Button size="sm" variant="outline" className="rounded-xl h-8 px-3 text-[12px] font-semibold">
                  Admin
                </Button>
              </Link>
            )}
          </div>
          <NotificationBell initial={notifications} />
          <div className="hidden sm:block">
            <UserButton />
          </div>
          <MobileMenu isAdmin={isAdmin} />
        </div>
      </div>
    </header>
  );
}
