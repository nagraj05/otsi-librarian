'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, CheckCircle2, Clock, Search, X } from 'lucide-react';
import { RequestButton } from '@/components/request-button';
import { Input } from '@/components/ui/input';

export interface CatalogBook {
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

type Filter = 'all' | 'available' | 'borrowed' | 'waitlist' | 'ebooks';

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
          <p className="font-semibold text-sm text-foreground leading-snug line-clamp-2">{book.title}</p>
          {book.authors?.length > 0 && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{book.authors.join(', ')}</p>
          )}
        </div>
      </Link>

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

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all',       label: 'All'       },
  { id: 'available', label: 'Available' },
  { id: 'borrowed',  label: 'Borrowed'  },
  { id: 'waitlist',  label: 'Waitlist'  },
  { id: 'ebooks',    label: 'Ebooks'    },
];

export function CatalogClient({ books }: { books: CatalogBook[] }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let result = books;

    if (filter === 'available') result = result.filter(b => !b.active_borrower);
    else if (filter === 'borrowed')  result = result.filter(b =>  !!b.active_borrower);
    else if (filter === 'waitlist')  result = result.filter(b =>  b.waitlist_count > 0);
    else if (filter === 'ebooks')    result = result.filter(b =>  !!b.ebook_url);

    const q = search.trim().toLowerCase();
    if (q) result = result.filter(b => b.title.toLowerCase().includes(q) || b.authors.some(a => a.toLowerCase().includes(q)));

    return result;
  }, [books, filter, search]);

  return (
    <div className="space-y-4">
      {/* Search + filter row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search by title or author…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 pr-8 h-9 text-sm rounded-xl"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filter === f.id
                  ? 'bg-brand text-white shadow-sm'
                  : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl ring-1 ring-foreground/5 shadow-sm">
          <div className="w-14 h-14 bg-muted/50 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Search className="w-6 h-6 text-muted-foreground/50" />
          </div>
          <p className="font-semibold text-foreground/70">No books found</p>
          <p className="text-sm text-muted-foreground mt-1">Try a different filter or search term.</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {filtered.length} book{filtered.length !== 1 ? 's' : ''}
            {(filter !== 'all' || search) && ` · filtered from ${books.length}`}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(book => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
