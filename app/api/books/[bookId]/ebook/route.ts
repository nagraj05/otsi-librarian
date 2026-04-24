import { auth } from '@clerk/nextjs/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { del, type PutBlobResult } from '@vercel/blob';
import { NextResponse } from 'next/server';
import sql from '@/lib/db';

async function checkAdmin(userId: string): Promise<boolean> {
  const rows = await sql`SELECT id FROM users WHERE id = ${userId} AND role = 'admin'`;
  return rows.length > 0;
}

// Vercel Blob client-upload token endpoint
export async function POST(
  request: Request,
  { params }: { params: Promise<{ bookId: string }> },
) {
  const { bookId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json()) as HandleUploadBody;

  const jsonResponse = await handleUpload({
    body,
    request,
    onBeforeGenerateToken: async () => {
      if (!(await checkAdmin(userId))) throw new Error('Admin only');
      return {
        allowedContentTypes: ['application/epub+zip', 'application/octet-stream'],
        maximumSizeInBytes: 50 * 1024 * 1024,
        tokenPayload: JSON.stringify({ bookId }),
      };
    },
    onUploadCompleted: async ({ blob, tokenPayload }: { blob: PutBlobResult; tokenPayload?: string | null }) => {
      // Called by Vercel webhook in production; confirm route handles dev
      const { bookId: bid } = JSON.parse(tokenPayload ?? '{}');
      await sql`UPDATE books SET ebook_url = ${blob.url} WHERE book_id = ${bid}`;
    },
  });

  return NextResponse.json(jsonResponse);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ bookId: string }> },
) {
  const { bookId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await checkAdmin(userId))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const rows = await sql`SELECT ebook_url FROM books WHERE book_id = ${bookId}`;
  const book = rows[0] as { ebook_url: string | null } | undefined;
  if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 });

  if (book.ebook_url) {
    await del(book.ebook_url);
  }
  await sql`UPDATE books SET ebook_url = NULL WHERE book_id = ${bookId}`;

  return NextResponse.json({ ok: true });
}
