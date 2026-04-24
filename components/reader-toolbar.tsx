'use client';

import { ArrowLeft, ChevronLeft, ChevronRight, Bookmark, BookmarkCheck, PanelRight, ALargeSmall } from 'lucide-react';
import Link from 'next/link';

const BG    = 'rgba(17,24,39,0.90)';
const TEXT  = '#d1d5db';
const MUTED = '#6b7280';

interface Props {
  bookId: string;
  title: string;
  chapter: string;
  fontSizeIdx: number;
  fontSizeMin: boolean;
  fontSizeMax: boolean;
  isBookmarked: boolean;
  sidebarOpen: boolean;
  onFontSizeIncrease: () => void;
  onFontSizeDecrease: () => void;
  onBookmarkToggle:   () => void;
  onSidebarToggle:    () => void;
  onPrev: () => void;
  onNext: () => void;
}

export function ReaderToolbar({
  bookId, title, chapter,
  fontSizeMin, fontSizeMax,
  isBookmarked, sidebarOpen,
  onFontSizeIncrease, onFontSizeDecrease,
  onBookmarkToggle, onSidebarToggle, onPrev, onNext,
}: Props) {
  return (
    <div
      style={{ background: BG, color: TEXT }}
      className="fixed top-0 left-0 right-0 z-40 h-14 flex items-center px-3 gap-2 backdrop-blur-md border-b border-white/10"
      onClick={e => e.stopPropagation()}
    >
      {/* Back */}
      <Link
        href={`/books/${bookId}`}
        style={{ color: MUTED }}
        className="flex items-center gap-1 text-sm font-medium hover:opacity-70 transition-opacity shrink-0 pr-1"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Back</span>
      </Link>

      {/* Prev page */}
      <button
        onClick={onPrev}
        style={{ color: MUTED }}
        className="p-1.5 rounded-lg hover:opacity-70 transition-opacity shrink-0"
        title="Previous page (←)"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Title + Chapter — center */}
      <div className="flex-1 min-w-0 text-center px-2">
        <p className="text-[13px] font-bold leading-tight truncate">{title}</p>
        {chapter && (
          <p className="text-[10px] leading-tight truncate mt-0.5" style={{ color: MUTED }}>
            {chapter}
          </p>
        )}
      </div>

      {/* Next page */}
      <button
        onClick={onNext}
        style={{ color: MUTED }}
        className="p-1.5 rounded-lg hover:opacity-70 transition-opacity shrink-0"
        title="Next page (→)"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Font size */}
      <div className="hidden sm:flex items-center gap-0.5 shrink-0">
        <button
          onClick={onFontSizeDecrease}
          disabled={fontSizeMin}
          style={{ color: MUTED }}
          className="p-1.5 rounded-lg hover:opacity-70 transition-opacity disabled:opacity-30"
          title="Decrease font size"
        >
          <span className="text-xs font-bold leading-none">A−</span>
        </button>
        <button
          onClick={onFontSizeIncrease}
          disabled={fontSizeMax}
          style={{ color: MUTED }}
          className="p-1.5 rounded-lg hover:opacity-70 transition-opacity disabled:opacity-30"
          title="Increase font size"
        >
          <ALargeSmall className="w-4 h-4" />
        </button>
      </div>

      {/* Bookmark */}
      <button
        onClick={onBookmarkToggle}
        title={isBookmarked ? 'Remove bookmark' : 'Bookmark this page'}
        className="p-1.5 rounded-lg hover:opacity-70 transition-opacity shrink-0"
        style={{ color: isBookmarked ? '#f59e0b' : MUTED }}
      >
        {isBookmarked
          ? <BookmarkCheck className="w-4 h-4 fill-current" />
          : <Bookmark className="w-4 h-4" />}
      </button>

      {/* Sidebar toggle */}
      <button
        onClick={onSidebarToggle}
        title="Contents, bookmarks & highlights"
        className="p-1.5 rounded-lg hover:opacity-70 transition-opacity shrink-0"
        style={{ color: sidebarOpen ? TEXT : MUTED }}
      >
        <PanelRight className="w-4 h-4" />
      </button>
    </div>
  );
}
