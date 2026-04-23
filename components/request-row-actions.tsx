'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle } from 'lucide-react';
import { ApproveRequestDialog } from './approve-request-dialog';
import { RejectRequestDialog } from './reject-request-dialog';

interface Props {
  borrowId: number;
  bookTitle: string;
  requesterName: string;
}

export function RequestRowActions({ borrowId, bookTitle, requesterName }: Props) {
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen,  setRejectOpen]  = useState(false);

  return (
    <>
      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          onClick={() => setApproveOpen(true)}
          className="h-7 px-3 text-[12px] font-semibold rounded-lg bg-brand hover:bg-brand/90 text-white gap-1"
        >
          <CheckCircle2 className="w-3 h-3" /> Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setRejectOpen(true)}
          className="h-7 px-3 text-[12px] font-semibold rounded-lg border-destructive/40 text-destructive hover:bg-destructive/10 gap-1"
        >
          <XCircle className="w-3 h-3" /> Reject
        </Button>
      </div>

      <ApproveRequestDialog
        borrowId={borrowId}
        bookTitle={bookTitle}
        requesterName={requesterName}
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
      />
      <RejectRequestDialog
        borrowId={borrowId}
        bookTitle={bookTitle}
        requesterName={requesterName}
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
      />
    </>
  );
}
