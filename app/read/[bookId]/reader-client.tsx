'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EpubView } from 'react-reader';
import type { Rendition, Contents, NavItem } from 'epubjs';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import type { EbookBookmark, EbookHighlight, SidebarTab } from '@/lib/types';
import { ReaderToolbar } from '@/components/reader-toolbar';
import { ReaderSidebar } from '@/components/reader-sidebar';

const HIGHLIGHT_COLORS: Record<EbookHighlight['color'], string> = {
  yellow: '#fef08a',
  green:  '#86efac',
  blue:   '#93c5fd',
  pink:   '#f9a8d4',
};

const SHELL_BG = '#111827';
const MUTED    = '#6b7280';

const FONT_SIZES = [14, 16, 18, 20, 22];

// Dark-mode CSS injected directly into the live epub.js iframe.
// epub.js caches rendered pages so themes.select() alone won't update
// the currently visible page — we inject this style element ourselves.
const DARK_CSS = `
  body { background: #1f2937 !important; color: #e5e7eb !important; line-height: 1.85 !important; font-family: Georgia, "Times New Roman", serif !important; padding: 0 4% !important; }
  a, a:link, a:visited { color: #e5e7eb !important; }
  p, span, div, li, dt, dd, td, th, caption, blockquote, pre, code { color: inherit !important; background: transparent !important; }
  h1, h2, h3, h4, h5, h6, strong, b, em, i, small, sub, sup { color: inherit !important; }
`;

function injectDarkCSS(rendition: Rendition) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contents: any[] = (rendition as any).getContents?.() ?? [];
    contents.forEach((c: any) => {
      const doc: Document | undefined = c?.document;
      if (!doc?.head) return;
      let el = doc.getElementById('otsi-theme') as HTMLStyleElement | null;
      if (!el) {
        el = doc.createElement('style') as HTMLStyleElement;
        el.id = 'otsi-theme';
        doc.head.appendChild(el);
      }
      el.textContent = DARK_CSS;
    });
  } catch { /* sandboxed iframe — themes.select() still covers new pages */ }
}

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

  const [cfi, setCfi] = useState<string | number | null>(initialCfi ?? null);

  const [toc,            setToc]            = useState<NavItem[]>([]);
  const [currentChapter, setCurrentChapter] = useState('');
  const tocRef = useRef<NavItem[]>([]);

  const [fontSizeIdx, setFontSizeIdx] = useState(2);
  const fontSizeRef = useRef(FONT_SIZES[2]);

  const [sidebarOpen, setSidebarOpen]     = useState(false);
  const [sidebarTab,  setSidebarTab]      = useState<SidebarTab>('toc');
  const [pendingSelection, setPendingSelection] =
    useState<{ cfi: string; text: string } | null>(null);

  const [pageInfo, setPageInfo] =
    useState<{ page: number; total: number; pct: number | null } | null>(null);

  const [bookmarks,  setBookmarks]  = useState<EbookBookmark[]>(initialBookmarks);
  const [highlights, setHighlights] = useState<EbookHighlight[]>(initialHighlights);

  const renditionRef      = useRef<Rendition | null>(null);
  const saveTimerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locationsReadyRef = useRef(false);

  // ─── Load font-size pref from localStorage ───────────────────────────────
  useEffect(() => {
    const raw = localStorage.getItem('epub-prefs');
    if (!raw) return;
    try {
      const p = JSON.parse(raw) as { fontSizeIdx?: number };
      if (typeof p.fontSizeIdx === 'number' && p.fontSizeIdx >= 0 && p.fontSizeIdx < FONT_SIZES.length) {
        setFontSizeIdx(p.fontSizeIdx);
        fontSizeRef.current = FONT_SIZES[p.fontSizeIdx];
      }
    } catch { /* ignore bad JSON */ }
  }, []);

  // ─── Keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') router.push(`/books/${bookId}`);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [bookId, router]);

  // ─── Font size ────────────────────────────────────────────────────────────
  useEffect(() => {
    renditionRef.current?.themes.fontSize(`${FONT_SIZES[fontSizeIdx]}px`);
    fontSizeRef.current = FONT_SIZES[fontSizeIdx];
  }, [fontSizeIdx]);

  // ─── epub.js callbacks ────────────────────────────────────────────────────
  function handleGetRendition(rendition: Rendition) {
    renditionRef.current = rendition;

    rendition.themes.register('dark', {
      body: {
        background:    '#1f2937 !important',
        color:         '#e5e7eb !important',
        'line-height': '1.85 !important',
        'font-family': 'Georgia, "Times New Roman", serif !important',
        'padding':     '0 4% !important',
      },
      'a, a:link, a:visited': { color: '#e5e7eb !important' },
      'p, span, div, li, dt, dd, td, th, caption, blockquote, pre, code':
        { color: 'inherit !important', background: 'transparent !important' },
      'h1, h2, h3, h4, h5, h6, strong, b, em, i, small, sub, sup':
        { color: 'inherit !important' },
    });
    rendition.themes.select('dark');
    rendition.themes.fontSize(`${fontSizeRef.current}px`);
    injectDarkCSS(rendition);

    initialHighlights.forEach(h => {
      rendition.annotations.highlight(h.cfi_range, {}, undefined, '', {
        fill: HIGHLIGHT_COLORS[h.color],
        'fill-opacity': '0.45',
      });
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const book = (rendition as any).book;
    if (book?.ready) {
      book.ready.then(() => {
        book.locations.generate(1600).then(() => {
          locationsReadyRef.current = true;
          const loc = renditionRef.current?.location;
          if (loc?.start) {
            setPageInfo(prev => prev
              ? { ...prev, pct: Math.round(loc.start.percentage * 100) }
              : null,
            );
          }
        });
      });
    }
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

    const loc = renditionRef.current?.location;
    const href = loc?.start?.href ?? '';
    if (href) {
      const chapter = findChapter(tocRef.current, href);
      if (chapter) setCurrentChapter(chapter);
    }

    if (loc?.start?.displayed) {
      setPageInfo({
        page:  loc.start.displayed.page,
        total: loc.start.displayed.total,
        pct:   locationsReadyRef.current ? Math.round(loc.start.percentage * 100) : null,
      });
    }

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

  function handleNavigate(target: string) {
    renditionRef.current?.display(target);
    setSidebarOpen(false);
  }

  async function handleDeleteBookmark(b: EbookBookmark) {
    setBookmarks(prev => prev.filter(x => x.id !== b.id));
    await fetch(`/api/ebook/${bookId}/bookmarks/${b.id}`, { method: 'DELETE' });
  }

  function handleFontSize(delta: number) {
    setFontSizeIdx(prev => {
      const next = Math.max(0, Math.min(FONT_SIZES.length - 1, prev + delta));
      localStorage.setItem('epub-prefs', JSON.stringify({ fontSizeIdx: next }));
      return next;
    });
  }

  const isBookmarked = !!activeBookmark();

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ background: SHELL_BG }}
      onClick={() => setPendingSelection(null)}
    >
      {/* ── EPUB viewer ── */}
      <div className="absolute inset-x-0 top-14 bottom-8">
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
            <div className="flex h-full items-center justify-center" style={{ background: SHELL_BG }}>
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: MUTED }} />
            </div>
          }
        />
      </div>

      {/* ── Toolbar ── */}
      <ReaderToolbar
        bookId={bookId}
        title={title}
        chapter={currentChapter}
        fontSizeIdx={fontSizeIdx}
        fontSizeMin={fontSizeIdx === 0}
        fontSizeMax={fontSizeIdx === FONT_SIZES.length - 1}
        isBookmarked={isBookmarked}
        sidebarOpen={sidebarOpen}
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
            className="fixed inset-0 z-30 bg-black/40"
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

      {/* ── Highlight color picker ── */}
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
            <div className="flex items-center gap-2.5 bg-gray-800 border border-white/10 rounded-2xl px-4 py-2.5 shadow-2xl">
              <span className="text-xs font-medium text-gray-400 mr-0.5 whitespace-nowrap">Highlight as</span>
              {(Object.entries(HIGHLIGHT_COLORS) as [EbookHighlight['color'], string][]).map(([color, hex]) => (
                <button
                  key={color}
                  onClick={() => handleAddHighlight(color)}
                  title={color}
                  className="w-6 h-6 rounded-full hover:scale-110 transition-transform ring-1 ring-white/20"
                  style={{ background: hex }}
                />
              ))}
              <button
                onClick={() => setPendingSelection(null)}
                className="ml-1 text-gray-500 hover:text-gray-300 transition-colors text-sm"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bottom status bar ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-20 h-8 flex items-center px-4 gap-3"
        style={{ background: SHELL_BG }}
        onClick={e => e.stopPropagation()}
      >
        {pageInfo?.pct !== null && pageInfo?.pct !== undefined && (
          <div
            className="absolute top-0 left-0 h-[2px] bg-brand/60 transition-all duration-500"
            style={{ width: `${pageInfo.pct}%` }}
          />
        )}

        {pageInfo ? (
          <>
            <span className="text-[11px] font-medium tabular-nums" style={{ color: MUTED }}>
              Page {pageInfo.page} of {pageInfo.total}
            </span>
            {pageInfo.pct !== null && (
              <>
                <span className="text-[11px]" style={{ color: MUTED }}>·</span>
                <span className="text-[11px] font-semibold tabular-nums" style={{ color: MUTED }}>
                  {pageInfo.pct}%
                </span>
              </>
            )}
          </>
        ) : (
          <span className="text-[11px]" style={{ color: MUTED }}>{title}</span>
        )}
      </div>
    </div>
  );
}
