'use client';

import { useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { deleteBorrow } from '@/app/actions';

export function DeleteButton({ id }: { id: number }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          try {
            await deleteBorrow(id);
            toast.success('Record deleted');
          } catch {
            toast.error('Failed to delete. Please try again.');
          }
        })
      }
      className="rounded-lg text-danger hover:text-danger hover:bg-danger-muted"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </Button>
  );
}
