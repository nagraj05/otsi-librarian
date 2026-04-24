'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { BookOpen, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { deletePersonalBook } from '@/app/actions';
import { HalfStarRating } from '@/components/half-star-rating';
import { UpdatePersonalBookDialog } from '@/components/update-personal-book-dialog';
import type { PersonalBook } from '@/lib/types';

const STATUS_STYLE: Record<string, { label: string; className: string }> = {
  want_to_read: { label: 'Want to Read', className: 'bg-muted text-muted-foreground' },
  reading:      { label: 'Reading',      className: 'bg-brand-muted text-brand'       },
  finished:     { label: 'Finished',     className: 'bg-success-muted text-success-muted-fg' },
};

function fmtDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

export function PersonalBookCard({ book }: { book: PersonalBook }) {
  const [editOpen,       setEditOpen]       = useState(false);
  const [confirmDelete,  setConfirmDelete]  = useState(false);
  const [isPending,      startTransition]   = useTransition();

  const s   = STATUS_STYLE[book.status] ?? STATUS_STYLE.want_to_read;
  const pct = book.page_count && book.current_page
    ? Math.min(100, Math.round((book.current_page / book.page_count) * 100))
    : null;

  function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    startTransition(async () => {
      try {
        await deletePersonalBook(book.id);
        toast.success(`"${book.title}" removed from shelf`);
      } catch {
        toast.error('Failed to remove book');
        setConfirmDelete(false);
      }
    });
  }

  return (
    <>
      <div
        className="bg-card rounded-2xl ring-1 ring-foreground/5 shadow-sm hover:shadow-md transition-all duration-200 p-3.5 flex flex-col gap-2.5"
        onMouseLeave={() => setConfirmDelete(false)}
      >
        {/* Cover + meta + action buttons */}
        <div className="flex gap-3 items-start">
          {book.thumbnail ? (
            <Image
              src={book.thumbnail} alt={book.title}
              width={48} height={68}
              className="rounded-xl object-cover shadow-sm shrink-0"
              style={{ width: 48, height: 68, objectFit: 'cover' }}
            />
          ) : (
            <div className="w-12 h-[68px] rounded-xl bg-muted flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-muted-foreground/40" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground leading-snug line-clamp-2">
              {book.title}
            </p>
            {book.authors?.length > 0 && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {book.authors.join(', ')}
              </p>
            )}
            <span className={`inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${s.className}`}>
              {s.label}
            </span>
          </div>

          {/* Edit + Delete */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <button
              onClick={() => setEditOpen(true)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Edit"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDelete}
              disabled={isPending}
              title={confirmDelete ? 'Click again to confirm' : 'Remove from shelf'}
              className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                confirmDelete
                  ? 'text-destructive bg-destructive/10 hover:bg-destructive/20'
                  : 'text-muted-foreground hover:text-destructive hover:bg-muted'
              }`}
            >
              {isPending
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Reading progress */}
        {book.status === 'reading' && book.page_count && (
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>p. {book.current_page ?? 0} of {book.page_count}</span>
              {pct !== null && (
                <span className="font-semibold text-brand">{pct}%</span>
              )}
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-brand transition-all duration-500"
                style={{ width: `${pct ?? 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Start date for Reading */}
        {book.status === 'reading' && book.start_date && (
          <p className="text-[11px] text-muted-foreground">
            Started {fmtDate(book.start_date)}
          </p>
        )}

        {/* Rating + dates for Finished */}
        {book.status === 'finished' && (
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {book.rating !== null
              ? <HalfStarRating value={Number(book.rating)} size="sm" showValue />
              : <span className="text-[11px] text-muted-foreground">No rating</span>}
            {(book.start_date || book.end_date) && (
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {fmtDate(book.start_date)}
                {book.end_date && ` → ${fmtDate(book.end_date)}`}
              </span>
            )}
          </div>
        )}
      </div>

      <UpdatePersonalBookDialog
        book={book}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />
    </>
  );
}
