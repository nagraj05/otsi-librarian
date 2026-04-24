'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EpubView } from 'react-reader';
import type { Rendition, Contents, NavItem } from 'epubjs';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import type { EbookBookmark, EbookHighlight, ReaderTheme, SidebarTab } from '@/lib/types';
import { ReaderToolbar } from '@/components/reader-toolbar';
import { ReaderSidebar } from '@/components/reader-sidebar';

const HIGHLIGHT_COLORS: Record<EbookHighlight['color'], string> = {
  yellow: '#fef08a',
  green:  '#86efac',
  blue:   '#93c5fd',
  pink:   '#f9a8d4',
};

const SHELL_BG: Record<ReaderTheme, string> = {
  light: '#f3f4f6',
  sepia: '#e8dfc8',
  dark:  '#111827',
};

const FONT_SIZES = [14, 16, 18, 20, 22];

export interface ReaderProps {
  bookId: string;
  ebookUrl: string;
  title: string;
  authors: string[];
  initialCfi: string | null;
  initialBookmarks: EbookBookmark[];
  initialHighlights: EbookHighlight[];
}

export function ReaderClient({
  bookId, ebookUrl, title, initialCfi, initialBookmarks, initialHighlights,
}: ReaderProps) {
  const router = useRouter();

  // Reader location
  const [cfi, setCfi] = useState<string | number | null>(initialCfi ?? null);

  // TOC + current chapter
  const [toc, setToc]               = useState<NavItem[]>([]);
  const [currentChapter, setCurrentChapter] = useState('');
  const tocRef = useRef<NavItem[]>([]);

  // User preferences (loaded from localStorage on mount)
  const [theme, setTheme]           = useState<ReaderTheme>('light');
  const [fontSizeIdx, setFontSizeIdx] = useState(2); // index into FONT_SIZES (default 18 px)
  const themeRef    = useRef<ReaderTheme>('light');
  const fontSizeRef = useRef(FONT_SIZES[2]);

  // UI
  const [toolbarVisible, setToolbarVisible]   = useState(true);
  const [sidebarOpen, setSidebarOpen]         = useState(false);
  const [sidebarTab, setSidebarTab]           = useState<SidebarTab>('toc');
  const [pendingSelection, setPendingSelection] =
    useState<{ cfi: string; text: string } | null>(null);

  // Reading data
  const [bookmarks,  setBookmarks]  = useState<EbookBookmark[]>(initialBookmarks);
  const [highlights, setHighlights] = useState<EbookHighlight[]>(initialHighlights);

  // Refs
  const renditionRef    = useRef<Rendition | null>(null);
  const saveTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toolbarTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Load prefs from localStorage ────────────────────────────────────────
  useEffect(() => {
    const raw = localStorage.getItem('epub-prefs');
    if (!raw) return;
    try {
      const p = JSON.parse(raw) as { theme?: ReaderTheme; fontSizeIdx?: number };
      if (p.theme && ['light', 'sepia', 'dark'].includes(p.theme)) {
        setTheme(p.theme);
        themeRef.current = p.theme;
      }
      if (typeof p.fontSizeIdx === 'number' && p.fontSizeIdx >= 0 && p.fontSizeIdx < FONT_SIZES.length) {
        setFontSizeIdx(p.fontSizeIdx);
        fontSizeRef.current = FONT_SIZES[p.fontSizeIdx];
      }
    } catch { /* ignore bad JSON */ }
  }, []);

  function savePrefs(t: ReaderTheme, idx: number) {
    localStorage.setItem('epub-prefs', JSON.stringify({ theme: t, fontSizeIdx: idx }));
  }

  // ─── Keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') renditionRef.current?.next();
      if (e.key === 'ArrowLeft')  renditionRef.current?.prev();
      if (e.key === 'Escape')     router.push(`/books/${bookId}`);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [bookId, router]);

  // ─── Apply theme / font-size to live rendition ────────────────────────────
  useEffect(() => {
    renditionRef.current?.themes.select(theme);
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    renditionRef.current?.themes.fontSize(`${FONT_SIZES[fontSizeIdx]}px`);
    fontSizeRef.current = FONT_SIZES[fontSizeIdx];
  }, [fontSizeIdx]);

  // ─── Toolbar auto-hide ────────────────────────────────────────────────────
  function revealToolbar() {
    setToolbarVisible(true);
    if (toolbarTimerRef.current) clearTimeout(toolbarTimerRef.current);
    toolbarTimerRef.current = setTimeout(() => {
      if (!sidebarOpen) setToolbarVisible(false);
    }, 3000);
  }

  // ─── epub.js callbacks ────────────────────────────────────────────────────
  function handleGetRendition(rendition: Rendition) {
    renditionRef.current = rendition;

    const bodyStyle = (extra?: object) => ({
      body: {
        'line-height': '1.85 !important',
        'font-family': 'Georgia, "Times New Roman", serif !important',
        'padding': '0 4% !important',
        ...extra,
      },
    });

    rendition.themes.register('light', bodyStyle({ background: '#ffffff !important', color: '#1a1a1a !important' }));
    rendition.themes.register('sepia', bodyStyle({ background: '#fdf6e3 !important', color: '#3b2f1e !important' }));
    rendition.themes.register('dark',  bodyStyle({ background: '#1f2937 !important', color: '#e5e7eb !important' }));
    rendition.themes.select(themeRef.current);
    rendition.themes.fontSize(`${fontSizeRef.current}px`);

    // Re-apply saved highlights
    initialHighlights.forEach(h => {
      rendition.annotations.highlight(h.cfi_range, {}, undefined, '', {
        fill: HIGHLIGHT_COLORS[h.color],
        'fill-opacity': '0.45',
      });
    });
  }

  function handleTocChanged(newToc: NavItem[]) {
    setToc(newToc);
    tocRef.current = newToc;
  }

  function findChapter(items: NavItem[], href: string): string {
    for (const item of items) {
      const base = item.href.split('#')[0];
      if (href.includes(base) || base.includes(href)) return item.label.trim();
      if (item.subitems) {
        const found = findChapter(item.subitems, href);
        if (found) return found;
      }
    }
    return '';
  }

  function handleLocationChanged(newCfi: string) {
    setCfi(newCfi);
    setPendingSelection(null);

    // Update chapter label
    const href = renditionRef.current?.location?.start?.href ?? '';
    if (href) {
      const chapter = findChapter(tocRef.current, href);
      if (chapter) setCurrentChapter(chapter);
    }

    // Debounced progress save (1.5 s)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      fetch(`/api/ebook/${bookId}/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cfi: newCfi }),
      });
    }, 1500);
  }

  function handleTextSelected(cfiRange: string, contents: Contents) {
    const text = contents.window.getSelection()?.toString().trim() ?? '';
    if (!text) return;
    setPendingSelection({ cfi: cfiRange, text });
  }

  // ─── Highlights ───────────────────────────────────────────────────────────
  async function handleAddHighlight(color: EbookHighlight['color']) {
    if (!pendingSelection) return;
    const { cfi: cfiRange, text } = pendingSelection;
    setPendingSelection(null);

    // Apply visually first (optimistic)
    renditionRef.current?.annotations.highlight(cfiRange, {}, undefined, '', {
      fill: HIGHLIGHT_COLORS[color],
      'fill-opacity': '0.45',
    });

    try {
      const res = await fetch(`/api/ebook/${bookId}/highlights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cfi_range: cfiRange, text, color }),
      });
      const h = await res.json() as EbookHighlight;
      setHighlights(prev => [...prev, h]);
    } catch { /* visual highlight already applied */ }
  }

  async function handleDeleteHighlight(h: EbookHighlight) {
    renditionRef.current?.annotations.remove(h.cfi_range, 'highlight');
    setHighlights(prev => prev.filter(x => x.id !== h.id));
    await fetch(`/api/ebook/${bookId}/highlights/${h.id}`, { method: 'DELETE' });
  }

  // ─── Bookmarks ────────────────────────────────────────────────────────────
  function activeBookmark() {
    const s = typeof cfi === 'string' ? cfi : null;
    if (!s) return null;
    return bookmarks.find(b => b.cfi === s) ?? null;
  }

  async function handleBookmarkToggle() {
    const existing = activeBookmark();
    if (existing) {
      setBookmarks(prev => prev.filter(b => b.id !== existing.id));
      await fetch(`/api/ebook/${bookId}/bookmarks/${existing.id}`, { method: 'DELETE' });
    } else {
      const s = typeof cfi === 'string' ? cfi : null;
      if (!s) return;
      try {
        const res = await fetch(`/api/ebook/${bookId}/bookmarks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cfi: s, label: currentChapter || title }),
        });
        const b = await res.json() as EbookBookmark;
        setBookmarks(prev => [...prev, b]);
      } catch { /* ignore */ }
    }
  }

  // ─── Sidebar navigation ───────────────────────────────────────────────────
  function handleNavigate(target: string) {
    renditionRef.current?.display(target);
    setSidebarOpen(false);
  }

  async function handleDeleteBookmark(b: EbookBookmark) {
    setBookmarks(prev => prev.filter(x => x.id !== b.id));
    await fetch(`/api/ebook/${bookId}/bookmarks/${b.id}`, { method: 'DELETE' });
  }

  // ─── Theme / font-size handlers ───────────────────────────────────────────
  function handleThemeChange(t: ReaderTheme) {
    setTheme(t);
    savePrefs(t, fontSizeRef.current === FONT_SIZES[fontSizeIdx] ? fontSizeIdx : fontSizeIdx);
  }

  function handleFontSize(delta: number) {
    setFontSizeIdx(prev => {
      const next = Math.max(0, Math.min(FONT_SIZES.length - 1, prev + delta));
      savePrefs(themeRef.current, next);
      return next;
    });
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  const isBookmarked = !!activeBookmark();

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ background: SHELL_BG[theme] }}
      onMouseMove={revealToolbar}
      onClick={() => setPendingSelection(null)}
    >
      {/* ── EPUB viewer ── */}
      <div className="absolute inset-0">
        <EpubView
          url={ebookUrl}
          location={cfi}
          locationChanged={handleLocationChanged}
          tocChanged={handleTocChanged}
          getRendition={handleGetRendition}
          handleTextSelected={handleTextSelected}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          epubOptions={{ allowPopups: true, flow: 'paginated', spread: 'none' } as any}
          epubViewStyles={{
            viewHolder: { width: '100%', height: '100%' },
            view:       { width: '100%', height: '100%' },
          }}
          loadingView={
            <div
              className="flex h-full items-center justify-center"
              style={{ background: SHELL_BG[theme] }}
            >
              <Loader2
                className="w-8 h-8 animate-spin"
                style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
              />
            </div>
          }
        />
      </div>

      {/* ── Toolbar ── */}
      <ReaderToolbar
        bookId={bookId}
        title={title}
        chapter={currentChapter}
        theme={theme}
        fontSizeIdx={fontSizeIdx}
        fontSizeMin={fontSizeIdx === 0}
        fontSizeMax={fontSizeIdx === FONT_SIZES.length - 1}
        isBookmarked={isBookmarked}
        sidebarOpen={sidebarOpen}
        visible={toolbarVisible || sidebarOpen}
        onThemeChange={handleThemeChange}
        onFontSizeIncrease={() => handleFontSize(+1)}
        onFontSizeDecrease={() => handleFontSize(-1)}
        onBookmarkToggle={handleBookmarkToggle}
        onSidebarToggle={() => setSidebarOpen(o => !o)}
        onPrev={() => renditionRef.current?.prev()}
        onNext={() => renditionRef.current?.next()}
      />

      {/* ── Sidebar backdrop ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-30 bg-black/25"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      <ReaderSidebar
        open={sidebarOpen}
        tab={sidebarTab}
        toc={toc}
        bookmarks={bookmarks}
        highlights={highlights}
        onTabChange={setSidebarTab}
        onNavigate={handleNavigate}
        onDeleteBookmark={handleDeleteBookmark}
        onDeleteHighlight={handleDeleteHighlight}
        onClose={() => setSidebarOpen(false)}
      />

      {/* ── Highlight color picker (appears when text is selected) ── */}
      <AnimatePresence>
        {pendingSelection && (
          <motion.div
            key="color-picker"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 bg-white rounded-2xl px-4 py-2.5 shadow-2xl ring-1 ring-black/10">
              <span className="text-xs font-medium text-gray-500 mr-0.5 whitespace-nowrap">Highlight as</span>
              {(Object.entries(HIGHLIGHT_COLORS) as [EbookHighlight['color'], string][]).map(([color, hex]) => (
                <button
                  key={color}
                  onClick={() => handleAddHighlight(color)}
                  title={color}
                  className="w-6 h-6 rounded-full hover:scale-110 transition-transform ring-1 ring-black/10"
                  style={{ background: hex }}
                />
              ))}
              <button
                onClick={() => setPendingSelection(null)}
                className="ml-1 text-gray-400 hover:text-gray-600 transition-colors text-sm"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
