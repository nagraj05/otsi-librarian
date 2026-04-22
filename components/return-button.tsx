'use client';

import { useTransition } from 'react';
import { CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { returnBook } from '@/app/actions';

export function ReturnButton({ id, bookTitle }: { id: number; bookTitle: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          try {
            await returnBook(id);
            toast.success(`"${bookTitle}" marked as returned`);
          } catch {
            toast.error('Failed to update. Please try again.');
          }
        })
      }
      className="rounded-lg gap-1.5 text-success border-success-muted hover:bg-success-muted hover:border-success/50"
    >
      <CheckCircle className="w-3.5 h-3.5" />
      {isPending ? 'Updating...' : 'Return'}
    </Button>
  );
}
