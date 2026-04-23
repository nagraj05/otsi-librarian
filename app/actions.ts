'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import sql from '@/lib/db';
import { GoogleBook } from '@/lib/types';

export async function markAllRead() {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  await sql`UPDATE notifications SET read = TRUE WHERE user_id = ${userId}`;
}

export async function markOneRead(notificationId: number) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  await sql`UPDATE notifications SET read = TRUE WHERE id = ${notificationId} AND user_id = ${userId}`;
}

export async function requestBook(bookId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  // get user name + check for duplicate active/pending request
  const [userRow, existingRow, bookRow] = await Promise.all([
    sql`SELECT name FROM users WHERE id = ${userId}`,
    sql`SELECT id FROM borrows WHERE book_id = ${bookId} AND user_id = ${userId} AND status IN ('pending','active')`,
    sql`SELECT title, authors, thumbnail, description, publisher, published_date, page_count, categories, isbn, rating FROM books WHERE book_id = ${bookId}`,
  ]);

  if (!userRow[0]) throw new Error('User not found');
  if (existingRow[0]) throw new Error('You already have a pending or active request for this book');
  if (!bookRow[0]) throw new Error('Book not found');

  const user = userRow[0] as { name: string };
  const book = bookRow[0] as {
    title: string; authors: string[]; thumbnail: string | null;
    description: string | null; publisher: string | null;
    published_date: string | null; page_count: number | null;
    categories: string[] | null; isbn: string | null; rating: number | null;
  };

  await sql`
    INSERT INTO borrows (
      user_id, borrower_name, book_id, book_title, book_authors,
      book_thumbnail, book_description, book_publisher, book_published_date,
      book_page_count, book_categories, book_isbn, book_rating, status
    ) VALUES (
      ${userId}, ${user.name}, ${bookId}, ${book.title}, ${book.authors},
      ${book.thumbnail}, ${book.description}, ${book.publisher}, ${book.published_date},
      ${book.page_count}, ${book.categories}, ${book.isbn}, ${book.rating}, 'pending'
    )
  `;

  // notify admin
  const adminRow = await sql`SELECT id FROM users WHERE role = 'admin' LIMIT 1`;
  if (adminRow[0]) {
    const admin = adminRow[0] as { id: string };
    await sql`
      INSERT INTO notifications (user_id, type, message)
      VALUES (${admin.id}, 'new_request', ${`${user.name} requested "${book.title}"`})
    `;
  }

  revalidatePath('/catalog');
  revalidatePath('/admin');
}

export async function addBook(book: GoogleBook) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  await sql`
    INSERT INTO books (book_id, title, authors, thumbnail, description, publisher, published_date, page_count, categories, isbn, rating)
    VALUES (
      ${book.id}, ${book.title}, ${book.authors}, ${book.thumbnail},
      ${book.description}, ${book.publisher}, ${book.publishedDate},
      ${book.pageCount}, ${book.categories}, ${book.isbn}, ${book.rating}
    )
    ON CONFLICT (book_id) DO NOTHING
  `;

  revalidatePath('/admin');
}

export async function removeBook(bookId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  await sql`DELETE FROM books WHERE book_id = ${bookId}`;

  revalidatePath('/admin');
}

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

export async function approveRequest(borrowId: number, takenDate: string, dueDate: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const rows = await sql`
    UPDATE borrows
    SET status = 'active', taken_date = ${takenDate}, due_date = ${dueDate}
    WHERE id = ${borrowId} AND status = 'pending'
    RETURNING user_id, book_title
  `;

  if (!rows[0]) throw new Error('Request not found or already processed');
  const row = rows[0] as { user_id: string; book_title: string };

  await sql`
    INSERT INTO notifications (user_id, type, message)
    VALUES (${row.user_id}, 'request_approved', ${`Your request for "${row.book_title}" was approved! Come collect it.`})
  `;

  revalidatePath('/admin');
  revalidatePath('/catalog');
}

export async function rejectRequest(borrowId: number, reason: string | null) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const rows = await sql`
    UPDATE borrows
    SET status = 'rejected', rejection_reason = ${reason}
    WHERE id = ${borrowId} AND status = 'pending'
    RETURNING user_id, book_title
  `;

  if (!rows[0]) throw new Error('Request not found or already processed');
  const row = rows[0] as { user_id: string; book_title: string };

  const msg = reason
    ? `Your request for "${row.book_title}" was rejected. Reason: ${reason}`
    : `Your request for "${row.book_title}" was rejected.`;

  await sql`
    INSERT INTO notifications (user_id, type, message)
    VALUES (${row.user_id}, 'request_rejected', ${msg})
  `;

  revalidatePath('/admin');
  revalidatePath('/catalog');
}

export async function updatePageCount(borrowId: number, pageCount: number) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  await sql`
    UPDATE borrows SET user_page_count = ${pageCount}
    WHERE id = ${borrowId} AND user_id = ${userId} AND status = 'active'
  `;

  revalidatePath('/dashboard');
}

export async function logReading(borrowId: number, pagesRead: number) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  if (pagesRead < 1) throw new Error('Pages must be at least 1');

  // verify borrow belongs to user and is active
  const borrowRow = await sql`
    SELECT id FROM borrows WHERE id = ${borrowId} AND user_id = ${userId} AND status = 'active'
  `;
  if (!borrowRow[0]) throw new Error('Active borrow not found');

  await sql`
    INSERT INTO reading_logs (user_id, borrow_id, pages_read, log_date)
    VALUES (${userId}, ${borrowId}, ${pagesRead}, CURRENT_DATE)
    ON CONFLICT (user_id, borrow_id, log_date)
    DO UPDATE SET pages_read = ${pagesRead}
  `;

  revalidatePath('/dashboard');
}

export async function markReturned(borrowId: number) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const rows = await sql`
    UPDATE borrows
    SET status = 'returned', returned_date = CURRENT_DATE, returned_at = NOW()
    WHERE id = ${borrowId} AND status = 'active'
    RETURNING user_id, book_title, book_id
  `;

  if (!rows[0]) throw new Error('Borrow not found');
  const row = rows[0] as { user_id: string; book_title: string; book_id: string };

  // notify next person on waitlist if any
  const waitlist = await sql`
    SELECT id, user_id FROM borrows
    WHERE book_id = ${row.book_id} AND status = 'pending'
    ORDER BY borrowed_at ASC
    LIMIT 1
  `;
  if (waitlist[0]) {
    const next = waitlist[0] as { id: number; user_id: string };
    await sql`
      INSERT INTO notifications (user_id, type, message)
      VALUES (${next.user_id}, 'waitlist_ready', ${`"${row.book_title}" is now available — your waitlist request can be approved!`})
    `;
  }

  revalidatePath('/admin');
  revalidatePath('/catalog');
}
