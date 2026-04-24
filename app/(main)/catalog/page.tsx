import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, Clock, CheckCircle2 } from 'lucide-react';
import sql from '@/lib/db';
import { RequestButton } from '@/components/request-button';

interface CatalogBook {
  id: number;
  book_id: string;
  title: string;
  authors: string[];
  thumbnail: string | null;
  publisher: string | null;
  page_count: number | null;
  ebook_url: string | null;
  active_borrower: string | null;
  active_due_date: string | null;
  user_status: 'pending' | 'active' | null;
  waitlist_count: number;
}

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

function formatDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function StatusBadge({ userActive, userPending, isActive }: { userActive: boolean; userPending: boolean; isActive: boolean }) {
  if (userActive) return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-brand-muted text-brand">
      <BookOpen className="w-3 h-3" /> Reading
    </span>
  );
  if (userPending) return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-brand-muted text-brand">
      <Clock className="w-3 h-3" />
      {isActive ? 'On waitlist' : 'Requested'}
    </span>
  );
  if (!isActive) return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-success-muted text-success-muted-fg">
      <CheckCircle2 className="w-3 h-3" /> Available
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-warn-muted text-warn-muted-fg">
      <BookOpen className="w-3 h-3" /> Borrowed
    </span>
  );
}

function BookCard({ book }: { book: CatalogBook }) {
  const isActive    = !!book.active_borrower;
  const userActive  = book.user_status === 'active';
  const userPending = book.user_status === 'pending';

  return (
    <div className="bg-card rounded-2xl ring-1 ring-foreground/5 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Clickable area → book detail */}
      <Link href={`/books/${book.book_id}`} className="flex gap-3 items-start p-3.5 pb-2">
        {book.thumbnail ? (
          <Image
            src={book.thumbnail}
            alt={book.title}
            width={44}
            height={62}
            className="rounded-xl object-cover shadow-sm shrink-0"
            style={{ width: 44, height: 62, objectFit: 'cover' }}
          />
        ) : (
          <div className="w-11 h-[62px] rounded-xl bg-muted flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-muted-foreground/50" />
          </div>
        )}
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="font-semibold text-sm text-foreground leading-snug line-clamp-2 group-hover:text-brand transition-colors">{book.title}</p>
          {book.authors?.length > 0 && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{book.authors.join(', ')}</p>
          )}
        </div>
      </Link>

      {/* Actions row — outside the link */}
      <div className="px-3.5 pb-3.5 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <StatusBadge userActive={userActive} userPending={userPending} isActive={isActive} />
          {book.ebook_url && (
            <Link
              href={`/read/${book.book_id}`}
              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-500 hover:bg-violet-500/20 transition-colors"
            >
              <BookOpen className="w-3 h-3" />
              Ebook
            </Link>
          )}
        </div>
        {!userActive && !userPending && (
          <RequestButton
            bookId={book.book_id}
            bookTitle={book.title}
            mode={isActive ? 'waitlist' : 'request'}
          />
        )}
      </div>

      {isActive && book.active_due_date && (
        <p className="px-3.5 pb-3 text-[11px] text-muted-foreground -mt-1">
          Due {formatDate(book.active_due_date)}
          {book.waitlist_count > 0 && ` · ${book.waitlist_count} waiting`}
        </p>
      )}
    </div>
  );
}

export default async function CatalogPage() {
  const { userId } = await auth();
  if (!userId) redirect('/');

  const books = await getCatalog(userId);
  const available = books.filter(b => !b.active_borrower).length;
  const borrowed  = books.filter(b =>  b.active_borrower).length;

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <h2 className="text-2xl font-bold text-foreground tracking-tight mb-1">Library Catalog</h2>
      <p className="text-muted-foreground text-sm mb-6">Browse books and request what you want to read.</p>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-card rounded-2xl p-4 ring-1 ring-foreground/5 shadow-sm">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total</p>
          <p className="text-3xl font-bold text-foreground leading-none">{books.length}</p>
        </div>
        <div className="bg-success-muted rounded-2xl p-4 ring-1 ring-success-muted/60 shadow-sm">
          <p className="text-[11px] font-semibold text-success uppercase tracking-wider mb-1">Available</p>
          <p className="text-3xl font-bold text-success-muted-fg leading-none">{available}</p>
        </div>
        <div className="bg-warn-muted rounded-2xl p-4 ring-1 ring-warn-muted/60 shadow-sm">
          <p className="text-[11px] font-semibold text-warn uppercase tracking-wider mb-1">Borrowed</p>
          <p className="text-3xl font-bold text-warn-muted-fg leading-none">{borrowed}</p>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {books.map(book => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </main>
  );
}
