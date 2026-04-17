import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  await sql`
    CREATE TABLE IF NOT EXISTS borrows (
      id SERIAL PRIMARY KEY,
      borrower_name VARCHAR(255) NOT NULL,
      book_id VARCHAR(255) NOT NULL,
      book_title VARCHAR(500) NOT NULL,
      book_authors TEXT[] DEFAULT '{}',
      book_thumbnail TEXT,
      book_description TEXT,
      book_publisher VARCHAR(255),
      book_published_date VARCHAR(100),
      book_page_count INTEGER,
      book_categories TEXT[] DEFAULT '{}',
      book_isbn VARCHAR(100),
      book_rating DECIMAL(3,1),
      borrowed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      returned_at TIMESTAMPTZ,
      notes TEXT
    )
  `;
  return NextResponse.json({ ok: true, message: 'Database ready' });
}
