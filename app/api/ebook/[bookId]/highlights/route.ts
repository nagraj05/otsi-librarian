import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { EbookHighlight } from '@/lib/types';

const VALID_COLORS = new Set(['yellow', 'green', 'blue', 'pink']);

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ bookId: string }> },
) {
  const { bookId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await sql`
    SELECT * FROM ebook_highlights
    WHERE user_id = ${userId} AND book_id = ${bookId}
    ORDER BY created_at ASC
  `;
  return NextResponse.json(rows as EbookHighlight[]);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ bookId: string }> },
) {
  const { bookId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await req.json()) as { cfi_range?: string; text?: string; color?: string };
  if (!body.cfi_range || !body.text) {
    return NextResponse.json({ error: 'cfi_range and text required' }, { status: 400 });
  }
  const color = VALID_COLORS.has(body.color ?? '') ? body.color! : 'yellow';

  const rows = await sql`
    INSERT INTO ebook_highlights (user_id, book_id, cfi_range, text, color)
    VALUES (${userId}, ${bookId}, ${body.cfi_range}, ${body.text}, ${color})
    RETURNING *
  `;
  return NextResponse.json(rows[0] as EbookHighlight, { status: 201 });
}
