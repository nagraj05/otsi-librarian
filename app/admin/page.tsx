import { BookOpen, BookPlus, Clock, BookMarked } from 'lucide-react';
import { AdminTabs } from '@/components/admin-tabs';
import sql from '@/lib/db';
import { Book, Borrow } from '@/lib/types';

async function getData() {
  const [pendingRows, activeRows, catalogRows] = await Promise.all([
    sql`
      SELECT b.*, u.name AS user_name
      FROM borrows b
      LEFT JOIN users u ON u.id = b.user_id
      WHERE b.status = 'pending'
      ORDER BY b.borrowed_at ASC
    `,
    sql`
      SELECT b.*, u.name AS user_name
      FROM borrows b
      LEFT JOIN users u ON u.id = b.user_id
      WHERE b.status = 'active'
      ORDER BY b.due_date ASC NULLS LAST
    `,
    sql`
      SELECT bk.*, ab.borrower_name AS borrowed_by
      FROM books bk
      LEFT JOIN borrows ab ON ab.book_id = bk.book_id AND ab.status = 'active'
      ORDER BY bk.title ASC
    `,
  ]);
  return {
    pending: pendingRows as (Borrow & { user_name: string })[],
    active:  activeRows  as (Borrow & { user_name: string })[],
    catalog: catalogRows as (Book & { borrowed_by: string | null })[],
  };
}

export default async function AdminPage() {
  const { pending, active, catalog } = await getData();

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-brand-muted rounded-2xl p-3 sm:p-4 ring-1 ring-brand-muted/60 shadow-sm">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
            <Clock className="w-3.5 h-3.5 text-brand shrink-0" />
            <span className="text-[10px] sm:text-[11px] font-semibold text-brand uppercase tracking-wider">Pending</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-brand-muted-fg leading-none">{pending.length}</p>
        </div>
        <div className="bg-warn-muted rounded-2xl p-3 sm:p-4 ring-1 ring-warn-muted/60 shadow-sm">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
            <BookMarked className="w-3.5 h-3.5 text-warn shrink-0" />
            <span className="text-[10px] sm:text-[11px] font-semibold text-warn uppercase tracking-wider">Active</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-warn-muted-fg leading-none">{active.length}</p>
        </div>
        <div className="bg-card rounded-2xl p-3 sm:p-4 ring-1 ring-foreground/5 shadow-sm">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
            <BookPlus className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Books</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-foreground leading-none">{catalog.length}</p>
        </div>
      </div>

      <AdminTabs pending={pending} active={active} catalog={catalog} />

    </main>
  );
}
