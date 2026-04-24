import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { EbookBookmark } from '@/lib/types';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ bookId: string }> },
) {
  const { bookId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await sql`
    SELECT * FROM ebook_bookmarks
    WHERE user_id = ${userId} AND book_id = ${bookId}
    ORDER BY created_at ASC
  `;
  return NextResponse.json(rows as EbookBookmark[]);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ bookId: string }> },
) {
  const { bookId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await req.json()) as { cfi?: string; label?: string };
  if (!body.cfi) return NextResponse.json({ error: 'cfi required' }, { status: 400 });

  const rows = await sql`
    INSERT INTO ebook_bookmarks (user_id, book_id, cfi, label)
    VALUES (${userId}, ${bookId}, ${body.cfi}, ${body.label ?? null})
    RETURNING *
  `;
  return NextResponse.json(rows[0] as EbookBookmark, { status: 201 });
}
