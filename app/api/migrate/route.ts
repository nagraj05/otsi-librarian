import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  // 1. users table
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      email      TEXT NOT NULL UNIQUE,
      role       TEXT NOT NULL DEFAULT 'user',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // 2. extend borrows
  await sql`ALTER TABLE borrows ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id)`;
  await sql`ALTER TABLE borrows ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'`;
  await sql`ALTER TABLE borrows ADD COLUMN IF NOT EXISTS taken_date DATE`;
  await sql`ALTER TABLE borrows ADD COLUMN IF NOT EXISTS due_date DATE`;
  await sql`ALTER TABLE borrows ADD COLUMN IF NOT EXISTS returned_date DATE`;
  await sql`ALTER TABLE borrows ADD COLUMN IF NOT EXISTS rejection_reason TEXT`;

  // backfill legacy rows
  await sql`
    UPDATE borrows SET status = 'returned'
    WHERE returned_at IS NOT NULL AND status = 'active'
  `;

  // 3. reading_logs
  await sql`
    CREATE TABLE IF NOT EXISTS reading_logs (
      id         SERIAL PRIMARY KEY,
      user_id    TEXT NOT NULL REFERENCES users(id),
      borrow_id  INT  NOT NULL REFERENCES borrows(id),
      log_date   DATE NOT NULL DEFAULT CURRENT_DATE,
      pages_read INT  NOT NULL CHECK (pages_read > 0),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, borrow_id, log_date)
    )
  `;

  // 4. notifications
  await sql`
    CREATE TABLE IF NOT EXISTS notifications (
      id         SERIAL PRIMARY KEY,
      user_id    TEXT NOT NULL REFERENCES users(id),
      type       TEXT NOT NULL,
      message    TEXT NOT NULL,
      read       BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`ALTER TABLE borrows ADD COLUMN IF NOT EXISTS user_page_count INTEGER`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS image_url TEXT`;

  // ── Personal books ──
  await sql`
    CREATE TABLE IF NOT EXISTS personal_books (
      id             SERIAL PRIMARY KEY,
      user_id        TEXT NOT NULL REFERENCES users(id),
      title          TEXT NOT NULL,
      authors        TEXT[]       NOT NULL DEFAULT '{}',
      thumbnail      TEXT,
      publisher      TEXT,
      published_date TEXT,
      page_count     INT,
      isbn           TEXT,
      google_book_id TEXT,
      status         TEXT NOT NULL DEFAULT 'want_to_read',
      current_page   INT,
      start_date     DATE,
      end_date       DATE,
      rating         NUMERIC(2,1) CHECK (rating >= 0.5 AND rating <= 5),
      notes          TEXT,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // ── Ebook reader ──
  await sql`ALTER TABLE books ADD COLUMN IF NOT EXISTS ebook_url TEXT`;

  await sql`
    CREATE TABLE IF NOT EXISTS ebook_progress (
      id         SERIAL PRIMARY KEY,
      user_id    TEXT NOT NULL REFERENCES users(id),
      book_id    TEXT NOT NULL,
      cfi        TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, book_id)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS ebook_bookmarks (
      id         SERIAL PRIMARY KEY,
      user_id    TEXT NOT NULL REFERENCES users(id),
      book_id    TEXT NOT NULL,
      cfi        TEXT NOT NULL,
      label      TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS ebook_highlights (
      id         SERIAL PRIMARY KEY,
      user_id    TEXT NOT NULL REFERENCES users(id),
      book_id    TEXT NOT NULL,
      cfi_range  TEXT NOT NULL,
      text       TEXT NOT NULL,
      color      TEXT NOT NULL DEFAULT 'yellow',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  return NextResponse.json({ ok: true, message: 'Migration complete' });
}
