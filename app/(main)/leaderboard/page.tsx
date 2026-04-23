import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Flame, BookOpen, Trophy } from "lucide-react";
import Link from "next/link";
import sql from "@/lib/db";
import { calcStreak } from "@/lib/streak";

interface UserRow {
  id: string;
  name: string;
  username: string | null;
  total_pages: number;
  active_books: number;
  log_dates: string[] | null;
}

async function getLeaderboard() {
  const rows = await sql`
    SELECT
      u.id,
      u.name,
      u.username,
      COALESCE(SUM(rl.pages_read), 0)::int                                          AS total_pages,
      COUNT(DISTINCT CASE WHEN b.status = 'active' THEN b.id END)::int              AS active_books,
      ARRAY_AGG(DISTINCT rl.log_date::text)
        FILTER (WHERE rl.log_date IS NOT NULL)                                       AS log_dates
    FROM users u
    LEFT JOIN reading_logs rl ON rl.user_id = u.id
    LEFT JOIN borrows b       ON b.user_id  = u.id
    WHERE u.role = 'user'
    GROUP BY u.id, u.name
  `;
  return rows as UserRow[];
}

const MEDAL = ["🥇", "🥈", "🥉"];

const AVATAR_COLORS = [
  "bg-violet-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-rose-500",
  "bg-sky-500",
  "bg-orange-500",
];

function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default async function LeaderboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const rawUsers = await getLeaderboard();

  const users = rawUsers
    .map((u) => ({ ...u, streak: calcStreak(u.log_dates ?? []) }))
    .filter((u) => u.streak > 0 || u.total_pages > 0)
    .sort((a, b) => {
      if (b.streak !== a.streak) return b.streak - a.streak;
      return b.total_pages - a.total_pages;
    });

  const topStreak = users[0]?.streak ?? 0;

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <Trophy
            style={{ width: 18, height: 18 }}
            className="text-amber-500"
          />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">
            Leaderboard
          </h2>
          <p className="text-muted-foreground text-sm">
            Reading streaks across the team.
          </p>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground text-sm">
          No readers yet — be the first to log a reading session!
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u, i) => {
            const isMe = u.id === userId;
            const medal = MEDAL[i] ?? null;
            const isTop = u.streak > 0 && u.streak === topStreak;

            return (
              <Link
                key={u.id}
                href={u.username ? `/@${u.username}` : `/users/${u.id}`}
                className={`flex items-center gap-4 rounded-2xl ring-1 shadow-sm p-4 transition-all duration-200 hover:shadow-md ${
                  isMe
                    ? "bg-brand-muted ring-brand/20"
                    : "bg-card ring-foreground/5"
                }`}
              >
                <div className="w-7 text-center shrink-0">
                  {medal ? (
                    <span className="text-lg leading-none">{medal}</span>
                  ) : (
                    <span className="text-sm font-bold text-muted-foreground">
                      {i + 1}
                    </span>
                  )}
                </div>

                <div
                  className={`w-10 h-10 rounded-2xl ${avatarColor(u.name)} flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm`}
                >
                  {initials(u.name)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      className={`font-semibold text-sm truncate uppercase ${isMe ? "text-brand" : "text-foreground"}`}
                    >
                      {u.name}
                    </p>
                    {isMe && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand text-white shrink-0">
                        you
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {u.total_pages.toLocaleString()} pages
                    </span>
                    {u.active_books > 0 && (
                      <span className="text-[11px] text-muted-foreground">
                        {u.active_books} reading
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Flame
                    className={`w-4 h-4 ${
                      u.streak === 0
                        ? "text-muted-foreground/30"
                        : isTop
                          ? "text-orange-500"
                          : "text-orange-400"
                    }`}
                  />
                  <span
                    className={`text-lg font-bold leading-none ${
                      u.streak === 0
                        ? "text-muted-foreground/40"
                        : isTop
                          ? "text-orange-500"
                          : "text-foreground"
                    }`}
                  >
                    {u.streak}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <p className="text-center text-[11px] text-muted-foreground mt-8">
        Sorted by streak · ties broken by total pages
      </p>
    </main>
  );
}
