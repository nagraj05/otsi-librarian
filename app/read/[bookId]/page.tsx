import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import sql from '@/lib/db';
import { EbookBookmark, EbookHighlight } from '@/lib/types';
import { ReaderClient } from './reader-client';

async function getBook(bookId: string) {
  const rows = await sql`
    SELECT book_id, title, authors, thumbnail, ebook_url
    FROM books
    WHERE book_id = ${bookId}
  `;
  return rows[0] as {
    book_id: string;
    title: string;
    authors: string[];
    thumbnail: string | null;
    ebook_url: string | null;
  } | undefined;
}

async function getProgress(userId: string, bookId: string) {
  const rows = await sql`
    SELECT cfi FROM ebook_progress
    WHERE user_id = ${userId} AND book_id = ${bookId}
  `;
  return rows[0] ? (rows[0] as { cfi: string }).cfi : null;
}

async function getBookmarks(userId: string, bookId: string) {
  const rows = await sql`
    SELECT * FROM ebook_bookmarks
    WHERE user_id = ${userId} AND book_id = ${bookId}
    ORDER BY created_at ASC
  `;
  return rows as EbookBookmark[];
}

async function getHighlights(userId: string, bookId: string) {
  const rows = await sql`
    SELECT * FROM ebook_highlights
    WHERE user_id = ${userId} AND book_id = ${bookId}
    ORDER BY created_at ASC
  `;
  return rows as EbookHighlight[];
}

export default async function ReaderPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = await params;
  const { userId } = await auth();
  if (!userId) redirect('/');

  const book = await getBook(bookId);
  if (!book) notFound();
  if (!book.ebook_url) redirect(`/books/${bookId}`);

  const [initialCfi, initialBookmarks, initialHighlights] = await Promise.all([
    getProgress(userId, bookId),
    getBookmarks(userId, bookId),
    getHighlights(userId, bookId),
  ]);

  return (
    <ReaderClient
      bookId={bookId}
      ebookUrl={book.ebook_url}
      title={book.title}
      authors={book.authors}
      initialCfi={initialCfi}
      initialBookmarks={initialBookmarks}
      initialHighlights={initialHighlights}
    />
  );
}
