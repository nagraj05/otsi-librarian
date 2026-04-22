'use client';

import { useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { removeBook } from '@/app/actions';

export function RemoveBookButton({ bookId, title }: { bookId: string; title: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      try {
        await removeBook(bookId);
        toast.success(`"${title}" removed from library`);
      } catch {
        toast.error('Failed to remove book.');
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-danger hover:bg-danger-muted transition-colors disabled:opacity-40"
      title="Remove from library"
    >
      <Trash2 style={{ width: 13, height: 13 }} />
    </button>
  );
}
