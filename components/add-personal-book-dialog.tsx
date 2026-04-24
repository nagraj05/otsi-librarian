'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Plus, BookOpen, Search, Pencil, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookSearch } from '@/components/book-search';
import { HalfStarRating } from '@/components/half-star-rating';
import { addPersonalBook } from '@/app/actions';
import type { GoogleBook, PersonalBookStatus } from '@/lib/types';

const STATUS_OPTIONS: { value: PersonalBookStatus; label: string }[] = [
  { value: 'want_to_read', label: 'Want to Read' },
  { value: 'reading',      label: 'Reading'      },
  { value: 'finished',     label: 'Finished'     },
];

interface BookMeta {
  title: string;
  authors: string[];
  thumbnail: string | null;
  publisher: string | null;
  published_date: string | null;
  page_count: number | null;
  isbn: string | null;
  google_book_id: string | null;
}

export function AddPersonalBookDialog() {
  const router = useRouter();
  const [open, setOpen]       = useState(false);
  const [step, setStep]       = useState<1 | 2>(1);
  const [tab, setTab]         = useState<'search' | 'manual'>('search');
  const [isPending, startTransition] = useTransition();

  // Step 1 — search
  const [selectedBook, setSelectedBook] = useState<GoogleBook | null>(null);

  // Step 1 — manual
  const [manualTitle,     setManualTitle]     = useState('');
  const [manualAuthors,   setManualAuthors]   = useState('');
  const [manualPages,     setManualPages]     = useState('');
  const [manualPublisher, setManualPublisher] = useState('');
  const [manualDate,      setManualDate]      = useState('');

  // Step 2 — reading state
  const [status,      setStatus]      = useState<PersonalBookStatus>('want_to_read');
  const [currentPage, setCurrentPage] = useState('');
  const [startDate,   setStartDate]   = useState('');
  const [endDate,     setEndDate]     = useState('');
  const [rating,      setRating]      = useState<number | null>(null);
  const [notes,       setNotes]       = useState('');

  function reset() {
    setStep(1); setTab('search');
    setSelectedBook(null);
    setManualTitle(''); setManualAuthors(''); setManualPages('');
    setManualPublisher(''); setManualDate('');
    setStatus('want_to_read'); setCurrentPage('');
    setStartDate(''); setEndDate(''); setRating(null); setNotes('');
  }

  function buildMeta(): BookMeta | null {
    if (tab === 'search') {
      if (!selectedBook) return null;
      return {
        title:          selectedBook.title,
        authors:        selectedBook.authors,
        thumbnail:      selectedBook.thumbnail,
        publisher:      selectedBook.publisher,
        published_date: selectedBook.publishedDate,
        page_count:     selectedBook.pageCount,
        isbn:           selectedBook.isbn,
        google_book_id: selectedBook.id,
      };
    }
    if (!manualTitle.trim()) return null;
    return {
      title:          manualTitle.trim(),
      authors:        manualAuthors
        ? manualAuthors.split(',').map(a => a.trim()).filter(Boolean)
        : [],
      thumbnail:      null,
      publisher:      manualPublisher.trim() || null,
      published_date: manualDate || null,
      page_count:     manualPages ? parseInt(manualPages) || null : null,
      isbn:           null,
      google_book_id: null,
    };
  }

  function handleNext() {
    if (!buildMeta()) {
      toast.error(tab === 'search' ? 'Select a book first' : 'Title is required');
      return;
    }
    setStep(2);
  }

  function handleSubmit() {
    const meta = buildMeta();
    if (!meta) return;

    startTransition(async () => {
      try {
        await addPersonalBook({
          ...meta,
          status,
          current_page: status === 'reading' && currentPage ? parseInt(currentPage) || null : null,
          start_date:   (status === 'reading' || status === 'finished') ? startDate || null : null,
          end_date:     status === 'finished' ? endDate || null : null,
          rating:       status === 'finished' ? rating : null,
          notes:        notes.trim() || null,
        });
        toast.success(`"${meta.title}" added to your shelf!`);
        setOpen(false);
        reset();
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Something went wrong');
      }
    });
  }

  const meta      = step === 2 ? buildMeta() : null;
  const pageCount = meta?.page_count ?? null;

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-brand hover:bg-brand/90 text-white rounded-xl gap-2"
      >
        <Plus className="w-4 h-4" /> Add Book
      </Button>

      <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) reset(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-brand" />
              Add to My Shelf
              <span className="ml-auto text-xs font-normal text-muted-foreground">Step {step} of 2</span>
            </DialogTitle>
          </DialogHeader>

          {step === 1 ? (
            <div className="space-y-4">
              {/* Tabs */}
              <div className="flex rounded-xl overflow-hidden border border-border">
                {(['search', 'manual'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium transition-colors ${
                      tab === t
                        ? 'bg-brand text-white'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {t === 'search'
                      ? <><Search className="w-3.5 h-3.5" /> Search</>
                      : <><Pencil className="w-3.5 h-3.5" /> Manual</>}
                  </button>
                ))}
              </div>

              {tab === 'search' ? (
                <BookSearch
                  onSelect={b => setSelectedBook(b ?? null)}
                  selected={selectedBook}
                />
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">
                      Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      placeholder="Book title"
                      value={manualTitle}
                      onChange={e => setManualTitle(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">
                      Authors{' '}
                      <span className="text-muted-foreground font-normal">(comma separated)</span>
                    </Label>
                    <Input
                      placeholder="e.g. Jane Austen, Someone Else"
                      value={manualAuthors}
                      onChange={e => setManualAuthors(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Total pages</Label>
                      <Input
                        type="number" min={1} placeholder="e.g. 320"
                        value={manualPages}
                        onChange={e => setManualPages(e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Published</Label>
                      <Input
                        placeholder="e.g. 2023"
                        value={manualDate}
                        onChange={e => setManualDate(e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Book mini-preview */}
              {meta && (
                <div className="flex gap-3 items-center p-3 rounded-xl bg-muted/50">
                  {meta.thumbnail ? (
                    <Image
                      src={meta.thumbnail} alt={meta.title}
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
                    <p className="font-semibold text-sm text-foreground line-clamp-1">{meta.title}</p>
                    {meta.authors.length > 0 && (
                      <p className="text-xs text-muted-foreground truncate">{meta.authors.join(', ')}</p>
                    )}
                  </div>
                </div>
              )}

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

              {/* Conditional fields */}
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
                  <Label className="text-xs">
                    Current page {pageCount ? `(of ${pageCount})` : ''}
                  </Label>
                  <Input
                    type="number" min={1} max={pageCount ?? undefined}
                    placeholder={pageCount ? `1 – ${pageCount}` : 'Page number'}
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
          )}

          <DialogFooter>
            {step === 1 ? (
              <>
                <Button
                  variant="outline" className="rounded-xl"
                  onClick={() => { setOpen(false); reset(); }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleNext}
                  className="bg-brand hover:bg-brand/90 text-white rounded-xl gap-1.5"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline" className="rounded-xl gap-1.5"
                  onClick={() => setStep(1)}
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isPending}
                  className="bg-brand hover:bg-brand/90 text-white rounded-xl gap-1.5"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Add to Shelf
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
