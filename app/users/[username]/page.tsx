import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import Image from 'next/image';
import { Flame, BookOpen, CheckCircle2, Clock, BarChart2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import sql from '@/lib/db';
import { Navbar } from '@/components/navbar';
import { calcStreak } from '@/lib/streak';

interface ProfileUser {
  id: string;
  name: string;
  role: string;
  created_at: string;
}

interface ActiveBorrow {
  id: number;
  book_id: string;
  book_title: string;
  book_authors: string[];
  book_thumbnail: string | null;
  book_page_count: number | null;
  user_page_count: number | null;
  taken_date: string | null;
  due_date: string | null;
  total_pages: number;
}

interface FinishedBorrow {
  id: number;
  book_id: string;
  book_title: string;
  book_authors: string[];
  book_thumbnail: string | null;
  taken_date: string | null;
  returned_date: string | null;
  total_pages: number;
}

async function getProfileData(username: string) {
  const userRow = await sql`SELECT id, name, role, created_at, username FROM users WHERE username = ${username}`;
  if (!userRow[0]) return null;

  const profileId = (userRow[0] as { id: string }).id;

  const [activeRows, finishedRows, logDatesRow, statsRow] = await Promise.all([
    sql`
      SELECT
        b.id, b.book_id, b.book_title, b.book_authors, b.book_thumbnail,
        b.book_page_count, b.user_page_count, b.taken_date, b.due_date,
        COALESCE(SUM(rl.pages_read), 0)::int AS total_pages
      FROM borrows b
      LEFT JOIN reading_logs rl ON rl.borrow_id = b.id
      WHERE b.user_id = ${profileId} AND b.status = 'active'
      GROUP BY b.id
      ORDER BY b.taken_date DESC
    `,

    sql`
      SELECT
        b.id, b.book_id, b.book_title, b.book_authors, b.book_thumbnail,
        b.taken_date, b.returned_date,
        COALESCE(SUM(rl.pages_read), 0)::int AS total_pages
      FROM borrows b
      LEFT JOIN reading_logs rl ON rl.borrow_id = b.id
      WHERE b.user_id = ${profileId} AND b.status = 'returned'
      GROUP BY b.id
      ORDER BY b.returned_date DESC
    `,

    sql`
      SELECT DISTINCT log_date::text
      FROM reading_logs
      WHERE user_id = ${profileId}
      ORDER BY log_date DESC
    `,

    sql`
      SELECT
        COALESCE(SUM(rl.pages_read), 0)::int AS total_pages,
        COUNT(DISTINCT CASE WHEN b.status = 'returned' THEN b.id END)::int AS books_finished
      FROM users u
      LEFT JOIN reading_logs rl ON rl.user_id = u.id
      LEFT JOIN borrows b       ON b.user_id  = u.id
      WHERE u.id = ${profileId}
    `,
  ]);

  const logDates = logDatesRow.map(r => (r as { log_date: string }).log_date);
  const stats    = statsRow[0] as { total_pages: number; books_finished: number };

  return {
    user:     userRow[0]   as ProfileUser & { username: string },
    active:   activeRows   as ActiveBorrow[],
    finished: finishedRows as FinishedBorrow[],
    streak:   calcStreak(logDates),
    totalPages:    stats.total_pages,
    booksFinished: stats.books_finished,
    profileId,
  };
}

async function getViewerRole(userId: string) {
  const rows = await sql`SELECT role FROM users WHERE id = ${userId}`;
  return (rows[0] as { role: string } | undefined)?.role ?? 'user';
}

const AVATAR_COLORS = [
  'bg-violet-500', 'bg-amber-500', 'bg-emerald-500',
  'bg-rose-500',   'bg-sky-500',   'bg-orange-500',
];

function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysUntil(d: string | null) {
  if (!d) return null;
  return Math.ceil((new Date(d).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000);
}

export default async function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

  const { userId } = await auth();
  if (!userId) redirect('/');

  const [data, viewerRole] = await Promise.all([
    getProfileData(username),
    getViewerRole(userId),
  ]);

  if (!data) notFound();

  const { user, active, finished, streak, totalPages, booksFinished, profileId } = data;
  const isMe = userId === profileId;

  return (
    <div className="min-h-screen">
      <Navbar isAdmin={viewerRole === 'admin'} />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-8">

        {/* Back */}
        <Link href="/leaderboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Leaderboard
        </Link>
        <p className="text-xs text-muted-foreground -mt-6">/@{user.username}</p>

        {/* Profile header */}
        <div className="bg-card rounded-3xl ring-1 ring-foreground/5 shadow-sm p-6 flex items-center gap-5">
          <div className={`w-16 h-16 rounded-2xl ${avatarColor(user.name)} flex items-center justify-center text-white text-xl font-bold shadow-md shrink-0`}>
            {initials(user.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground truncate">{user.name}</h1>
              {isMe && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand text-white">you</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Member since {formatDate(user.created_at)}
            </p>
          </div>
          {/* Streak */}
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <Flame className={`w-6 h-6 ${streak > 0 ? 'text-orange-500' : 'text-muted-foreground/30'}`} />
            <span className={`text-2xl font-bold leading-none ${streak > 0 ? 'text-orange-500' : 'text-muted-foreground/30'}`}>{streak}</span>
            <span className="text-[10px] text-muted-foreground">day streak</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-2xl p-4 ring-1 ring-foreground/5 shadow-sm text-center">
            <BarChart2 className="w-4 h-4 text-brand mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground leading-none">{totalPages.toLocaleString()}</p>
            <p className="text-[11px] text-muted-foreground mt-1">pages read</p>
          </div>
          <div className="bg-card rounded-2xl p-4 ring-1 ring-foreground/5 shadow-sm text-center">
            <CheckCircle2 className="w-4 h-4 text-success mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground leading-none">{booksFinished}</p>
            <p className="text-[11px] text-muted-foreground mt-1">books finished</p>
          </div>
          <div className="bg-card rounded-2xl p-4 ring-1 ring-foreground/5 shadow-sm text-center">
            <BookOpen className="w-4 h-4 text-warn mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground leading-none">{active.length}</p>
            <p className="text-[11px] text-muted-foreground mt-1">reading now</p>
          </div>
        </div>

        {/* Currently reading */}
        {active.length > 0 && (
          <section>
            <div className="flex items-center gap-2.5 mb-4">
              <BookOpen className="w-4 h-4 text-brand" />
              <h2 className="font-bold text-foreground text-[16px]">Currently Reading</h2>
            </div>
            <div className="space-y-3">
              {active.map(b => {
                const effectiveTotal = b.user_page_count ?? b.book_page_count;
                const pct = effectiveTotal && effectiveTotal > 0
                  ? Math.min(100, Math.round((b.total_pages / effectiveTotal) * 100))
                  : null;
                const days    = daysUntil(b.due_date);
                const overdue = days !== null && days < 0;

                return (
                  <div key={b.id} className="bg-card rounded-2xl ring-1 ring-foreground/5 shadow-sm p-4 flex gap-3.5">
                    {b.book_thumbnail ? (
                      <Image src={b.book_thumbnail} alt={b.book_title} width={44} height={62}
                        className="rounded-xl object-cover shadow-sm shrink-0"
                        style={{ width: 44, height: 62, objectFit: 'cover' }} />
                    ) : (
                      <div className="w-11 h-[62px] rounded-xl bg-muted flex items-center justify-center shrink-0">
                        <BookOpen className="w-5 h-5 text-muted-foreground/50" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground line-clamp-2 leading-snug">{b.book_title}</p>
                      {b.book_authors?.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{b.book_authors.join(', ')}</p>
                      )}
                      <span className={`inline-block mt-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        overdue ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'
                      }`}>
                        {overdue ? `Overdue ${Math.abs(days!)}d` : `Due ${formatDate(b.due_date)}`}
                      </span>

                      {effectiveTotal && effectiveTotal > 0 && (
                        <div className="mt-2 space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-muted-foreground">{b.total_pages} / {effectiveTotal} pages</span>
                            <span className="font-semibold text-brand">{pct}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Reading history */}
        {finished.length > 0 && (
          <section>
            <div className="flex items-center gap-2.5 mb-4">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <h2 className="font-bold text-foreground text-[16px]">Reading History</h2>
              <span className="text-xs text-muted-foreground font-medium">{finished.length} book{finished.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="space-y-2.5">
              {finished.map(b => (
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
                    {b.book_authors?.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{b.book_authors.join(', ')}</p>
                    )}
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Returned {formatDate(b.returned_date)}
                    </p>
                  </div>
                  {b.total_pages > 0 && (
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-foreground">{b.total_pages.toLocaleString()}</p>
                      <p className="text-[11px] text-muted-foreground">pages</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {active.length === 0 && finished.length === 0 && (
          <div className="text-center py-20">
            <Clock className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-semibold text-foreground/60 text-sm">No reading activity yet</p>
          </div>
        )}

      </main>
    </div>
  );
}
