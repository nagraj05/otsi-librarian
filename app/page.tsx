import { BookOpen, BookMarked, Library, LogIn, Users } from 'lucide-react';
import { SignInButton } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Terminal } from '@/components/terminal';
import sql from '@/lib/db';
import { Borrow } from '@/lib/types';

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

const AVATAR_COLORS = [
  { bg: 'bg-violet-500', light: 'bg-violet-100 text-violet-700' },
  { bg: 'bg-amber-500',  light: 'bg-amber-100 text-amber-700' },
  { bg: 'bg-emerald-500',light: 'bg-emerald-100 text-emerald-700' },
  { bg: 'bg-rose-500',   light: 'bg-rose-100 text-rose-700' },
  { bg: 'bg-sky-500',    light: 'bg-sky-100 text-sky-700' },
  { bg: 'bg-orange-500', light: 'bg-orange-100 text-orange-700' },
];

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}
function getColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function PersonCard({ name, borrows }: { name: string; borrows: Borrow[] }) {
  const color = getColor(name);
  return (
    <div className="bg-white rounded-3xl shadow-sm shadow-black/5 ring-1 ring-black/[0.05] overflow-hidden hover:shadow-md hover:shadow-black/8 transition-all duration-300">
      {/* Person header */}
      <div className="px-5 pt-5 pb-4 flex items-center gap-3.5">
        <div className={`w-10 h-10 rounded-2xl ${color.bg} flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm`}>
          {getInitials(name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 truncate text-[15px]">{name}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {borrows.length} book{borrows.length > 1 ? 's' : ''} borrowed
          </p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${color.light}`}>
          {borrows.length}
        </span>
      </div>

      {/* Divider */}
      <div className="h-px bg-slate-100 mx-5" />

      {/* Books list */}
      <div className="px-5 py-4 space-y-4">
        {borrows.map((b, i) => (
          <div key={b.id}>
            <div className="flex gap-3.5 items-start">
              {/* Cover */}
              <Link href={`/books/${b.book_id}`} className="shrink-0 block group">
                {b.book_thumbnail ? (
                  <Image
                    src={b.book_thumbnail}
                    alt={b.book_title}
                    width={44}
                    height={62}
                    className="rounded-xl object-cover shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-200"
                    style={{ width: 44, height: 62, objectFit: 'cover' }}
                  />
                ) : (
                  <div className="w-11 h-[62px] rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                    <BookOpen className="w-5 h-5 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                  </div>
                )}
              </Link>

              {/* Info */}
              <div className="flex-1 min-w-0 pt-0.5">
                <Link
                  href={`/books/${b.book_id}`}
                  className="font-semibold text-sm text-slate-900 leading-snug line-clamp-2 hover:text-indigo-600 transition-colors"
                >
                  {b.book_title}
                </Link>
                {b.book_authors && b.book_authors.length > 0 && (
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{b.book_authors.join(', ')}</p>
                )}
                <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Since {formatDate(b.borrowed_at)}
                </p>
              </div>
            </div>
            {i < borrows.length - 1 && <div className="h-px bg-slate-50 mt-4" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function ReturnedCard({ borrow }: { borrow: Borrow }) {
  return (
    <div className="bg-white rounded-2xl ring-1 ring-black/[0.05] shadow-sm flex gap-3.5 items-center p-3.5 hover:shadow-md transition-all duration-200 group">
      <Link href={`/books/${borrow.book_id}`} className="shrink-0">
        {borrow.book_thumbnail ? (
          <Image
            src={borrow.book_thumbnail}
            alt={borrow.book_title}
            width={36}
            height={50}
            className="rounded-lg object-cover shadow-sm group-hover:scale-105 transition-transform duration-200"
            style={{ width: 36, height: 50, objectFit: 'cover' }}
          />
        ) : (
          <div className="w-9 h-[50px] rounded-lg bg-slate-100 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-slate-300" />
          </div>
        )}
      </Link>
      <div className="flex-1 min-w-0">
        <Link
          href={`/books/${borrow.book_id}`}
          className="font-semibold text-sm text-slate-700 line-clamp-1 hover:text-indigo-600 transition-colors"
        >
          {borrow.book_title}
        </Link>
        <p className="text-xs text-slate-400 mt-0.5 truncate">{borrow.borrower_name}</p>
      </div>
      <div className="text-right shrink-0">
        <span className="inline-block text-[11px] font-medium bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
          Returned
        </span>
        <p className="text-[11px] text-slate-400 mt-1">{formatDate(borrow.returned_at!)}</p>
      </div>
    </div>
  );
}

export default async function HomePage() {
  const { userId } = await auth();
  const borrows = await getBorrows();
  const borrowed = borrows.filter((b) => !b.returned_at);
  const returned = borrows.filter((b) => b.returned_at);

  const byPerson = borrowed.reduce<Record<string, Borrow[]>>((acc, b) => {
    (acc[b.borrower_name] ??= []).push(b);
    return acc;
  }, {});
  const people = Object.entries(byPerson);

  return (
    <div className="min-h-screen" style={{ background: '#F7F6F3' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-black/[0.06]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200">
              <Library className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-[15px] tracking-tight">OTSI LIBRARY</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Terminal />
            {userId ? (
              <Link href="/admin">
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl gap-1.5 h-8 px-4 text-[13px] font-semibold shadow-sm shadow-indigo-200">
                  <BookMarked style={{ width: 13, height: 13 }} />
                  Dashboard
                </Button>
              </Link>
            ) : (
              <SignInButton mode="modal">
                <Button size="sm" variant="outline" className="rounded-xl gap-1.5 h-8 px-4 text-[13px] font-semibold border-slate-200 text-slate-600 hover:bg-slate-50">
                  {/* <LogIn style={{ width: 13, height: 13 }} /> */}
                  Admin
                </Button>
              </SignInButton>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-2 ">

        {/* Hero text */}
        <div className="mb-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Book Borrowings</h2>
          <p className="text-slate-500 mt-1 text-sm">Track who has which books from Nagraj&apos;s library.</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-2xl p-4 ring-1 ring-black/[0.05] shadow-sm">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Total</p>
            <p className="text-3xl font-bold text-slate-900 leading-none">{borrows.length}</p>
          </div>
          <div className="bg-amber-50 rounded-2xl p-4 ring-1 ring-amber-100 shadow-sm">
            <p className="text-[11px] font-semibold text-amber-500 uppercase tracking-wider mb-1">Out Now</p>
            <p className="text-3xl font-bold text-amber-700 leading-none">{borrowed.length}</p>
          </div>
          <div className="bg-indigo-50 rounded-2xl p-4 ring-1 ring-indigo-100 shadow-sm">
            <p className="text-[11px] font-semibold text-indigo-500 uppercase tracking-wider mb-1">People</p>
            <p className="text-3xl font-bold text-indigo-700 leading-none">{people.length}</p>
          </div>
        </div>

        {/* Currently Borrowed */}
        {people.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-2.5 mb-5">
              <Users className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-slate-800 text-[15px]">Currently Out</h3>
              <span className="text-xs text-slate-400 font-medium">
                {borrowed.length} book{borrowed.length > 1 ? 's' : ''} · {people.length} person{people.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {people.map(([name, books]) => (
                <PersonCard key={name} name={name} borrows={books} />
              ))}
            </div>
          </section>
        )}

        {/* Returned */}
        {returned.length > 0 && (
          <section>
            <div className="flex items-center gap-2.5 mb-5">
              <BookOpen className="w-4 h-4 text-emerald-500" />
              <h3 className="font-bold text-slate-800 text-[15px]">Returned</h3>
              <span className="text-xs text-slate-400 font-medium">({returned.length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {returned.map((b) => <ReturnedCard key={b.id} borrow={b} />)}
            </div>
          </section>
        )}

        {borrows.length === 0 && (
          <div className="text-center py-28">
            <div className="w-16 h-16 bg-white rounded-3xl shadow-sm ring-1 ring-black/[0.06] flex items-center justify-center mx-auto mb-5">
              <BookOpen className="w-7 h-7 text-slate-300" />
            </div>
            <p className="font-semibold text-slate-600">No records yet</p>
            <p className="text-sm text-slate-400 mt-1">Borrow records will appear here.</p>
          </div>
        )}
      </main>
    </div>
  );
}
