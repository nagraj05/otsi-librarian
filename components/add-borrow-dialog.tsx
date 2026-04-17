'use client';

import { useState, useTransition } from 'react';
import { Plus, BookOpen, User, CalendarDays, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookSearch } from './book-search';
import { addBorrow } from '@/app/actions';
import { GoogleBook } from '@/lib/types';

export function AddBorrowDialog() {
  const [open, setOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<GoogleBook | null>(null);
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowedAt, setBorrowedAt] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isPending, startTransition] = useTransition();

  function resetForm() {
    setSelectedBook(null);
    setBorrowerName('');
    setBorrowedAt(new Date().toISOString().split('T')[0]);
    setNotes('');
  }

  function handleSubmit() {
    if (!borrowerName.trim()) {
      toast.error('Please enter the borrower\'s name');
      return;
    }
    if (!selectedBook) {
      toast.error('Please select a book');
      return;
    }

    startTransition(async () => {
      try {
        await addBorrow({
          borrower_name: borrowerName.trim(),
          book: selectedBook,
          borrowed_at: new Date(borrowedAt).toISOString(),
          notes: notes.trim() || undefined,
        });
        toast.success(`"${selectedBook.title}" recorded for ${borrowerName}`);
        setOpen(false);
        resetForm();
      } catch {
        toast.error('Failed to add record. Please try again.');
      }
    });
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 rounded-xl px-5 shadow-md shadow-indigo-200"
      >
        <Plus className="w-4 h-4" />
        Add Borrow
      </Button>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className="p-1.5 bg-indigo-100 rounded-lg">
                <BookOpen className="w-4 h-4 text-indigo-600" />
              </div>
              Add Borrow Record
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-sm font-medium">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                Borrower Name
              </Label>
              <Input
                placeholder="e.g. Ravi Kumar"
                value={borrowerName}
                onChange={(e) => setBorrowerName(e.target.value)}
                className="rounded-lg"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-sm font-medium">
                <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                Book
              </Label>
              <BookSearch
                onSelect={(book) => setSelectedBook(book ?? null)}
                selected={selectedBook}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-sm font-medium">
                <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                Borrowed On
              </Label>
              <Input
                type="date"
                value={borrowedAt}
                onChange={(e) => setBorrowedAt(e.target.value)}
                className="rounded-lg"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-sm font-medium">
                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                Notes
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                placeholder="Any notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="rounded-lg"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => { setOpen(false); resetForm(); }}
              disabled={isPending}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending || !borrowerName.trim() || !selectedBook}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl gap-2"
            >
              {isPending ? 'Saving...' : 'Save Record'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
