'use client';

import { useState, useTransition, useEffect } from 'react';
import Image from 'next/image';
import { Loader2, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HalfStarRating } from '@/components/half-star-rating';
import { updatePersonalBook } from '@/app/actions';
import type { PersonalBook, PersonalBookStatus } from '@/lib/types';

const STATUS_OPTIONS: { value: PersonalBookStatus; label: string }[] = [
  { value: 'want_to_read', label: 'Want to Read' },
  { value: 'reading',      label: 'Reading'      },
  { value: 'finished',     label: 'Finished'     },
];

interface Props {
  book: PersonalBook;
  open: boolean;
  onClose: () => void;
}

export function UpdatePersonalBookDialog({ book, open, onClose }: Props) {
  const [isPending, startTransition] = useTransition();

  const [status,      setStatus]      = useState<PersonalBookStatus>(book.status);
  const [currentPage, setCurrentPage] = useState(book.current_page ? String(book.current_page) : '');
  const [startDate,   setStartDate]   = useState(book.start_date ?? '');
  const [endDate,     setEndDate]     = useState(book.end_date ?? '');
  const [rating,      setRating]      = useState<number | null>(book.rating !== null ? Number(book.rating) : null);
  const [notes,       setNotes]       = useState(book.notes ?? '');
  const [pageCount,   setPageCount]   = useState(book.page_count ? String(book.page_count) : '');

  // Re-sync whenever the dialog reopens for a (possibly updated) book
  useEffect(() => {
    if (!open) return;
    setStatus(book.status);
    setCurrentPage(book.current_page ? String(book.current_page) : '');
    setStartDate(book.start_date ?? '');
    setEndDate(book.end_date ?? '');
    setRating(book.rating !== null ? Number(book.rating) : null);
    setNotes(book.notes ?? '');
    setPageCount(book.page_count ? String(book.page_count) : '');
  }, [open, book]);

  const pc = pageCount ? parseInt(pageCount) || null : null;

  function handleSubmit() {
    startTransition(async () => {
      try {
        await updatePersonalBook(book.id, {
          status,
          current_page: status === 'reading' && currentPage ? parseInt(currentPage) || null : null,
          start_date:   (status === 'reading' || status === 'finished') ? startDate || null : null,
          end_date:     status === 'finished' ? endDate || null : null,
          rating:       status === 'finished' ? rating : null,
          notes:        notes.trim() || null,
          page_count:   pc,
        });
        toast.success('Updated!');
        onClose();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Something went wrong');
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-brand" />
            Edit Book
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Book mini-preview */}
          <div className="flex gap-3 items-center p-3 rounded-xl bg-muted/50">
            {book.thumbnail ? (
              <Image
                src={book.thumbnail} alt={book.title}
                width={36} height={50}
                className="rounded-lg object-cover shadow-sm shrink-0"
                style={{ width: 36, height: 50 }}
              />
            ) : (
              <div className="w-9 h-[50px] rounded-lg bg-muted flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4 text-muted-foreground/50" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground line-clamp-1">{book.title}</p>
              {book.authors?.length > 0 && (
                <p className="text-xs text-muted-foreground truncate">{book.authors.join(', ')}</p>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label className="text-xs">Reading status</Label>
            <div className="flex rounded-xl overflow-hidden border border-border">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className={`flex-1 py-2 text-xs font-medium transition-colors ${
                    status === opt.value
                      ? 'bg-brand text-white'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Total pages — always editable */}
          <div className="space-y-1.5">
            <Label className="text-xs">Total pages</Label>
            <Input
              type="number" min={1} placeholder="e.g. 320"
              value={pageCount}
              onChange={e => setPageCount(e.target.value)}
              className="rounded-xl"
            />
          </div>

          {(status === 'reading' || status === 'finished') && (
            <div className="space-y-1.5">
              <Label className="text-xs">Start date</Label>
              <Input
                type="date" value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="rounded-xl"
              />
            </div>
          )}

          {status === 'reading' && (
            <div className="space-y-1.5">
              <Label className="text-xs">Current page {pc ? `(of ${pc})` : ''}</Label>
              <Input
                type="number" min={1} max={pc ?? undefined}
                placeholder={pc ? `1 – ${pc}` : 'Page number'}
                value={currentPage}
                onChange={e => setCurrentPage(e.target.value)}
                className="rounded-xl"
              />
            </div>
          )}

          {status === 'finished' && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs">End date</Label>
                <Input
                  type="date" value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Your rating</Label>
                <HalfStarRating value={rating} onChange={setRating} size="lg" showValue />
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">
              Notes{' '}
              <span className="text-muted-foreground font-normal">(private)</span>
            </Label>
            <textarea
              placeholder="Your thoughts, quotes, takeaways…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none"
            />
          </div>
        </div>

        <DialogFooter showCloseButton>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="bg-brand hover:bg-brand/90 text-white rounded-xl gap-1.5"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
