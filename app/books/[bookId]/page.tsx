import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft, BookOpen, Calendar, Building2, Hash,
  Star, FileText, Tag, Clock, CheckCircle2, Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import sql from '@/lib/db';
import { Borrow } from '@/lib/types';

async function getBookBorrows(bookId: string): Promise<Borrow[]> {
  const rows = await sql`
    SELECT * FROM borrows WHERE book_id = ${bookId} ORDER BY borrowed_at DESC
  `;
  return rows as Borrow[];
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}
function formatDateShort(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function StarRating({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const cls = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4.5 h-4.5';
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            style={{ width: size === 'sm' ? 14 : 18, height: size === 'sm' ? 14 : 18 }}
            className={`${cls} ${
              i < full
                ? 'text-amber-400 fill-amber-400'
                : i === full && half
                ? 'text-amber-400 fill-amber-200'
                : 'text-white/20 fill-white/20'
            }`}
          />
        ))}
      </div>
      <span className={`font-bold text-white/90 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

const AVATAR_COLORS = [
  { bg: 'bg-violet-500', ring: 'ring-violet-200' },
  { bg: 'bg-amber-500',  ring: 'ring-amber-200' },
  { bg: 'bg-emerald-500',ring: 'ring-emerald-200' },
  { bg: 'bg-rose-500',   ring: 'ring-rose-200' },
  { bg: 'bg-sky-500',    ring: 'ring-sky-200' },
  { bg: 'bg-orange-500', ring: 'ring-orange-200' },
];
function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}
function getAvatar(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

export default async function BookPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = await params;
  const borrows = await getBookBorrows(bookId);
  if (borrows.length === 0) notFound();

  const b = borrows[0];
  const currentBorrow = borrows.find((r) => !r.returned_at);
  const totalBorrows = borrows.length;
  const uniqueBorrowers = new Set(borrows.map((r) => r.borrower_name)).size;

  return (
    <div className="min-h-screen">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden">
        {b.book_thumbnail && (
          <div className="absolute inset-0 scale-110">
            <Image
              src={b.book_thumbnail}
              alt=""
              fill
              className="object-cover blur-3xl opacity-40 saturate-200"
            />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/70 to-background" />

        {/* Back nav */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-5">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors font-medium group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Library
          </Link>
        </div>

        {/* Hero content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-10">
          <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-end">

            {/* Cover with subtle 3-D lift */}
            <div className="shrink-0 mx-auto sm:mx-0">
              {b.book_thumbnail ? (
                <div className="relative group">
                  <div className="absolute -inset-3 bg-white/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Image
                    src={b.book_thumbnail}
                    alt={b.book_title}
                    width={150}
                    height={215}
                    className="relative rounded-2xl shadow-[0_32px_64px_rgba(0,0,0,0.6)] object-cover"
                    style={{ width: 150, height: 215, objectFit: 'cover' }}
                  />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/15 via-transparent to-transparent pointer-events-none" />
                </div>
              ) : (
                <div className="w-[150px] h-[215px] rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center shadow-2xl">
                  <BookOpen className="w-14 h-14 text-white/30" />
                </div>
              )}
            </div>

            {/* Text */}
            <div className="flex-1 text-center sm:text-left pb-1">
              {b.book_categories && b.book_categories.length > 0 && (
                <p className="text-xs font-bold text-brand/80 uppercase tracking-[0.15em] mb-3">
                  {b.book_categories[0]}
                </p>
              )}

              <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight tracking-tight mb-2">
                {b.book_title}
              </h1>

              {b.book_authors && b.book_authors.length > 0 && (
                <p className="text-base sm:text-lg text-white/60 font-medium mb-5">
                  by {b.book_authors.join(', ')}
                </p>
              )}

              {b.book_rating && (
                <div className="mb-5 flex justify-center sm:justify-start">
                  <StarRating rating={Number(b.book_rating)} />
                </div>
              )}

              {/* Chips */}
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                {b.book_published_date && (
                  <Chip icon={<Calendar className="w-3 h-3" />} label={b.book_published_date} />
                )}
                {b.book_publisher && (
                  <Chip icon={<Building2 className="w-3 h-3" />} label={b.book_publisher} />
                )}
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full ${
                  currentBorrow
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                    : 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                }`}>
                  {currentBorrow ? (
                    <><Clock className="w-3 h-3" />Currently Borrowed</>
                  ) : (
                    <><CheckCircle2 className="w-3 h-3" />Available</>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-20 -mt-6">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-7">

          {/* ── Left: Description + Details ── */}
          <div className="lg:col-span-2 space-y-5">

            {b.book_description && (
              <Card>
                <SectionHeader icon={<BookOpen className="w-4 h-4 text-brand" />} title="About This Book" />
                <p className="text-sm text-foreground/70 leading-relaxed">{b.book_description}</p>
              </Card>
            )}

            <Card>
              <SectionHeader icon={<Tag className="w-4 h-4 text-brand" />} title="Book Details" />
              <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                {b.book_publisher && <Detail label="Publisher" value={b.book_publisher} />}
                {b.book_published_date && <Detail label="Published" value={b.book_published_date} />}
                {b.book_isbn && <Detail label="ISBN" value={b.book_isbn} mono />}
                {b.book_rating && (
                  <div>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Rating</p>
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: 5 }).map((_, i) => {
                        const full = Math.floor(Number(b.book_rating));
                        const half = Number(b.book_rating) % 1 >= 0.5;
                        return (
                          <Star key={i} style={{ width: 14, height: 14 }} className={
                            i < full ? 'text-amber-400 fill-amber-400'
                            : i === full && half ? 'text-amber-400 fill-amber-200'
                            : 'text-foreground/20 fill-foreground/20'
                          } />
                        );
                      })}
                      <span className="text-sm font-bold text-foreground/80 ml-1">{Number(b.book_rating).toFixed(1)}</span>
                    </div>
                  </div>
                )}
                {b.book_categories && b.book_categories.length > 0 && (
                  <div className="col-span-2">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2.5">Categories</p>
                    <div className="flex flex-wrap gap-1.5">
                      {b.book_categories.map((cat) => (
                        <span key={cat} className="text-xs font-semibold bg-brand-muted text-brand px-3 py-1 rounded-full border border-brand-muted/60">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* ── Right: Borrow history ── */}
          <div className="space-y-5">
            <Card>
              <div className="flex items-center justify-between mb-5">
                <SectionHeader icon={<Clock className="w-4 h-4 text-brand" />} title="Borrow History" noMargin />
                <span className="text-xs font-bold bg-brand-muted text-brand px-2.5 py-1 rounded-full border border-brand-muted/60">
                  {borrows.length}×
                </span>
              </div>

              <div className="space-y-0">
                {borrows.map((record, i) => {
                  const isActive = !record.returned_at;
                  const av = getAvatar(record.borrower_name);
                  return (
                    <div key={record.id} className="relative flex gap-3 pb-5 last:pb-0">
                      {/* Timeline */}
                      {i < borrows.length - 1 && (
                        <div className="absolute left-4 top-8 bottom-0 w-px bg-border" />
                      )}
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-full ${av.bg} ring-2 ${av.ring} flex items-center justify-center text-white text-[11px] font-extrabold shrink-0 z-10 shadow-sm`}>
                        {getInitials(record.borrower_name)}
                      </div>

                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className="font-bold text-sm text-foreground leading-tight truncate">
                            {record.borrower_name}
                          </p>
                          <Badge className={`text-[10px] px-2 py-0.5 rounded-full border-0 shrink-0 font-bold ${
                            isActive ? 'bg-warn-muted text-warn-muted-fg' : 'bg-success-muted text-success-muted-fg'
                          }`}>
                            {isActive ? 'Active' : 'Done'}
                          </Badge>
                        </div>

                        <p className="text-[11px] text-muted-foreground">
                          {formatDateShort(record.borrowed_at)}
                          {record.returned_at && (
                            <span className="text-success"> → {formatDateShort(record.returned_at)}</span>
                          )}
                        </p>

                        {record.notes && (
                          <p className="text-[11px] text-muted-foreground mt-1.5 italic bg-muted/50 rounded-xl px-2.5 py-1.5 border border-border">
                            &ldquo;{record.notes}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {b.book_isbn && (
              <div className="bg-card rounded-2xl ring-1 ring-foreground/5 shadow-sm p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <Hash className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">ISBN</p>
                  <p className="text-sm font-mono font-semibold text-foreground/80 mt-0.5">{b.book_isbn}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Small helper components ── */

function Chip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/10 text-white/80 px-3 py-1.5 rounded-full backdrop-blur border border-white/10">
      {icon}{label}
    </span>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-3xl ring-1 ring-foreground/5 shadow-sm p-6">
      {children}
    </div>
  );
}

function SectionHeader({
  icon, title, noMargin,
}: {
  icon: React.ReactNode; title: string; noMargin?: boolean;
}) {
  return (
    <h2 className={`font-bold text-foreground text-[15px] flex items-center gap-2 ${noMargin ? '' : 'mb-4'}`}>
      {icon}{title}
    </h2>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-semibold text-foreground mt-0.5 ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}
