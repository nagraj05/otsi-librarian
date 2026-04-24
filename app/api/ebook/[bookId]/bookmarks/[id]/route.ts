import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ bookId: string; id: string }> },
) {
  const { bookId, id } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await sql`
    DELETE FROM ebook_bookmarks
    WHERE id = ${Number(id)} AND user_id = ${userId} AND book_id = ${bookId}
  `;
  return NextResponse.json({ ok: true });
}
