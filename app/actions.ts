'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import sql from '@/lib/db';
import { GoogleBook } from '@/lib/types';

export async function setupDatabase() {
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
}

export async function addBorrow(data: {
  borrower_name: string;
  book: GoogleBook;
  borrowed_at: string;
  notes?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  await sql`
    INSERT INTO borrows (
      borrower_name, book_id, book_title, book_authors,
      book_thumbnail, book_description, book_publisher, book_published_date,
      book_page_count, book_categories, book_isbn, book_rating,
      borrowed_at, notes
    ) VALUES (
      ${data.borrower_name},
      ${data.book.id},
      ${data.book.title},
      ${data.book.authors},
      ${data.book.thumbnail},
      ${data.book.description},
      ${data.book.publisher},
      ${data.book.publishedDate},
      ${data.book.pageCount},
      ${data.book.categories},
      ${data.book.isbn},
      ${data.book.rating},
      ${data.borrowed_at},
      ${data.notes ?? null}
    )
  `;

  revalidatePath('/');
  revalidatePath('/admin');
}

export async function returnBook(id: number) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  await sql`UPDATE borrows SET returned_at = NOW() WHERE id = ${id}`;

  revalidatePath('/');
  revalidatePath('/admin');
}

export async function deleteBorrow(id: number) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  await sql`DELETE FROM borrows WHERE id = ${id}`;

  revalidatePath('/');
  revalidatePath('/admin');
}
