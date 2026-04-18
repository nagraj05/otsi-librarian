import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
    const rows = await sql`
      SELECT
        b.id, b.book_id, b.title, b.authors, b.thumbnail,
        b.description, b.publisher, b.published_date,
        b.page_count, b.categories, b.isbn, b.rating, b.added_at,
        br.borrower_name AS borrowed_by
      FROM books b
      LEFT JOIN borrows br ON b.book_id = br.book_id AND br.returned_at IS NULL
      ORDER BY b.title ASC
    `;
    return NextResponse.json({ books: rows });
  } catch {
    return NextResponse.json({ books: [] });
  }
}
