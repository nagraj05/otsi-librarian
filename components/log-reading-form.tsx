'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { logReading, updatePageCount } from '@/app/actions';
import { toast } from 'sonner';
import { BookOpen, CheckCircle2, Loader2, Pencil } from 'lucide-react';

interface Props {
  borrowId: number;
  todayPages: number | null;
  totalPages: number;
  bookPageCount: number | null;
}

export function LogReadingForm({ borrowId, todayPages, totalPages, bookPageCount }: Props) {
  const [editingLog,   setEditingLog]   = useState(!todayPages);
  const [editingTotal, setEditingTotal] = useState(false);
  const [pages,        setPages]        = useState(todayPages ? String(todayPages) : '');
  const [customTotal,  setCustomTotal]  = useState(bookPageCount ? String(bookPageCount) : '');
  const [logLoading,   setLogLoading]   = useState(false);
  const [totalLoading, setTotalLoading] = useState(false);

  const effectiveTotal = bookPageCount;
  const pct = effectiveTotal && effectiveTotal > 0
    ? Math.min(100, Math.round((totalPages / effectiveTotal) * 100))
    : null;

  // pages already logged across all days except today
  const pagesExclToday = totalPages - (todayPages ?? 0);
  const remaining = effectiveTotal !== null ? Math.max(0, effectiveTotal - pagesExclToday) : null;

  async function handleLogSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseInt(pages);
    if (!n || n < 1) { toast.error('Enter a valid page count'); return; }
    if (remaining !== null && n > remaining) {
      toast.error(remaining === 0 ? 'All pages already logged for this book.' : `Only ${remaining} page${remaining === 1 ? '' : 's'} remaining.`);
      return;
    }
    setLogLoading(true);
    try {
      await logReading(borrowId, n);
      toast.success(`${n} pages logged!`);
      setEditingLog(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLogLoading(false);
    }
  }

  async function handleTotalSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseInt(customTotal);
    if (!n || n < 1) { toast.error('Enter a valid total'); return; }
    setTotalLoading(true);
    try {
      await updatePageCount(borrowId, n);
      toast.success('Total pages updated');
      setEditingTotal(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setTotalLoading(false);
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-border/40 space-y-2.5">

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          {/* Total pages — editable */}
          {editingTotal ? (
            <form onSubmit={handleTotalSubmit} className="flex items-center gap-1.5 flex-1">
              <Input
                type="number"
                min={1}
                placeholder="Total pages"
                value={customTotal}
                onChange={e => setCustomTotal(e.target.value)}
                className="h-6 text-[11px] rounded-md w-24"
                autoFocus
              />
              <Button type="submit" size="sm" disabled={totalLoading}
                className="h-6 px-2 text-[11px] rounded-md bg-brand hover:bg-brand/90 text-white">
                {totalLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Set'}
              </Button>
              <button type="button" onClick={() => setEditingTotal(false)}
                className="text-[11px] text-muted-foreground hover:text-foreground">
                Cancel
              </button>
            </form>
          ) : (
            <button
              onClick={() => { setCustomTotal(effectiveTotal ? String(effectiveTotal) : ''); setEditingTotal(true); }}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors group"
            >
              <span>{totalPages} / {effectiveTotal ?? '?'} pages</span>
              <Pencil className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}

          {pct !== null && (
            <span className="text-[11px] font-semibold text-brand shrink-0">{pct}%</span>
          )}
        </div>

        {/* Bar — always show, even without total */}
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          {pct !== null ? (
            <div
              className="h-full rounded-full bg-brand transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          ) : (
            <div className="h-full rounded-full bg-muted-foreground/20 w-full" />
          )}
        </div>
      </div>

      {/* Log row */}
      {!editingLog && todayPages ? (
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
          <span className="text-xs font-semibold text-success">{todayPages} pages today</span>
          <button
            onClick={() => setEditingLog(true)}
            className="ml-auto text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <Pencil className="w-3 h-3" /> Edit
          </button>
        </div>
      ) : (
        <form onSubmit={handleLogSubmit} className="flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <Input
            type="number"
            min={1}
            max={remaining ?? undefined}
            placeholder={remaining !== null ? `Max ${remaining} pages` : 'Pages read today'}
            value={pages}
            onChange={e => setPages(e.target.value)}
            className="h-7 text-xs rounded-lg flex-1"
          />
          <Button type="submit" size="sm" disabled={logLoading}
            className="h-7 px-3 text-[12px] font-semibold rounded-lg bg-brand hover:bg-brand/90 text-white shrink-0">
            {logLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Log'}
          </Button>
          {todayPages && (
            <button type="button" onClick={() => setEditingLog(false)}
              className="text-xs text-muted-foreground hover:text-foreground shrink-0">
              Cancel
            </button>
          )}
        </form>
      )}
    </div>
  );
}
