import { NextResponse } from 'next/server';
import sql from '@/lib/db';

// Wipes all data and rebuilds schema from scratch.
export async function GET() {
  // Drop in reverse dependency order
  await sql`DROP TABLE IF EXISTS notifications CASCADE`;
  await sql`DROP TABLE IF EXISTS reading_logs CASCADE`;
  await sql`DROP TABLE IF EXISTS borrows CASCADE`;
  await sql`DROP TABLE IF EXISTS books CASCADE`;
  await sql`DROP TABLE IF EXISTS users CASCADE`;

  // users
  await sql`
    CREATE TABLE users (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      email      TEXT NOT NULL UNIQUE,
      username   TEXT UNIQUE,
      role       TEXT NOT NULL DEFAULT 'user',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // books catalog
  await sql`
    CREATE TABLE books (
      id             SERIAL PRIMARY KEY,
      book_id        VARCHAR(255) UNIQUE NOT NULL,
      title          VARCHAR(500) NOT NULL,
      authors        TEXT[] DEFAULT '{}',
      thumbnail      TEXT,
      description    TEXT,
      publisher      VARCHAR(255),
      published_date VARCHAR(100),
      page_count     INTEGER,
      categories     TEXT[] DEFAULT '{}',
      isbn           VARCHAR(100),
      rating         DECIMAL(3,1),
      added_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // borrows (requests + active + returned)
  await sql`
    CREATE TABLE borrows (
      id               SERIAL PRIMARY KEY,
      user_id          TEXT REFERENCES users(id),
      borrower_name    VARCHAR(255) NOT NULL,
      book_id          VARCHAR(255) NOT NULL,
      book_title       VARCHAR(500) NOT NULL,
      book_authors     TEXT[] DEFAULT '{}',
      book_thumbnail   TEXT,
      book_description TEXT,
      book_publisher   VARCHAR(255),
      book_published_date VARCHAR(100),
      book_page_count  INTEGER,
      book_categories  TEXT[] DEFAULT '{}',
      book_isbn        VARCHAR(100),
      book_rating      DECIMAL(3,1),
      status           TEXT NOT NULL DEFAULT 'pending',
      taken_date       DATE,
      due_date         DATE,
      returned_date    DATE,
      rejection_reason TEXT,
      user_page_count  INTEGER,
      borrowed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      returned_at      TIMESTAMPTZ,
      notes            TEXT
    )
  `;

  // reading logs (one entry per user per book per day)
  await sql`
    CREATE TABLE reading_logs (
      id         SERIAL PRIMARY KEY,
      user_id    TEXT NOT NULL REFERENCES users(id),
      borrow_id  INT  NOT NULL REFERENCES borrows(id),
      log_date   DATE NOT NULL DEFAULT CURRENT_DATE,
      pages_read INT  NOT NULL CHECK (pages_read > 0),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, borrow_id, log_date)
    )
  `;

  // in-app notifications
  await sql`
    CREATE TABLE notifications (
      id         SERIAL PRIMARY KEY,
      user_id    TEXT NOT NULL REFERENCES users(id),
      type       TEXT NOT NULL,
      message    TEXT NOT NULL,
      read       BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  return NextResponse.json({ ok: true, message: 'Database wiped and rebuilt' });
}
