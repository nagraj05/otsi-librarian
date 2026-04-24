'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Search, Loader2, BookOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { GoogleBook } from '@/lib/types';
import Image from 'next/image';

interface BookSearchProps {
  onSelect: (book: GoogleBook) => void;
  selected: GoogleBook | null;
}

const DEBOUNCE_MS = 600;
const MIN_CHARS   = 2;

export function BookSearch({ onSelect, selected }: BookSearchProps) {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState<GoogleBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [open,    setOpen]    = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Cancel pending timer + in-flight request on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const search = useCallback((q: string) => {
    // Clear any queued search
    if (timerRef.current) clearTimeout(timerRef.current);

    if (q.length < MIN_CHARS) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      abortRef.current?.abort();
      return;
    }

    timerRef.current = setTimeout(async () => {
      // Cancel the previous in-flight request before starting a new one
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setLoading(true);
      try {
        const res  = await fetch(
          `/api/books/search?q=${encodeURIComponent(q)}`,
          { signal: abortRef.current.signal },
        );
        const data = await res.json();
        setResults(data.books ?? []);
        setOpen(true);
      } catch (err) {
        // AbortError is expected when a newer request supersedes this one
        if ((err as DOMException).name !== 'AbortError') {
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
  }, []);

  if (selected) {
    return (
      <div className="flex gap-3 items-start p-3 rounded-xl border border-brand-muted/60 bg-brand-muted">
        {selected.thumbnail ? (
          <Image
            src={selected.thumbnail}
            alt={selected.title}
            width={48}
            height={64}
            className="rounded-md object-cover shrink-0 shadow-sm"
          />
        ) : (
          <div className="w-12 h-16 rounded-md bg-brand/20 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-brand" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground line-clamp-2">{selected.title}</p>
          {selected.authors.length > 0 && (
            <p className="text-xs text-brand mt-0.5">{selected.authors.join(', ')}</p>
          )}
          {selected.publishedDate && (
            <p className="text-xs text-brand/70 mt-0.5">{selected.publishedDate}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onSelect(null as unknown as GoogleBook)}
          className="text-xs text-brand hover:text-brand/80 shrink-0"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        {loading ? (
          <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
        ) : (
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        )}
        <Input
          placeholder="Search books by title or author…"
          className="pl-9"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            search(e.target.value);
          }}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          onFocus={() => results.length > 0 && setOpen(true)}
          autoComplete="off"
        />
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-xl max-h-72 overflow-y-auto">
          {results.map(book => (
            <button
              key={book.id}
              type="button"
              className="w-full flex gap-3 items-center px-3 py-2.5 hover:bg-brand-muted transition-colors text-left"
              onMouseDown={() => {
                onSelect(book);
                setQuery('');
                setOpen(false);
                setResults([]);
              }}
            >
              {book.thumbnail ? (
                <Image
                  src={book.thumbnail}
                  alt={book.title}
                  width={32}
                  height={42}
                  className="rounded object-cover shrink-0"
                />
              ) : (
                <div className="w-8 h-10 rounded bg-brand-muted flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4 text-brand" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{book.title}</p>
                {book.authors.length > 0 && (
                  <p className="text-xs text-muted-foreground truncate">{book.authors.join(', ')}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {open && results.length === 0 && !loading && query.length >= MIN_CHARS && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-xl p-4 text-center text-sm text-muted-foreground">
          No books found for &ldquo;{query}&rdquo;
        </div>
      )}
    </div>
  );
}
