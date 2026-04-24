'use client';

import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { PersonalBookCard } from '@/components/personal-book-card';
import type { PersonalBook, PersonalBookStatus } from '@/lib/types';

type Filter = 'all' | PersonalBookStatus;

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all',          label: 'All'          },
  { value: 'want_to_read', label: 'Want to Read' },
  { value: 'reading',      label: 'Reading'      },
  { value: 'finished',     label: 'Finished'     },
];

const EMPTY_MSG: Record<Filter, string> = {
  all:          'No books on your shelf yet — add one!',
  want_to_read: 'Nothing in your want-to-read list.',
  reading:      'Not tracking any books as reading.',
  finished:     'No finished books yet.',
};

export function PersonalBooksShelf({ books }: { books: PersonalBook[] }) {
  const [filter, setFilter] = useState<Filter>('all');

  const visible = filter === 'all' ? books : books.filter(b => b.status === filter);

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-[13px] font-semibold whitespace-nowrap transition-colors ${
              filter === f.value
                ? 'bg-brand text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {visible.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-14 h-14 bg-card rounded-3xl ring-1 ring-foreground/5 shadow-sm flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-6 h-6 text-muted-foreground/40" />
          </div>
          <p className="font-semibold text-foreground/60 text-sm">{EMPTY_MSG[filter]}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {visible.map(book => (
            <PersonalBookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}
