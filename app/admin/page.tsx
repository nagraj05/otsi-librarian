import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { Library, BookOpen, RotateCcw, BookMarked, TrendingUp, BookPlus } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import sql from '@/lib/db';
import { Borrow, Book } from '@/lib/types';
import { AddBorrowDialog } from '@/components/add-borrow-dialog';
import { ReturnButton } from '@/components/return-button';
import { DeleteButton } from '@/components/delete-button';
import { AddToLibraryDialog } from '@/components/add-to-library-dialog';
import { RemoveBookButton } from '@/components/remove-book-button';
import { ThemeToggle } from '@/components/theme-toggle';

async function getBorrows(): Promise<Borrow[]> {
  try {
    const rows = await sql`SELECT * FROM borrows ORDER BY borrowed_at DESC`;
    return rows as Borrow[];
  } catch {
    return [];
  }
}

async function getCatalogBooks(): Promise<(Book & { borrowed_by: string | null })[]> {
  try {
    const rows = await sql`
      SELECT b.*, br.borrower_name AS borrowed_by
      FROM books b
      LEFT JOIN borrows br ON b.book_id = br.book_id AND br.returned_at IS NULL
      ORDER BY b.title ASC
    `;
    return rows as (Book & { borrowed_by: string | null })[];
  } catch {
    return [];
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default async function AdminPage() {
  const { userId } = await auth();
  if (!userId) redirect('/');

  const [user, borrows, catalog] = await Promise.all([currentUser(), getBorrows(), getCatalogBooks()]);
  const borrowed = borrows.filter((b) => !b.returned_at);
  const returned = borrows.filter((b) => b.returned_at);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center shadow-md shadow-brand/20">
              <Library style={{ width: 18, height: 18 }} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-foreground text-[15px] tracking-tight">Otsi Library</span>
              <p className="text-[11px] text-brand hidden sm:block leading-none mt-0.5 font-semibold">Admin Dashboard</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span className="text-sm font-semibold text-foreground/80 hidden sm:block">
              {user?.firstName ?? 'Admin'}
            </span>
            <UserButton />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        {/* Page title + CTA */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Borrow Records</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage all book borrowings from Nagraj&apos;s library.</p>
          </div>
          <AddBorrowDialog />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
          <div className="bg-card rounded-2xl p-4 sm:p-5 ring-1 ring-foreground/5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total</span>
            </div>
            <p className="text-3xl font-bold text-foreground leading-none">{borrows.length}</p>
          </div>
          <div className="bg-warn-muted rounded-2xl p-4 sm:p-5 ring-1 ring-warn-muted/60 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <BookMarked className="w-3.5 h-3.5 text-warn" />
              <span className="text-[11px] font-semibold text-warn uppercase tracking-wider">Out</span>
            </div>
            <p className="text-3xl font-bold text-warn-muted-fg leading-none">{borrowed.length}</p>
          </div>
          <div className="bg-success-muted rounded-2xl p-4 sm:p-5 ring-1 ring-success-muted/60 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <RotateCcw className="w-3.5 h-3.5 text-success" />
              <span className="text-[11px] font-semibold text-success uppercase tracking-wider">Back</span>
            </div>
            <p className="text-3xl font-bold text-success-muted-fg leading-none">{returned.length}</p>
          </div>
        </div>

        {/* Records */}
        {borrows.length === 0 ? (
          <div className="text-center py-28 bg-card rounded-3xl ring-1 ring-foreground/5 shadow-sm">
            <div className="w-16 h-16 bg-muted/50 rounded-3xl flex items-center justify-center mx-auto mb-5 ring-1 ring-foreground/5">
              <BookOpen className="w-7 h-7 text-muted-foreground/50" />
            </div>
            <p className="font-semibold text-foreground/70">No records yet</p>
            <p className="text-sm text-muted-foreground mt-1">Click &ldquo;Add Borrow&rdquo; to get started.</p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="sm:hidden space-y-3">
              {borrows.map((b) => <MobileRow key={b.id} borrow={b} />)}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block bg-card rounded-3xl ring-1 ring-foreground/5 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">Book</th>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">Borrower</th>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">Borrowed</th>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">Returned</th>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">Status</th>
                    <th className="px-4 py-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {borrows.map((b) => <DesktopRow key={b.id} borrow={b} />)}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Library Catalog */}
        <div className="mt-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
                <BookPlus className="w-5 h-5 text-brand" />
                Library Catalog
              </h2>
              <p className="text-muted-foreground text-sm mt-0.5">
                Books visible in the terminal. {catalog.length} book{catalog.length !== 1 ? 's' : ''} ·{' '}
                {catalog.filter(b => !b.borrowed_by).length} available
              </p>
            </div>
            <AddToLibraryDialog />
          </div>

          {catalog.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-3xl ring-1 ring-foreground/5 shadow-sm">
              <div className="w-14 h-14 bg-muted/50 rounded-3xl flex items-center justify-center mx-auto mb-4 ring-1 ring-foreground/5">
                <BookPlus className="w-6 h-6 text-muted-foreground/50" />
              </div>
              <p className="font-semibold text-foreground/70">No books in catalog yet</p>
              <p className="text-sm text-muted-foreground mt-1">Click &ldquo;Add Book&rdquo; to build your library.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {catalog.map(b => <CatalogCard key={b.id} book={b} />)}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function DesktopRow({ borrow }: { borrow: Borrow }) {
  const isReturned = !!borrow.returned_at;
  return (
    <tr className="hover:bg-muted/30 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3.5">
          {borrow.book_thumbnail ? (
            <Image
              src={borrow.book_thumbnail}
              alt={borrow.book_title}
              width={36}
              height={50}
              className="rounded-xl object-cover shadow-sm shrink-0"
              style={{ width: 36, height: 50, objectFit: 'cover' }}
            />
          ) : (
            <div className="w-9 h-[50px] rounded-xl bg-muted flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4 text-muted-foreground/50" />
            </div>
          )}
          <div className="min-w-0">
            <Link
              href={`/books/${borrow.book_id}`}
              className="font-semibold text-sm text-foreground line-clamp-1 hover:text-brand transition-colors"
            >
              {borrow.book_title}
            </Link>
            {borrow.book_authors && borrow.book_authors.length > 0 && (
              <p className="text-xs text-muted-foreground truncate max-w-48 mt-0.5">{borrow.book_authors.join(', ')}</p>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <p className="text-sm font-semibold text-foreground/80">{borrow.borrower_name}</p>
        {borrow.notes && <p className="text-xs text-muted-foreground truncate max-w-36 mt-0.5">{borrow.notes}</p>}
      </td>
      <td className="px-4 py-4 text-sm text-muted-foreground whitespace-nowrap">{formatDate(borrow.borrowed_at)}</td>
      <td className="px-4 py-4 text-sm whitespace-nowrap">
        {borrow.returned_at
          ? <span className="text-success font-medium">{formatDate(borrow.returned_at)}</span>
          : <span className="text-muted-foreground/40">—</span>}
      </td>
      <td className="px-4 py-4">
        <Badge className={`text-[11px] rounded-full px-2.5 py-0.5 border-0 font-semibold ${
          isReturned ? 'bg-success-muted text-success-muted-fg' : 'bg-warn-muted text-warn-muted-fg'
        }`}>
          {isReturned ? 'Returned' : 'Borrowed'}
        </Badge>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-1 justify-end">
          {!isReturned && <ReturnButton id={borrow.id} bookTitle={borrow.book_title} />}
          <DeleteButton id={borrow.id} />
        </div>
      </td>
    </tr>
  );
}

function MobileRow({ borrow }: { borrow: Borrow }) {
  const isReturned = !!borrow.returned_at;
  return (
    <div className="bg-card rounded-2xl ring-1 ring-foreground/5 shadow-sm p-4">
      <div className="flex gap-3.5 items-start mb-3">
        {borrow.book_thumbnail ? (
          <Image
            src={borrow.book_thumbnail}
            alt={borrow.book_title}
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
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1 mb-0.5">
            <Link
              href={`/books/${borrow.book_id}`}
              className="font-semibold text-sm text-foreground line-clamp-2 leading-snug hover:text-brand transition-colors"
            >
              {borrow.book_title}
            </Link>
            <Badge className={`shrink-0 text-[10px] rounded-full px-2 border-0 font-semibold ${
              isReturned ? 'bg-success-muted text-success-muted-fg' : 'bg-warn-muted text-warn-muted-fg'
            }`}>
              {isReturned ? 'Returned' : 'Out'}
            </Badge>
          </div>
          {borrow.book_authors && borrow.book_authors.length > 0 && (
            <p className="text-xs text-muted-foreground truncate">{borrow.book_authors.join(', ')}</p>
          )}
          <p className="text-xs font-semibold text-foreground/70 mt-1.5">{borrow.borrower_name}</p>
        </div>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-border/30">
        <div className="text-xs text-muted-foreground space-y-0.5">
          <p>Borrowed: {formatDate(borrow.borrowed_at)}</p>
          {borrow.returned_at && <p className="text-success font-medium">Returned: {formatDate(borrow.returned_at)}</p>}
        </div>
        <div className="flex items-center gap-1">
          {!isReturned && <ReturnButton id={borrow.id} bookTitle={borrow.book_title} />}
          <DeleteButton id={borrow.id} />
        </div>
      </div>
    </div>
  );
}

function CatalogCard({ book }: { book: Book & { borrowed_by: string | null } }) {
  const isOut = !!book.borrowed_by;
  return (
    <div className="bg-card rounded-2xl ring-1 ring-foreground/5 shadow-sm p-3.5 flex gap-3 items-start group">
      {book.thumbnail ? (
        <Image
          src={book.thumbnail}
          alt={book.title}
          width={36}
          height={50}
          className="rounded-lg object-cover shadow-sm shrink-0"
          style={{ width: 36, height: 50, objectFit: 'cover' }}
        />
      ) : (
        <div className="w-9 h-[50px] rounded-lg bg-muted flex items-center justify-center shrink-0">
          <BookOpen className="w-4 h-4 text-muted-foreground/50" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <Link
            href={`/books/${book.book_id}`}
            className="font-semibold text-sm text-foreground line-clamp-2 leading-snug hover:text-brand transition-colors"
          >
            {book.title}
          </Link>
          <RemoveBookButton bookId={book.book_id} title={book.title} />
        </div>
        {book.authors && book.authors.length > 0 && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{book.authors.join(', ')}</p>
        )}
        <span className={`inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
          isOut ? 'bg-warn-muted text-warn-muted-fg' : 'bg-success-muted text-success-muted-fg'
        }`}>
          {isOut ? `Out · ${book.borrowed_by}` : 'Available'}
        </span>
      </div>
    </div>
  );
}
