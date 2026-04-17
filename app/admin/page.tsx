import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { Library, BookOpen, RotateCcw, BookMarked, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import sql from '@/lib/db';
import { Borrow } from '@/lib/types';
import { AddBorrowDialog } from '@/components/add-borrow-dialog';
import { ReturnButton } from '@/components/return-button';
import { DeleteButton } from '@/components/delete-button';

async function getBorrows(): Promise<Borrow[]> {
  try {
    const rows = await sql`SELECT * FROM borrows ORDER BY borrowed_at DESC`;
    return rows as Borrow[];
  } catch {
    return [];
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default async function AdminPage() {
  const { userId } = await auth();
  if (!userId) redirect('/');

  const [user, borrows] = await Promise.all([currentUser(), getBorrows()]);
  const borrowed = borrows.filter((b) => !b.returned_at);
  const returned = borrows.filter((b) => b.returned_at);

  return (
    <div className="min-h-screen" style={{ background: '#F7F6F3' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-black/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200">
              <Library style={{ width: 18, height: 18 }} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-[15px] tracking-tight">Otsi Library</span>
              <p className="text-[11px] text-indigo-500 hidden sm:block leading-none mt-0.5 font-semibold">Admin Dashboard</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-700 hidden sm:block">
              {user?.firstName ?? 'Admin'}
            </span>
            <UserButton />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        {/* Page title + CTA */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Borrow Records</h1>
            <p className="text-slate-500 text-sm mt-1">Manage all book borrowings from Nagraj&apos;s library.</p>
          </div>
          <AddBorrowDialog />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
          <div className="bg-white rounded-2xl p-4 sm:p-5 ring-1 ring-black/[0.05] shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total</span>
            </div>
            <p className="text-3xl font-bold text-slate-900 leading-none">{borrows.length}</p>
          </div>
          <div className="bg-amber-50 rounded-2xl p-4 sm:p-5 ring-1 ring-amber-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <BookMarked className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-semibold text-amber-500 uppercase tracking-wider">Out</span>
            </div>
            <p className="text-3xl font-bold text-amber-700 leading-none">{borrowed.length}</p>
          </div>
          <div className="bg-emerald-50 rounded-2xl p-4 sm:p-5 ring-1 ring-emerald-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] font-semibold text-emerald-500 uppercase tracking-wider">Back</span>
            </div>
            <p className="text-3xl font-bold text-emerald-700 leading-none">{returned.length}</p>
          </div>
        </div>

        {/* Records */}
        {borrows.length === 0 ? (
          <div className="text-center py-28 bg-white rounded-3xl ring-1 ring-black/[0.05] shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-5 ring-1 ring-black/[0.06]">
              <BookOpen className="w-7 h-7 text-slate-300" />
            </div>
            <p className="font-semibold text-slate-600">No records yet</p>
            <p className="text-sm text-slate-400 mt-1">Click &ldquo;Add Borrow&rdquo; to get started.</p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="sm:hidden space-y-3">
              {borrows.map((b) => <MobileRow key={b.id} borrow={b} />)}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block bg-white rounded-3xl ring-1 ring-black/[0.05] shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-6 py-4">Book</th>
                    <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-4">Borrower</th>
                    <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-4">Borrowed</th>
                    <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-4">Returned</th>
                    <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-4">Status</th>
                    <th className="px-4 py-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {borrows.map((b) => <DesktopRow key={b.id} borrow={b} />)}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function DesktopRow({ borrow }: { borrow: Borrow }) {
  const isReturned = !!borrow.returned_at;
  return (
    <tr className="hover:bg-slate-50/70 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3.5">
          {borrow.book_thumbnail ? (
            <Image
              src={borrow.book_thumbnail}
              alt={borrow.book_title}
              width={36}
              height={50}
              className="rounded-xl object-cover shadow-sm shrink-0"
              style={{ width: 36, height: 50, objectFit: 'cover' }}
            />
          ) : (
            <div className="w-9 h-[50px] rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4 text-slate-300" />
            </div>
          )}
          <div className="min-w-0">
            <Link
              href={`/books/${borrow.book_id}`}
              className="font-semibold text-sm text-slate-900 line-clamp-1 hover:text-indigo-600 transition-colors"
            >
              {borrow.book_title}
            </Link>
            {borrow.book_authors && borrow.book_authors.length > 0 && (
              <p className="text-xs text-slate-400 truncate max-w-48 mt-0.5">{borrow.book_authors.join(', ')}</p>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <p className="text-sm font-semibold text-slate-700">{borrow.borrower_name}</p>
        {borrow.notes && <p className="text-xs text-slate-400 truncate max-w-36 mt-0.5">{borrow.notes}</p>}
      </td>
      <td className="px-4 py-4 text-sm text-slate-500 whitespace-nowrap">{formatDate(borrow.borrowed_at)}</td>
      <td className="px-4 py-4 text-sm whitespace-nowrap">
        {borrow.returned_at
          ? <span className="text-emerald-600 font-medium">{formatDate(borrow.returned_at)}</span>
          : <span className="text-slate-300">—</span>}
      </td>
      <td className="px-4 py-4">
        <Badge className={`text-[11px] rounded-full px-2.5 py-0.5 border-0 font-semibold ${
          isReturned ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
        }`}>
          {isReturned ? 'Returned' : 'Borrowed'}
        </Badge>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-1 justify-end">
          {!isReturned && <ReturnButton id={borrow.id} bookTitle={borrow.book_title} />}
          <DeleteButton id={borrow.id} />
        </div>
      </td>
    </tr>
  );
}

function MobileRow({ borrow }: { borrow: Borrow }) {
  const isReturned = !!borrow.returned_at;
  return (
    <div className="bg-white rounded-2xl ring-1 ring-black/[0.05] shadow-sm p-4">
      <div className="flex gap-3.5 items-start mb-3">
        {borrow.book_thumbnail ? (
          <Image
            src={borrow.book_thumbnail}
            alt={borrow.book_title}
            width={44}
            height={62}
            className="rounded-xl object-cover shadow-sm shrink-0"
            style={{ width: 44, height: 62, objectFit: 'cover' }}
          />
        ) : (
          <div className="w-11 h-[62px] rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-slate-300" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1 mb-0.5">
            <Link
              href={`/books/${borrow.book_id}`}
              className="font-semibold text-sm text-slate-900 line-clamp-2 leading-snug hover:text-indigo-600 transition-colors"
            >
              {borrow.book_title}
            </Link>
            <Badge className={`shrink-0 text-[10px] rounded-full px-2 border-0 font-semibold ${
              isReturned ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {isReturned ? 'Returned' : 'Out'}
            </Badge>
          </div>
          {borrow.book_authors && borrow.book_authors.length > 0 && (
            <p className="text-xs text-slate-400 truncate">{borrow.book_authors.join(', ')}</p>
          )}
          <p className="text-xs font-semibold text-slate-600 mt-1.5">{borrow.borrower_name}</p>
        </div>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
        <div className="text-xs text-slate-400 space-y-0.5">
          <p>Borrowed: {formatDate(borrow.borrowed_at)}</p>
          {borrow.returned_at && <p className="text-emerald-500 font-medium">Returned: {formatDate(borrow.returned_at)}</p>}
        </div>
        <div className="flex items-center gap-1">
          {!isReturned && <ReturnButton id={borrow.id} bookTitle={borrow.book_title} />}
          <DeleteButton id={borrow.id} />
        </div>
      </div>
    </div>
  );
}
