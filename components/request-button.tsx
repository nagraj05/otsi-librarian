'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { requestBook } from '@/app/actions';
import { toast } from 'sonner';
import { BookOpen, Clock, Loader2 } from 'lucide-react';

interface Props {
  bookId: string;
  bookTitle: string;
  mode: 'request' | 'waitlist';
}

export function RequestButton({ bookId, bookTitle, mode }: Props) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await requestBook(bookId);
      setDone(true);
      toast.success(
        mode === 'request'
          ? `Request sent for "${bookTitle}"`
          : `You're on the waitlist for "${bookTitle}"`
      );
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-brand-muted text-brand">
        <Clock className="w-3 h-3" />
        {mode === 'request' ? 'Requested' : 'On waitlist'}
      </span>
    );
  }

  return (
    <Button
      size="sm"
      variant={mode === 'request' ? 'default' : 'outline'}
      className={`h-7 px-3 text-[12px] font-semibold rounded-lg ${
        mode === 'request'
          ? 'bg-brand hover:bg-brand/90 text-white shadow-sm'
          : 'border-brand/40 text-brand hover:bg-brand-muted'
      }`}
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : mode === 'request' ? (
        <>
          <BookOpen className="w-3 h-3 mr-1" />
          Request
        </>
      ) : (
        <>
          <Clock className="w-3 h-3 mr-1" />
          Waitlist
        </>
      )}
    </Button>
  );
}
