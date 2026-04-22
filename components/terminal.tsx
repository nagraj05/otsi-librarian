'use client';

import { useState, useRef, useEffect, useCallback, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Terminal as TerminalIcon, X } from 'lucide-react';

type LineType = 'input' | 'output' | 'error' | 'success' | 'info' | 'dim';

interface Line {
  id: number;
  type: LineType;
  text: string;
}

interface CatalogBook {
  book_id: string;
  title: string;
  authors: string[];
  publisher: string | null;
  published_date: string | null;
  page_count: number | null;
  isbn: string | null;
  rating: number | null;
  description: string | null;
  borrowed_by: string | null;
}

let lineId = 0;
const mkLine = (text: string, type: LineType = 'output'): Line => ({ id: lineId++, type, text });

const WELCOME: Line[] = [
  mkLine(''),
  mkLine('  ╔══════════════════════════════════════════╗', 'info'),
  mkLine('  ║      Welcome to OTSI Library Terminal    ║', 'info'),
  mkLine('  ║   Type  help  to see available commands  ║', 'info'),
  mkLine('  ╚══════════════════════════════════════════╝', 'info'),
  mkLine(''),
];

const HELP: Line[] = [
  mkLine(''),
  mkLine('  COMMAND              DESCRIPTION', 'info'),
  mkLine('  ───────────────────────────────────────────', 'dim'),
  mkLine('  ls                   List current directory'),
  mkLine('  ls books             List all library books'),
  mkLine('  cd books             Enter the books directory'),
  mkLine('  cd ..                Go back to home'),
  mkLine('  cat <book name>      Show book details'),
  mkLine('  pwd                  Print working directory'),
  mkLine('  whoami               Print current user'),
  mkLine('  clear                Clear the terminal'),
  mkLine('  message "<text>"     Send a message to the admin'),
  mkLine('  exit                 Close the terminal'),
  mkLine(''),
  mkLine('  Tip: try  cd books  then  ls  to see the catalog.', 'dim'),
  mkLine(''),
];

function lineColor(type: LineType): string {
  switch (type) {
    case 'input':   return 'text-emerald-400';
    case 'error':   return 'text-red-400';
    case 'success': return 'text-emerald-400';
    case 'info':    return 'text-sky-400';
    case 'dim':     return 'text-slate-500';
    default:        return 'text-slate-300';
  }
}

export function Terminal() {
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const [isOpen, setIsOpen]   = useState(false);
  const [lines, setLines]     = useState<Line[]>(WELCOME);
  const [input, setInput]     = useState('');
  const [cwd, setCwd]         = useState('~');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [books, setBooks]     = useState<CatalogBook[]>([]);

  const inputRef  = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const openTerminal = useCallback(() => {
    setLines([...WELCOME]);
    setInput('');
    setCwd('~');
    setHistory([]);
    setHistoryIdx(-1);
    setBooks([]);
    setIsOpen(true);
  }, []);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const push = useCallback((...newLines: Line[]) => {
    setLines(prev => [...prev, ...newLines]);
  }, []);

  const fetchBooks = useCallback(async (): Promise<CatalogBook[]> => {
    try {
      const res = await fetch('/api/catalog');
      if (!res.ok) return [];
      const data = await res.json();
      setBooks(data.books);
      return data.books as CatalogBook[];
    } catch {
      return [];
    }
  }, []);

  const runCommand = useCallback(async (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;

    setHistory(prev => [trimmed, ...prev.slice(0, 49)]);
    setHistoryIdx(-1);

    push(mkLine(`guest@otsi:${cwd}$ ${trimmed}`, 'input'));

    const [cmd, ...args] = trimmed.split(/\s+/);

    switch (cmd.toLowerCase()) {

      case 'help':
        push(...HELP);
        break;

      case 'clear':
        setLines([]);
        break;

      case 'pwd':
        push(mkLine(cwd === '~' ? '/home/guest' : '/home/guest/books'));
        break;

      case 'whoami':
        push(mkLine('guest'));
        break;

      case 'exit':
        setIsOpen(false);
        break;

      case 'cd': {
        const target = args[0] ?? '~';
        if (target === 'books' || target === './books' || target === 'books/') {
          await fetchBooks();
          setCwd('~/books');
        } else if (target === '..' || target === '~' || target === '/') {
          setCwd('~');
        } else {
          push(mkLine(`bash: cd: ${target}: No such file or directory`, 'error'));
        }
        break;
      }

      case 'ls': {
        const lsTarget = args[0];
        const inBooks = cwd === '~/books' || lsTarget === 'books' || lsTarget === 'books/';

        if (!inBooks) {
          push(mkLine('books/', 'success'));
          break;
        }

        push(mkLine('Loading...', 'dim'));
        const catalog = await fetchBooks();
        setLines(prev => prev.filter(l => l.text !== 'Loading...'));

        if (catalog.length === 0) {
          push(
            mkLine(''),
            mkLine('  (no books in the library yet)', 'dim'),
            mkLine('  Ask the admin to add some!', 'dim'),
            mkLine(''),
          );
          break;
        }

        const available = catalog.filter(b => !b.borrowed_by).length;
        push(
          mkLine(''),
          mkLine(`  ${catalog.length} book${catalog.length !== 1 ? 's' : ''} in library  ·  ${available} available`, 'dim'),
          mkLine(''),
          mkLine('  TITLE                                    STATUS', 'info'),
          mkLine('  ────────────────────────────────────────────────────────', 'dim'),
          ...catalog.map(b => {
            const title = b.title.length > 40 ? b.title.slice(0, 38) + '…' : b.title;
            const status = b.borrowed_by
              ? `✗ borrowed by ${b.borrowed_by}`
              : '✓ available';
            return mkLine(
              `  ${title.padEnd(41)}${status}`,
              b.borrowed_by ? 'error' : 'success',
            );
          }),
          mkLine(''),
          mkLine('  Tip: cat <book name> to see full details', 'dim'),
          mkLine(''),
        );
        break;
      }

      case 'cat': {
        if (!args.length) {
          push(mkLine('Usage: cat <book name>', 'error'));
          break;
        }
        const query = args.join(' ').toLowerCase().replace(/['"]/g, '');
        const catalog = books.length ? books : await fetchBooks();
        const book = catalog.find(b => b.title.toLowerCase().includes(query));

        if (!book) {
          push(
            mkLine(`cat: "${args.join(' ')}": No matching book in catalog`, 'error'),
            mkLine('  Try  ls books  to see all titles.', 'dim'),
          );
          break;
        }

        const rating = book.rating
          ? '★'.repeat(Math.floor(Number(book.rating))) +
            (Number(book.rating) % 1 >= 0.5 ? '½' : '') +
            `  (${Number(book.rating).toFixed(1)})`
          : '—';

        push(
          mkLine(''),
          mkLine(`  ╔══ ${book.title} ══╗`, 'info'),
          mkLine(`  Author     : ${book.authors?.join(', ') || '—'}`),
          mkLine(`  Publisher  : ${book.publisher || '—'}`),
          mkLine(`  Published  : ${book.published_date || '—'}`),
          mkLine(`  Pages      : ${book.page_count || '—'}`),
          mkLine(`  ISBN       : ${book.isbn || '—'}`),
          mkLine(`  Rating     : ${rating}`),
          mkLine(
            `  Status     : ${book.borrowed_by ? `Currently borrowed by ${book.borrowed_by}` : 'Available — you can borrow it!'}`,
            book.borrowed_by ? 'error' : 'success',
          ),
          mkLine(''),
          book.description
            ? mkLine(`  "${book.description.slice(0, 160)}${book.description.length > 160 ? '…' : ''}"`, 'dim')
            : mkLine('  (no description available)', 'dim'),
          mkLine(''),
        );
        break;
      }

      case 'message': {
        const msgMatch = trimmed.match(/^message\s+"(.+)"$/i)
                      ?? trimmed.match(/^message\s+'(.+)'$/i);
        const msgText = msgMatch ? msgMatch[1] : args.join(' ');

        if (!msgText.trim()) {
          push(
            mkLine('Usage: message "<your message>"', 'error'),
            mkLine('  e.g. message "Hi I want to borrow Atomic Habits"', 'dim'),
          );
          break;
        }

        push(mkLine('  Sending…', 'dim'));
        try {
          const res = await fetch('/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msgText }),
          });
          setLines(prev => prev.filter(l => l.text !== '  Sending…'));

          if (res.ok) {
            push(
              mkLine(''),
              mkLine('  ✓ Message sent to admin via WhatsApp!', 'success'),
              mkLine('  They will get back to you soon.', 'dim'),
              mkLine(''),
            );
          } else {
            const data = await res.json();
            push(mkLine(`  ✗ ${data.error || 'Failed to send. Try again later.'}`, 'error'));
          }
        } catch {
          setLines(prev => prev.filter(l => l.text !== '  Sending…'));
          push(mkLine('  ✗ Network error. Try again later.', 'error'));
        }
        break;
      }

      default:
        push(
          mkLine(`bash: ${cmd}: command not found`, 'error'),
          mkLine('  Type  help  to see available commands.', 'dim'),
        );
    }
  }, [cwd, books, push, fetchBooks]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      runCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const idx = Math.min(historyIdx + 1, history.length - 1);
      setHistoryIdx(idx);
      setInput(history[idx] ?? '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const idx = Math.max(historyIdx - 1, -1);
      setHistoryIdx(idx);
      setInput(idx === -1 ? '' : history[idx]);
    }
  }

  const prompt = `guest@otsi:${cwd}$`;

  return (
    <>
      {/* Trigger */}
      <button
        onClick={openTerminal}
        title="Open terminal"
        className="inline-flex items-center gap-1.5 text-[13px] cursor-pointer font-mono font-semibold text-muted-foreground hover:text-brand hover:bg-brand-muted px-3 py-1.5 rounded-xl transition-colors border border-transparent hover:border-brand-muted/60"
      >
        <TerminalIcon style={{ width: 14, height: 14 }} />
        <span className="hidden sm:inline">terminal</span>
      </button>

      {/* Modal — portalled to document.body so backdrop-blur on header doesn't trap fixed positioning */}
      {mounted && isOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-10">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Terminal window */}
          <div
            className="relative z-10 w-full max-w-3xl flex flex-col  rounded-2xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.6)] border border-slate-700/50 animate-in fade-in zoom-in-95 duration-200"
            style={{ background: '#0d1117', height: 'min(65vh, 600px)' }}
            onClick={() => inputRef.current?.focus()}
          >
            {/* Title bar */}
            <div
              className="flex items-center justify-between px-4 py-2.5 shrink-0 border-b border-slate-700/50"
              style={{ background: '#161b22' }}
            >
              {/* Traffic lights */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 transition-colors"
                />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
              </div>

              {/* Title */}
              <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
                <TerminalIcon style={{ width: 12, height: 12 }} />
                <span>otsi-library — bash</span>
              </div>

              {/* Close */}
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>

            {/* Output */}
            <div className="flex-1 overflow-y-auto px-4 py-3 font-mono text-sm leading-relaxed">
              {lines.map(line => (
                <div key={line.id} className={`whitespace-pre-wrap break-all ${lineColor(line.type)}`}>
                  {line.text || '\u00A0'}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input row */}
            <div
              className="flex items-center gap-2 px-4 py-3 border-t border-slate-700/50 shrink-0"
              style={{ background: '#0d1117' }}
            >
              <span className="font-mono text-sm text-emerald-400 shrink-0 select-none">
                {prompt}&nbsp;
              </span>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent font-mono text-sm text-slate-200 outline-none caret-emerald-400 placeholder:text-slate-600"
                placeholder="type a command…"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
