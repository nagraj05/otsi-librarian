'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { approveRequest } from '@/app/actions';
import { toast } from 'sonner';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface Props {
  borrowId: number;
  bookTitle: string;
  requesterName: string;
  open: boolean;
  onClose: () => void;
}

function toDateInputValue(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function ApproveRequestDialog({ borrowId, bookTitle, requesterName, open, onClose }: Props) {
  const today = new Date();
  const twoWeeks = new Date(today);
  twoWeeks.setDate(twoWeeks.getDate() + 14);

  const [takenDate, setTakenDate] = useState(toDateInputValue(today));
  const [dueDate, setDueDate]   = useState(toDateInputValue(twoWeeks));
  const [loading, setLoading]   = useState(false);

  async function handleApprove() {
    setLoading(true);
    try {
      await approveRequest(borrowId, takenDate, dueDate);
      toast.success(`Approved — "${bookTitle}" given to ${requesterName}`);
      onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Approve Request</DialogTitle>
        </DialogHeader>

        <div className="space-y-1 py-1">
          <p className="text-sm text-muted-foreground">
            Approving <span className="font-semibold text-foreground">"{bookTitle}"</span> for{' '}
            <span className="font-semibold text-foreground">{requesterName}</span>.
          </p>
          <p className="text-xs text-muted-foreground">Hand the book over physically, then confirm dates below.</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="taken">Taken date</Label>
            <Input
              id="taken"
              type="date"
              value={takenDate}
              onChange={e => setTakenDate(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="due">Due date</Label>
            <Input
              id="due"
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="rounded-xl"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl" disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleApprove}
            disabled={loading || !takenDate || !dueDate}
            className="bg-brand hover:bg-brand/90 text-white rounded-xl gap-1.5"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
