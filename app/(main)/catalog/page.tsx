import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { BookOpen } from 'lucide-react';
import sql from '@/lib/db';
import { CatalogClient, CatalogBook } from '@/components/catalog-client';

async function getCatalog(userId: string): Promise<CatalogBook[]> {
  const rows = await sql`
    SELECT
      b.id,
      b.book_id,
      b.title,
      b.authors,
      b.thumbnail,
      b.publisher,
      b.page_count,
      b.ebook_url,
      ab.borrower_name  AS active_borrower,
      ab.due_date       AS active_due_date,
      ub.status         AS user_status,
      COALESCE(wl.cnt, 0)::int AS waitlist_count
    FROM books b
    LEFT JOIN borrows ab ON ab.book_id = b.book_id AND ab.status = 'active'
    LEFT JOIN borrows ub ON ub.book_id = b.book_id
                         AND ub.user_id = ${userId}
                         AND ub.status IN ('pending', 'active')
    LEFT JOIN (
      SELECT book_id, COUNT(*) AS cnt
      FROM borrows
      WHERE status = 'pending'
      GROUP BY book_id
    ) wl ON wl.book_id = b.book_id
    ORDER BY b.title ASC
  `;
  return rows as CatalogBook[];
}

export default async function CatalogPage() {
  const { userId } = await auth();
  if (!userId) redirect('/');

  const books = await getCatalog(userId);
  const available = books.filter(b => !b.active_borrower).length;
  const borrowed  = books.filter(b =>  b.active_borrower).length;
  const withEbook = books.filter(b =>  !!b.ebook_url).length;

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <h2 className="text-2xl font-bold text-foreground tracking-tight mb-1">Library Catalog</h2>
      <p className="text-muted-foreground text-sm mb-6">Browse books and request what you want to read.</p>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-card rounded-2xl p-3 sm:p-4 ring-1 ring-foreground/5 shadow-sm">
          <p className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total</p>
          <p className="text-2xl sm:text-3xl font-bold text-foreground leading-none">{books.length}</p>
        </div>
        <div className="bg-success-muted rounded-2xl p-3 sm:p-4 ring-1 ring-success-muted/60 shadow-sm">
          <p className="text-[10px] sm:text-[11px] font-semibold text-success uppercase tracking-wider mb-1">Available</p>
          <p className="text-2xl sm:text-3xl font-bold text-success-muted-fg leading-none">{available}</p>
        </div>
        <div className="bg-warn-muted rounded-2xl p-3 sm:p-4 ring-1 ring-warn-muted/60 shadow-sm">
          <p className="text-[10px] sm:text-[11px] font-semibold text-warn uppercase tracking-wider mb-1">Borrowed</p>
          <p className="text-2xl sm:text-3xl font-bold text-warn-muted-fg leading-none">{borrowed}</p>
        </div>
        <div className="bg-violet-500/10 rounded-2xl p-3 sm:p-4 ring-1 ring-violet-500/20 shadow-sm">
          <p className="text-[10px] sm:text-[11px] font-semibold text-violet-500 uppercase tracking-wider mb-1">Ebooks</p>
          <p className="text-2xl sm:text-3xl font-bold text-violet-600 dark:text-violet-400 leading-none">{withEbook}</p>
        </div>
      </div>

      {books.length === 0 ? (
        <div className="text-center py-28">
          <div className="w-16 h-16 bg-card rounded-3xl shadow-sm ring-1 ring-foreground/5 flex items-center justify-center mx-auto mb-5">
            <BookOpen className="w-7 h-7 text-muted-foreground/50" />
          </div>
          <p className="font-semibold text-foreground/70">No books yet</p>
          <p className="text-sm text-muted-foreground mt-1">The admin hasn&apos;t added any books yet.</p>
        </div>
      ) : (
        <CatalogClient books={books} />
      )}
    </main>
  );
}
