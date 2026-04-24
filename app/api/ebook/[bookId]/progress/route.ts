import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ bookId: string }> },
) {
  const { bookId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await sql`
    SELECT cfi FROM ebook_progress
    WHERE user_id = ${userId} AND book_id = ${bookId}
  `;
  return NextResponse.json(rows[0] ? { cfi: (rows[0] as { cfi: string }).cfi } : null);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ bookId: string }> },
) {
  const { bookId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await req.json()) as { cfi?: string };
  if (!body.cfi) return NextResponse.json({ error: 'cfi required' }, { status: 400 });

  await sql`
    INSERT INTO ebook_progress (user_id, book_id, cfi, updated_at)
    VALUES (${userId}, ${bookId}, ${body.cfi}, NOW())
    ON CONFLICT (user_id, book_id)
    DO UPDATE SET cfi = EXCLUDED.cfi, updated_at = NOW()
  `;
  return NextResponse.json({ ok: true });
}
