'use client';

import { useState } from 'react';
import { Clock, BookMarked, BookPlus, BookOpen, RotateCcw } from 'lucide-react';
import Image from 'next/image';
import { AddToLibraryDialog } from '@/components/add-to-library-dialog';
import { RemoveBookButton } from '@/components/remove-book-button';
import { RequestRowActions } from '@/components/request-row-actions';
import { MarkReturnedButton } from '@/components/mark-returned-button';
import { EbookUpload } from '@/components/ebook-upload';
import { Book, Borrow } from '@/lib/types';

type PendingBorrow = Borrow & { user_name: string };
type ActiveBorrow  = Borrow & { user_name: string };
type CatalogBook   = Book  & { borrowed_by: string | null };

interface AdminTabsProps {
  pending: PendingBorrow[];
  active:  ActiveBorrow[];
  catalog: CatalogBook[];
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

type Tab = 'pending' | 'active' | 'catalog';

export function AdminTabs({ pending, active, catalog }: AdminTabsProps) {
  const [tab, setTab] = useState<Tab>('pending');

  const tabs: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'pending',
      label: 'Pending',
      icon: <Clock className="w-3.5 h-3.5" />,
      badge: pending.length || undefined,
    },
    {
      id: 'active',
      label: 'Active Borrows',
      icon: <BookMarked className="w-3.5 h-3.5" />,
      badge: active.length || undefined,
    },
    {
      id: 'catalog',
      label: 'Library Catalog',
      icon: <BookPlus className="w-3.5 h-3.5" />,
      badge: catalog.length || undefined,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="flex gap-1 bg-muted/60 p-1 rounded-2xl">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === t.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
            {t.badge !== undefined && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                tab === t.id
                  ? t.id === 'pending' ? 'bg-brand text-white'
                    : t.id === 'active' ? 'bg-warn text-white'
                    : 'bg-foreground/10 text-foreground'
                  : 'bg-foreground/10 text-muted-foreground'
              }`}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Pending Requests */}
      {tab === 'pending' && (
        <section className="space-y-3">
          {pending.length === 0 ? (
            <div className="bg-card rounded-2xl ring-1 ring-foreground/5 shadow-sm p-10 text-center text-muted-foreground text-sm">
              No pending requests
            </div>
          ) : (
            pending.map(b => (
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
            ))
          )}
        </section>
      )}

      {/* Active Borrows */}
      {tab === 'active' && (
        <section className="space-y-3">
          {active.length === 0 ? (
            <div className="bg-card rounded-2xl ring-1 ring-foreground/5 shadow-sm p-10 text-center text-muted-foreground text-sm">
              No active borrows
            </div>
          ) : (
            active.map(b => {
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
            })
          )}
        </section>
      )}

      {/* Library Catalog */}
      {tab === 'catalog' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">
              {catalog.length} book{catalog.length !== 1 ? 's' : ''} · {catalog.filter(b => !b.borrowed_by).length} available
            </span>
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
                    <EbookUpload bookId={b.book_id} title={b.title} hasEbook={!!b.ebook_url} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Footer note */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground pb-4">
        <RotateCcw className="w-3.5 h-3.5" />
        <span>Returned books are removed from active view. Full history coming soon.</span>
      </div>
    </div>
  );
}
