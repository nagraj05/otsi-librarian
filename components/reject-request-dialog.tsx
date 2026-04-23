'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { rejectRequest } from '@/app/actions';
import { toast } from 'sonner';
import { Loader2, XCircle } from 'lucide-react';

interface Props {
  borrowId: number;
  bookTitle: string;
  requesterName: string;
  open: boolean;
  onClose: () => void;
}

export function RejectRequestDialog({ borrowId, bookTitle, requesterName, open, onClose }: Props) {
  const [reason, setReason]   = useState('');
  const [loading, setLoading] = useState(false);

  async function handleReject() {
    setLoading(true);
    try {
      await rejectRequest(borrowId, reason.trim() || null);
      toast.success(`Request rejected`);
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
          <DialogTitle>Reject Request</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Rejecting <span className="font-semibold text-foreground">"{bookTitle}"</span> requested by{' '}
          <span className="font-semibold text-foreground">{requesterName}</span>.
        </p>

        <div className="space-y-1.5">
          <Label htmlFor="reason">Reason <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <textarea
            id="reason"
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g. Book is damaged, try again later…"
            rows={3}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none"
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl" disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={loading}
            className="rounded-xl gap-1.5"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            Reject
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
