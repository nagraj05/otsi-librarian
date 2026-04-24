import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import sql from '@/lib/db';

// Called by the client after a successful upload to persist the blob URL.
// Needed in dev where Vercel can't reach localhost to fire onUploadCompleted.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ bookId: string }> },
) {
  const { bookId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await sql`SELECT id FROM users WHERE id = ${userId} AND role = 'admin'`;
  if (rows.length === 0) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = (await request.json()) as { url?: string };
  if (!body.url || !body.url.startsWith('https://')) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  await sql`UPDATE books SET ebook_url = ${body.url} WHERE book_id = ${bookId}`;
  return NextResponse.json({ ok: true });
}
