import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { BookOpen, Clock, Flame, XCircle } from 'lucide-react';
import sql from '@/lib/db';
import { Navbar } from '@/components/navbar';
import { LogReadingForm } from '@/components/log-reading-form';
import { Borrow } from '@/lib/types';
import { calcStreak } from '@/lib/streak';

interface ActiveBorrow extends Borrow {
  today_pages: number | null;
  total_pages: number;
  user_page_count: number | null;
}

async function getDashboardData(userId: string) {
  const [userRow, activeRows, pendingRows, rejectedRows, logDates] = await Promise.all([
    sql`SELECT name, role FROM users WHERE id = ${userId}`,

    sql`
      SELECT b.*,
        rl.pages_read::int          AS today_pages,
        COALESCE(SUM(all_rl.pages_read), 0)::int AS total_pages
      FROM borrows b
      LEFT JOIN reading_logs rl
        ON rl.borrow_id = b.id AND rl.user_id = ${userId} AND rl.log_date = CURRENT_DATE
      LEFT JOIN reading_logs all_rl
        ON all_rl.borrow_id = b.id AND all_rl.user_id = ${userId}
      WHERE b.user_id = ${userId} AND b.status = 'active'
      GROUP BY b.id, rl.pages_read
      ORDER BY b.due_date ASC NULLS LAST
    `,

    sql`
      SELECT * FROM borrows
      WHERE user_id = ${userId} AND status = 'pending'
      ORDER BY borrowed_at DESC
    `,

    sql`
      SELECT * FROM borrows
      WHERE user_id = ${userId} AND status = 'rejected'
      ORDER BY borrowed_at DESC
      LIMIT 5
    `,

    sql`
      SELECT DISTINCT log_date::text
      FROM reading_logs
      WHERE user_id = ${userId}
      ORDER BY log_date DESC
    `,
  ]);

  const user     = userRow[0] as { name: string; role: string } | undefined;
  const active   = activeRows  as ActiveBorrow[];
  const pending  = pendingRows as Borrow[];
  const rejected = rejectedRows as Borrow[];
  const streak   = calcStreak(logDates.map(r => (r as { log_date: string }).log_date));

  return { user, active, pending, rejected, streak };
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysUntil(d: string | null): number | null {
  if (!d) return null;
  const diff = new Date(d).setHours(0,0,0,0) - new Date().setHours(0,0,0,0);
  return Math.ceil(diff / 86400000);
}

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect('/');

  const { user, active, pending, rejected, streak } = await getDashboardData(userId);

  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const isAdmin   = user?.role === 'admin';

  return (
    <div className="min-h-screen">
      <Navbar isAdmin={isAdmin} activePath="dashboard" />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">

        {/* Greeting + streak */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Hey, {firstName} 👋</h2>
            <p className="text-muted-foreground text-sm mt-0.5">Here&apos;s your reading activity.</p>
          </div>
          <div className="flex items-center gap-2 bg-card rounded-2xl ring-1 ring-foreground/5 shadow-sm px-4 py-3 shrink-0">
            <Flame className={`w-5 h-5 ${streak > 0 ? 'text-orange-500' : 'text-muted-foreground/40'}`} />
            <div>
              <p className="text-xl font-bold text-foreground leading-none">{streak}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">day streak</p>
            </div>
          </div>
        </div>

        {/* Active borrows */}
        <section>
          <div className="flex items-center gap-2.5 mb-4">
            <BookOpen className="w-4 h-4 text-brand" />
            <h3 className="font-bold text-foreground text-[16px]">Currently Reading</h3>
            <span className="text-xs text-muted-foreground font-medium">{active.length} book{active.length !== 1 ? 's' : ''}</span>
          </div>

          {active.length === 0 ? (
            <div className="bg-card rounded-2xl ring-1 ring-foreground/5 shadow-sm p-8 text-center">
              <BookOpen className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="font-semibold text-foreground/60 text-sm">No active borrows</p>
              <p className="text-xs text-muted-foreground mt-1">
                Head to the <a href="/catalog" className="text-brand hover:underline">Catalog</a> to request a book.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {active.map(b => {
                const days    = daysUntil(b.due_date);
                const overdue = days !== null && days < 0;
                const dueSoon = days !== null && days >= 0 && days <= 3;

                return (
                  <div key={b.id} className="bg-card rounded-2xl ring-1 ring-foreground/5 shadow-sm p-4">
                    {/* Book info */}
                    <div className="flex gap-3.5">
                      {b.book_thumbnail ? (
                        <Image
                          src={b.book_thumbnail} alt={b.book_title}
                          width={52} height={72}
                          className="rounded-xl object-cover shadow-md shrink-0"
                          style={{ width: 52, height: 72, objectFit: 'cover' }}
                        />
                      ) : (
                        <div className="w-13 h-[72px] rounded-xl bg-muted flex items-center justify-center shrink-0">
                          <BookOpen className="w-5 h-5 text-muted-foreground/50" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p className="font-semibold text-sm text-foreground line-clamp-2 leading-snug">{b.book_title}</p>
                        {b.book_authors?.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{b.book_authors.join(', ')}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            overdue
                              ? 'bg-destructive/10 text-destructive'
                              : dueSoon
                              ? 'bg-warn-muted text-warn-muted-fg'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {overdue
                              ? `Overdue by ${Math.abs(days!)} day${Math.abs(days!) !== 1 ? 's' : ''}`
                              : days === 0
                              ? 'Due today'
                              : `Due ${formatDate(b.due_date)}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Reading log */}
                    <LogReadingForm
                      borrowId={b.id}
                      todayPages={b.today_pages}
                      totalPages={b.total_pages}
                      bookPageCount={b.user_page_count ?? b.book_page_count}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Pending requests */}
        {pending.length > 0 && (
          <section>
            <div className="flex items-center gap-2.5 mb-4">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-bold text-foreground text-[16px]">Pending Requests</h3>
              <span className="text-xs text-muted-foreground font-medium">{pending.length}</span>
            </div>
            <div className="space-y-2.5">
              {pending.map(b => (
                <div key={b.id} className="bg-card rounded-2xl ring-1 ring-foreground/5 shadow-sm p-3.5 flex gap-3 items-center">
                  {b.book_thumbnail ? (
                    <Image src={b.book_thumbnail} alt={b.book_title} width={36} height={50}
                      className="rounded-lg object-cover shadow-sm shrink-0"
                      style={{ width: 36, height: 50, objectFit: 'cover' }} />
                  ) : (
                    <div className="w-9 h-[50px] rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <BookOpen className="w-4 h-4 text-muted-foreground/50" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground line-clamp-1">{b.book_title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Requested {formatDate(b.borrowed_at)}</p>
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-brand-muted text-brand shrink-0">
                    Pending
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Rejected requests */}
        {rejected.length > 0 && (
          <section>
            <div className="flex items-center gap-2.5 mb-4">
              <XCircle className="w-4 h-4 text-destructive" />
              <h3 className="font-bold text-foreground text-[16px]">Rejected Requests</h3>
            </div>
            <div className="space-y-2.5">
              {rejected.map(b => (
                <div key={b.id} className="bg-card rounded-2xl ring-1 ring-foreground/5 shadow-sm p-3.5 flex gap-3 items-center">
                  {b.book_thumbnail ? (
                    <Image src={b.book_thumbnail} alt={b.book_title} width={36} height={50}
                      className="rounded-lg object-cover shadow-sm shrink-0"
                      style={{ width: 36, height: 50, objectFit: 'cover' }} />
                  ) : (
                    <div className="w-9 h-[50px] rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <BookOpen className="w-4 h-4 text-muted-foreground/50" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground line-clamp-1">{b.book_title}</p>
                    {b.rejection_reason && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {b.rejection_reason}
                      </p>
                    )}
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-destructive/10 text-destructive shrink-0">
                    Rejected
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
