'use client';

import { useState, useTransition } from 'react';
import { Plus, Library } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { BookSearch } from './book-search';
import { addBook } from '@/app/actions';
import { GoogleBook } from '@/lib/types';

export function AddToLibraryDialog() {
  const [open, setOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<GoogleBook | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setSelectedBook(null);
  }

  function handleSubmit() {
    if (!selectedBook) return;
    startTransition(async () => {
      try {
        await addBook(selectedBook);
        toast.success(`"${selectedBook.title}" added to library`);
        setOpen(false);
        reset();
      } catch {
        toast.error('Failed to add book. Please try again.');
      }
    });
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        className="gap-2 rounded-xl border-brand-muted/60 text-brand hover:bg-brand-muted"
      >
        <Plus className="w-4 h-4" />
        Add Book
      </Button>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className="p-1.5 bg-brand-muted rounded-lg">
                <Library className="w-4 h-4 text-brand" />
              </div>
              Add Book to Library
            </DialogTitle>
          </DialogHeader>

          <div className="py-2">
            <BookSearch onSelect={(b) => setSelectedBook(b ?? null)} selected={selectedBook} />
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => { setOpen(false); reset(); }}
              disabled={isPending}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending || !selectedBook}
              className="bg-brand hover:bg-brand/90 text-white rounded-xl gap-2"
            >
              {isPending ? 'Adding...' : 'Add to Library'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
