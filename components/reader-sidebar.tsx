'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, BookOpen, Bookmark, Highlighter } from 'lucide-react';
import type { NavItem } from 'epubjs';
import type { EbookBookmark, EbookHighlight, SidebarTab } from '@/lib/types';

const HIGHLIGHT_HEX: Record<EbookHighlight['color'], string> = {
  yellow: '#fef08a',
  green:  '#86efac',
  blue:   '#93c5fd',
  pink:   '#f9a8d4',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

interface Props {
  open:      boolean;
  tab:       SidebarTab;
  toc:       NavItem[];
  bookmarks: EbookBookmark[];
  highlights: EbookHighlight[];
  onTabChange:       (t: SidebarTab) => void;
  onNavigate:        (target: string) => void;
  onDeleteBookmark:  (b: EbookBookmark) => void;
  onDeleteHighlight: (h: EbookHighlight) => void;
  onClose:           () => void;
}

const TABS: { key: SidebarTab; icon: React.ReactNode; label: string }[] = [
  { key: 'toc',        icon: <BookOpen    className="w-3.5 h-3.5" />, label: 'Contents'   },
  { key: 'bookmarks',  icon: <Bookmark    className="w-3.5 h-3.5" />, label: 'Bookmarks'  },
  { key: 'highlights', icon: <Highlighter className="w-3.5 h-3.5" />, label: 'Highlights' },
];

function TocList({ items, onNavigate }: { items: NavItem[]; onNavigate: (href: string) => void }) {
  return (
    <ul className="space-y-0.5">
      {items.map(item => (
        <li key={item.id ?? item.href}>
          <button
            onClick={() => onNavigate(item.href)}
            className="w-full text-left text-[13px] text-foreground/80 hover:text-foreground hover:bg-muted/60 rounded-lg px-3 py-2 transition-colors leading-snug"
          >
            {item.label.trim()}
          </button>
          {item.subitems && item.subitems.length > 0 && (
            <div className="ml-4">
              <TocList items={item.subitems} onNavigate={onNavigate} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

export function ReaderSidebar({
  open, tab, toc, bookmarks, highlights,
  onTabChange, onNavigate, onDeleteBookmark, onDeleteHighlight, onClose,
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="fixed right-0 top-0 bottom-0 z-40 w-72 sm:w-80 bg-card shadow-2xl ring-1 ring-foreground/10 flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b shrink-0">
            <p className="font-bold text-sm text-foreground">Library</p>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b shrink-0">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => onTabChange(t.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold transition-colors border-b-2 ${
                  tab === t.key
                    ? 'border-brand text-brand'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.icon}
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-3">

            {/* TOC */}
            {tab === 'toc' && (
              toc.length === 0 ? (
                <Empty label="No table of contents" />
              ) : (
                <TocList items={toc} onNavigate={onNavigate} />
              )
            )}

            {/* Bookmarks */}
            {tab === 'bookmarks' && (
              bookmarks.length === 0 ? (
                <Empty label="No bookmarks yet" sub="Use the bookmark icon in the toolbar to save your spot." />
              ) : (
                <ul className="space-y-1.5">
                  {bookmarks.map(b => (
                    <li key={b.id} className="group flex items-start gap-2 rounded-xl hover:bg-muted/50 px-2 py-2 transition-colors">
                      <button
                        onClick={() => onNavigate(b.cfi)}
                        className="flex-1 min-w-0 text-left"
                      >
                        <p className="text-[13px] font-semibold text-foreground leading-snug line-clamp-2">
                          {b.label ?? 'Bookmark'}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(b.created_at)}</p>
                      </button>
                      <button
                        onClick={() => onDeleteBookmark(b)}
                        className="shrink-0 p-1 rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )
            )}

            {/* Highlights */}
            {tab === 'highlights' && (
              highlights.length === 0 ? (
                <Empty label="No highlights yet" sub="Select text while reading to add a highlight." />
              ) : (
                <ul className="space-y-1.5">
                  {highlights.map(h => (
                    <li key={h.id} className="group flex items-start gap-2 rounded-xl hover:bg-muted/50 px-2 py-2 transition-colors">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 ring-1 ring-black/10"
                        style={{ background: HIGHLIGHT_HEX[h.color] }}
                      />
                      <button
                        onClick={() => onNavigate(h.cfi_range)}
                        className="flex-1 min-w-0 text-left"
                      >
                        <p className="text-[13px] text-foreground leading-snug line-clamp-3">
                          &ldquo;{h.text}&rdquo;
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(h.created_at)}</p>
                      </button>
                      <button
                        onClick={() => onDeleteHighlight(h)}
                        className="shrink-0 p-1 rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Empty({ label, sub }: { label: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-40 text-center px-4 gap-2">
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      {sub && <p className="text-xs text-muted-foreground/70">{sub}</p>}
    </div>
  );
}
