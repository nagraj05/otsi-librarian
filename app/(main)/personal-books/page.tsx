import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import sql from '@/lib/db';
import type { PersonalBook } from '@/lib/types';
import { AddPersonalBookDialog } from '@/components/add-personal-book-dialog';
import { PersonalBooksShelf } from './personal-books-shelf';

async function getPersonalBooks(userId: string): Promise<PersonalBook[]> {
  const rows = await sql`
    SELECT * FROM personal_books
    WHERE user_id = ${userId}
    ORDER BY updated_at DESC
  `;
  return rows as PersonalBook[];
}

export default async function PersonalBooksPage() {
  const { userId } = await auth();
  if (!userId) redirect('/');

  const books = await getPersonalBooks(userId);

  const total        = books.length;
  const wantToRead   = books.filter(b => b.status === 'want_to_read').length;
  const reading      = books.filter(b => b.status === 'reading').length;
  const finished     = books.filter(b => b.status === 'finished').length;

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">My Books</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Your personal reading shelf.</p>
        </div>
        <AddPersonalBookDialog />
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-6">
        <div className="bg-card rounded-2xl p-3 sm:p-4 ring-1 ring-foreground/5 shadow-sm">
          <p className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total</p>
          <p className="text-2xl sm:text-3xl font-bold text-foreground leading-none">{total}</p>
        </div>
        <div className="bg-card rounded-2xl p-3 sm:p-4 ring-1 ring-foreground/5 shadow-sm">
          <p className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 leading-tight">Want</p>
          <p className="text-2xl sm:text-3xl font-bold text-foreground leading-none">{wantToRead}</p>
        </div>
        <div className="bg-brand-muted rounded-2xl p-3 sm:p-4 ring-1 ring-brand-muted/60 shadow-sm">
          <p className="text-[10px] sm:text-[11px] font-semibold text-brand uppercase tracking-wider mb-1">Reading</p>
          <p className="text-2xl sm:text-3xl font-bold text-brand-muted-fg leading-none">{reading}</p>
        </div>
        <div className="bg-success-muted rounded-2xl p-3 sm:p-4 ring-1 ring-success-muted/60 shadow-sm">
          <p className="text-[10px] sm:text-[11px] font-semibold text-success uppercase tracking-wider mb-1">Finished</p>
          <p className="text-2xl sm:text-3xl font-bold text-success-muted-fg leading-none">{finished}</p>
        </div>
      </div>

      {/* Filter tabs + card grid (client) */}
      <PersonalBooksShelf books={books} />

    </main>
  );
}
