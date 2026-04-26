'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { markReturned } from '@/app/actions';
import { toast } from 'sonner';
import { Loader2, RotateCcw } from 'lucide-react';

export function MarkReturnedButton({ borrowId, bookTitle }: { borrowId: number; bookTitle: string }) {
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await markReturned(borrowId);
      toast.success('Marked as returned');
      setOpen(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
        className="h-7 px-3 text-[12px] font-semibold rounded-lg gap-1"
      >
        <RotateCcw className="w-3 h-3" />
        Returned
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Mark as returned?</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">&ldquo;{bookTitle}&rdquo;</span> will be
              removed from active borrows. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={loading} className="bg-brand hover:bg-brand/90 text-white">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
