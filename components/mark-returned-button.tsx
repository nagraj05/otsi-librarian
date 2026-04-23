'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { markReturned } from '@/app/actions';
import { toast } from 'sonner';
import { Loader2, RotateCcw } from 'lucide-react';

export function MarkReturnedButton({ borrowId, bookTitle }: { borrowId: number; bookTitle: string }) {
  const [loading, setLoading] = useState(false);

  async function handle() {
    if (!confirm(`Mark "${bookTitle}" as returned?`)) return;
    setLoading(true);
    try {
      await markReturned(borrowId);
      toast.success('Marked as returned');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handle}
      disabled={loading}
      className="h-7 px-3 text-[12px] font-semibold rounded-lg gap-1"
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
      Returned
    </Button>
  );
}
