import Image from 'next/image';
import { Book, Borrow } from '@/lib/types';
import sql from '@/lib/db';
import { BookOpen, BookPlus, Library, BookMarked, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { SignInButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Terminal } from '@/components/terminal';

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

async function getBorrows(): Promise<Borrow[]> {
  try {
    const rows = await sql`SELECT * FROM borrows ORDER BY borrowed_at DESC`;
    return rows as Borrow[];
  } catch {
    return [];
  }
}

function CatalogCard({
  book,
  hasBorrowHistory,
}: {
  book: Book & { borrowed_by: string | null };
  hasBorrowHistory: boolean;
}) {
  const isOut = !!book.borrowed_by;
  const content = (
    <div className="bg-card rounded-2xl ring-1 ring-foreground/5 shadow-sm p-3.5 flex gap-3 items-start hover:shadow-md transition-all duration-200">
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
        <p className={`font-semibold text-sm leading-snug line-clamp-2 ${hasBorrowHistory ? 'text-foreground hover:text-brand transition-colors' : 'text-foreground'}`}>
          {book.title}
        </p>
        {book.authors && book.authors.length > 0 && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{book.authors.join(', ')}</p>
        )}
        <span className={`inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
          isOut ? 'bg-warn-muted text-warn-muted-fg' : 'bg-success-muted text-success-muted-fg'
        }`}>
          {isOut ? `Out · ${book.borrowed_by}` : 'Available'}
        </span>
      </div>
    </div>
  );

  if (hasBorrowHistory) {
    return <Link href={`/books/${book.book_id}`}>{content}</Link>;
  }
  return content;
}

export default async function BooksCatalogPage() {
  const { userId } = await auth();
  const [borrows, catalog] = await Promise.all([getBorrows(), getCatalogBooks()]);

  const borrowedBookIds = new Set(borrows.map((b) => b.book_id));
  const availableCount = catalog.filter((b) => !b.borrowed_by).length;
  const outCount = catalog.filter((b) => b.borrowed_by).length;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center shadow-md shadow-brand/20">
              <Library className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <span className="font-bold text-foreground text-[15px] tracking-tight">OTSI LIBRARY</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Terminal />
            {userId ? (
              <Link href="/admin">
                <Button size="sm" className="bg-brand hover:bg-brand/90 text-white rounded-xl gap-1.5 h-8 px-4 text-[13px] font-semibold shadow-sm shadow-brand/20">
                  <BookMarked style={{ width: 13, height: 13 }} />
                  Dashboard
                </Button>
              </Link>
            ) : (
              <SignInButton mode="modal">
                <Button size="sm" variant="outline" className="rounded-xl gap-1.5 h-8 px-4 text-[13px] font-semibold text-muted-foreground hover:bg-muted/50">
                  Admin
                </Button>
              </SignInButton>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-2">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 mt-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </Link>

        {/* Heading */}
        <div className="mb-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Library Catalog</h2>
          <p className="text-muted-foreground mt-1 text-sm">All books in Nagraj&apos;s library.</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-card rounded-2xl p-4 ring-1 ring-foreground/5 shadow-sm">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total</p>
            <p className="text-3xl font-bold text-foreground leading-none">{catalog.length}</p>
          </div>
          <div className="bg-success-muted rounded-2xl p-4 ring-1 ring-success-muted/60 shadow-sm">
            <p className="text-[11px] font-semibold text-success uppercase tracking-wider mb-1">Available</p>
            <p className="text-3xl font-bold text-success-muted-fg leading-none">{availableCount}</p>
          </div>
          <div className="bg-warn-muted rounded-2xl p-4 ring-1 ring-warn-muted/60 shadow-sm">
            <p className="text-[11px] font-semibold text-warn uppercase tracking-wider mb-1">Out Now</p>
            <p className="text-3xl font-bold text-warn-muted-fg leading-none">{outCount}</p>
          </div>
        </div>

        {/* Catalog grid */}
        {catalog.length > 0 ? (
          <section className="mb-10">
            <div className="flex items-center gap-2.5 mb-5">
              <BookPlus className="w-4 h-4 text-brand" />
              <h3 className="font-bold text-foreground text-[15px]">All Books</h3>
              <span className="text-xs text-muted-foreground font-medium">
                {catalog.length} book{catalog.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {catalog.map((book) => (
                <CatalogCard
                  key={book.id}
                  book={book}
                  hasBorrowHistory={borrowedBookIds.has(book.book_id)}
                />
              ))}
            </div>
          </section>
        ) : (
          <div className="text-center py-28">
            <div className="w-16 h-16 bg-card rounded-3xl shadow-sm ring-1 ring-foreground/5 flex items-center justify-center mx-auto mb-5">
              <BookOpen className="w-7 h-7 text-muted-foreground/50" />
            </div>
            <p className="font-semibold text-foreground/70">No books yet</p>
            <p className="text-sm text-muted-foreground mt-1">Books added to the library will appear here.</p>
          </div>
        )}
      </main>
    </div>
  );
}
