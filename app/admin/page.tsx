import { BookOpen, BookPlus, Clock, BookMarked, RotateCcw } from 'lucide-react';
import Image from 'next/image';
import { AddToLibraryDialog } from '@/components/add-to-library-dialog';
import { RemoveBookButton } from '@/components/remove-book-button';
import { RequestRowActions } from '@/components/request-row-actions';
import { MarkReturnedButton } from '@/components/mark-returned-button';
import sql from '@/lib/db';
import { Book, Borrow } from '@/lib/types';

async function getData() {
  const [pendingRows, activeRows, catalogRows] = await Promise.all([
    sql`
      SELECT b.*, u.name AS user_name
      FROM borrows b
      LEFT JOIN users u ON u.id = b.user_id
      WHERE b.status = 'pending'
      ORDER BY b.borrowed_at ASC
    `,
    sql`
      SELECT b.*, u.name AS user_name
      FROM borrows b
      LEFT JOIN users u ON u.id = b.user_id
      WHERE b.status = 'active'
      ORDER BY b.due_date ASC NULLS LAST
    `,
    sql`
      SELECT bk.*, ab.borrower_name AS borrowed_by
      FROM books bk
      LEFT JOIN borrows ab ON ab.book_id = bk.book_id AND ab.status = 'active'
      ORDER BY bk.title ASC
    `,
  ]);
  return {
    pending: pendingRows as (Borrow & { user_name: string })[],
    active:  activeRows  as (Borrow & { user_name: string })[],
    catalog: catalogRows as (Book & { borrowed_by: string | null })[],
  };
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isOverdue(dueDate: string | null) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

function Thumbnail({ src, alt }: { src: string | null; alt: string }) {
  if (src) {
    return (
      <Image src={src} alt={alt} width={36} height={50}
        className="rounded-lg object-cover shadow-sm shrink-0"
        style={{ width: 36, height: 50, objectFit: 'cover' }} />
    );
  }
  return (
    <div className="w-9 h-[50px] rounded-lg bg-muted flex items-center justify-center shrink-0">
      <BookOpen className="w-4 h-4 text-muted-foreground/50" />
    </div>
  );
}

export default async function AdminPage() {
  const { pending, active, catalog } = await getData();

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-12">

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-brand-muted rounded-2xl p-3 sm:p-4 ring-1 ring-brand-muted/60 shadow-sm">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
            <Clock className="w-3.5 h-3.5 text-brand shrink-0" />
            <span className="text-[10px] sm:text-[11px] font-semibold text-brand uppercase tracking-wider">Pending</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-brand-muted-fg leading-none">{pending.length}</p>
        </div>
        <div className="bg-warn-muted rounded-2xl p-3 sm:p-4 ring-1 ring-warn-muted/60 shadow-sm">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
            <BookMarked className="w-3.5 h-3.5 text-warn shrink-0" />
            <span className="text-[10px] sm:text-[11px] font-semibold text-warn uppercase tracking-wider">Active</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-warn-muted-fg leading-none">{active.length}</p>
        </div>
        <div className="bg-card rounded-2xl p-3 sm:p-4 ring-1 ring-foreground/5 shadow-sm">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
            <BookPlus className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Books</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-foreground leading-none">{catalog.length}</p>
        </div>
      </div>

      {/* Pending Requests */}
      <section>
        <div className="flex items-center gap-2.5 mb-5">
          <Clock className="w-4 h-4 text-brand" />
          <h2 className="font-bold text-foreground text-[17px]">Pending Requests</h2>
          {pending.length > 0 && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-brand text-white">{pending.length}</span>
          )}
        </div>

        {pending.length === 0 ? (
          <div className="bg-card rounded-2xl ring-1 ring-foreground/5 shadow-sm p-8 text-center text-muted-foreground text-sm">
            No pending requests
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map(b => (
              <div key={b.id} className="bg-card rounded-2xl ring-1 ring-foreground/5 shadow-sm p-4">
                <div className="flex gap-3.5 items-center">
                  <Thumbnail src={b.book_thumbnail} alt={b.book_title} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground line-clamp-1">{b.book_title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {b.user_name} · Requested {formatDate(b.borrowed_at)}
                    </p>
                  </div>
                  <div className="hidden sm:flex shrink-0">
                    <RequestRowActions borrowId={b.id} bookTitle={b.book_title} requesterName={b.user_name} />
                  </div>
                </div>
                <div className="mt-3 flex justify-end sm:hidden">
                  <RequestRowActions borrowId={b.id} bookTitle={b.book_title} requesterName={b.user_name} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Active Borrows */}
      <section>
        <div className="flex items-center gap-2.5 mb-5">
          <BookMarked className="w-4 h-4 text-warn" />
          <h2 className="font-bold text-foreground text-[17px]">Active Borrows</h2>
          <span className="text-xs text-muted-foreground font-medium">{active.length} out</span>
        </div>

        {active.length === 0 ? (
          <div className="bg-card rounded-2xl ring-1 ring-foreground/5 shadow-sm p-8 text-center text-muted-foreground text-sm">
            No active borrows
          </div>
        ) : (
          <div className="space-y-3">
            {active.map(b => {
              const overdue = isOverdue(b.due_date);
              return (
                <div key={b.id} className="bg-card rounded-2xl ring-1 ring-foreground/5 shadow-sm p-4">
                  <div className="flex gap-3.5 items-center">
                    <Thumbnail src={b.book_thumbnail} alt={b.book_title} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground line-clamp-1">{b.book_title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{b.user_name}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[11px] text-muted-foreground">
                          Taken {formatDate(b.taken_date)}
                        </span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          overdue
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-warn-muted text-warn-muted-fg'
                        }`}>
                          {overdue ? 'Overdue' : 'Due'} {formatDate(b.due_date)}
                        </span>
                      </div>
                    </div>
                    <div className="hidden sm:block shrink-0">
                      <MarkReturnedButton borrowId={b.id} bookTitle={b.book_title} />
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end sm:hidden">
                    <MarkReturnedButton borrowId={b.id} bookTitle={b.book_title} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Library Catalog */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <BookPlus className="w-4 h-4 text-brand" />
            <h2 className="font-bold text-foreground text-[17px]">Library Catalog</h2>
            <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
              {catalog.length} book{catalog.length !== 1 ? 's' : ''} · {catalog.filter(b => !b.borrowed_by).length} available
            </span>
          </div>
          <AddToLibraryDialog />
        </div>

        {catalog.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-3xl ring-1 ring-foreground/5 shadow-sm">
            <div className="w-14 h-14 bg-muted/50 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <BookPlus className="w-6 h-6 text-muted-foreground/50" />
            </div>
            <p className="font-semibold text-foreground/70">No books yet</p>
            <p className="text-sm text-muted-foreground mt-1">Click &ldquo;Add Book&rdquo; to build your library.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {catalog.map(b => (
              <div key={b.id} className="bg-card rounded-2xl ring-1 ring-foreground/5 shadow-sm p-3.5 flex gap-3 items-start">
                {b.thumbnail ? (
                  <Image src={b.thumbnail} alt={b.title} width={36} height={50}
                    className="rounded-lg object-cover shadow-sm shrink-0"
                    style={{ width: 36, height: 50, objectFit: 'cover' }} />
                ) : (
                  <div className="w-9 h-[50px] rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4 text-muted-foreground/50" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <p className="font-semibold text-sm text-foreground line-clamp-2 leading-snug">{b.title}</p>
                    <RemoveBookButton bookId={b.book_id} title={b.title} />
                  </div>
                  {b.authors?.length > 0 && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{b.authors.join(', ')}</p>
                  )}
                  <span className={`inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    b.borrowed_by ? 'bg-warn-muted text-warn-muted-fg' : 'bg-success-muted text-success-muted-fg'
                  }`}>
                    {b.borrowed_by ? `Out · ${b.borrowed_by}` : 'Available'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Return History note */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground pb-4">
        <RotateCcw className="w-3.5 h-3.5" />
        <span>Returned books are removed from active view. Full history coming soon.</span>
      </div>

    </main>
  );
}
