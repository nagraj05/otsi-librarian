'use client';

import { ArrowLeft, ChevronLeft, ChevronRight, Bookmark, BookmarkCheck, PanelRight, ALargeSmall } from 'lucide-react';
import Link from 'next/link';
import type { ReaderTheme } from '@/lib/types';

const SHELL_BG: Record<ReaderTheme, string> = {
  light: 'rgba(255,255,255,0.88)',
  sepia: 'rgba(244,236,216,0.88)',
  dark:  'rgba(26,26,46,0.88)',
};

const TEXT_COLOR: Record<ReaderTheme, string> = {
  light: '#374151',
  sepia: '#3b2f1e',
  dark:  '#d1d5db',
};

const MUTED_COLOR: Record<ReaderTheme, string> = {
  light: '#9ca3af',
  sepia: '#7c6a52',
  dark:  '#6b7280',
};

const THEMES: { key: ReaderTheme; bg: string; label: string }[] = [
  { key: 'light', bg: '#ffffff', label: 'Light' },
  { key: 'sepia', bg: '#f4ecd8', label: 'Sepia' },
  { key: 'dark',  bg: '#1a1a2e', label: 'Dark'  },
];

interface Props {
  bookId: string;
  title: string;
  chapter: string;
  theme: ReaderTheme;
  fontSizeIdx: number;
  fontSizeMin: boolean;
  fontSizeMax: boolean;
  isBookmarked: boolean;
  sidebarOpen: boolean;
  onThemeChange:       (t: ReaderTheme) => void;
  onFontSizeIncrease:  () => void;
  onFontSizeDecrease:  () => void;
  onBookmarkToggle:    () => void;
  onSidebarToggle:     () => void;
  onPrev:              () => void;
  onNext:              () => void;
}

export function ReaderToolbar({
  bookId, title, chapter, theme,
  fontSizeMin, fontSizeMax,
  isBookmarked, sidebarOpen,
  onThemeChange, onFontSizeIncrease, onFontSizeDecrease,
  onBookmarkToggle, onSidebarToggle, onPrev, onNext,
}: Props) {
  const bg    = SHELL_BG[theme];
  const text  = TEXT_COLOR[theme];
  const muted = MUTED_COLOR[theme];

  return (
    <div
      style={{ background: bg, color: text }}
      className="fixed top-0 left-0 right-0 z-40 h-14 flex items-center px-3 gap-2 backdrop-blur-md border-b"
      onClick={e => e.stopPropagation()}
    >
      {/* Back */}
      <Link
        href={`/books/${bookId}`}
        style={{ color: muted }}
        className="flex items-center gap-1 text-sm font-medium hover:opacity-70 transition-opacity shrink-0 pr-1"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Back</span>
      </Link>

      {/* Prev page */}
      <button
        onClick={onPrev}
        style={{ color: muted }}
        className="p-1.5 rounded-lg hover:opacity-70 transition-opacity shrink-0"
        title="Previous page (←)"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Title + Chapter — center */}
      <div className="flex-1 min-w-0 text-center px-2">
        <p className="text-[13px] font-bold leading-tight truncate">{title}</p>
        {chapter && (
          <p className="text-[10px] leading-tight truncate mt-0.5" style={{ color: muted }}>{chapter}</p>
        )}
      </div>

      {/* Next page */}
      <button
        onClick={onNext}
        style={{ color: muted }}
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
          style={{ color: muted }}
          className="p-1.5 rounded-lg hover:opacity-70 transition-opacity disabled:opacity-30"
          title="Decrease font size"
        >
          <span className="text-xs font-bold leading-none">A−</span>
        </button>
        <button
          onClick={onFontSizeIncrease}
          disabled={fontSizeMax}
          style={{ color: muted }}
          className="p-1.5 rounded-lg hover:opacity-70 transition-opacity disabled:opacity-30"
          title="Increase font size"
        >
          <ALargeSmall className="w-4 h-4" />
        </button>
      </div>

      {/* Theme swatches */}
      <div className="hidden sm:flex items-center gap-1.5 shrink-0">
        {THEMES.map(t => (
          <button
            key={t.key}
            onClick={() => onThemeChange(t.key)}
            title={t.label}
            className="w-5 h-5 rounded-full transition-transform hover:scale-110"
            style={{
              background: t.bg,
              border: `2px solid ${theme === t.key ? text : muted}`,
              opacity: theme === t.key ? 1 : 0.6,
            }}
          />
        ))}
      </div>

      {/* Bookmark */}
      <button
        onClick={onBookmarkToggle}
        title={isBookmarked ? 'Remove bookmark' : 'Bookmark this page'}
        className="p-1.5 rounded-lg hover:opacity-70 transition-opacity shrink-0"
        style={{ color: isBookmarked ? '#f59e0b' : muted }}
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
        style={{ color: sidebarOpen ? text : muted }}
      >
        <PanelRight className="w-4 h-4" />
      </button>
    </div>
  );
}
