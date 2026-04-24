<div align="center">

```
 ██████╗ ████████╗███████╗██╗    ██╗     ██╗██████╗ ██████╗  █████╗ ██████╗ ██╗ █████╗ ███╗   ██╗
██╔═══██╗╚══██╔══╝██╔════╝██║    ██║     ██║██╔══██╗██╔══██╗██╔══██╗██╔══██╗██║██╔══██╗████╗  ██║
██║   ██║   ██║   ███████╗██║    ██║     ██║██████╔╝██████╔╝███████║██████╔╝██║███████║██╔██╗ ██║
██║   ██║   ██║   ╚════██║██║    ██║     ██║██╔══██╗██╔══██╗██╔══██╗██╔══██╗██║██╔══██╗██║╚██╗██║
╚██████╔╝   ██║   ███████║██║    ███████╗██║██████╔╝██║  ██║██║  ██║██║  ██║██║██║  ██║██║ ╚████║
 ╚═════╝    ╚═╝   ╚══════╝╚═╝    ╚══════╝╚═╝╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝
```

**A self-service library for the office.**  
Browse the catalog, request books, read ebooks, track your personal shelf, and compete on the leaderboard.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![Clerk](https://img.shields.io/badge/Clerk-v7-6C47FF?style=flat-square&logo=clerk&logoColor=white)
![Neon](https://img.shields.io/badge/Neon-PostgreSQL-00E599?style=flat-square&logoColor=black)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-1-FBF0DF?style=flat-square&logo=bun&logoColor=black)

</div>

---

## ✦ What is OTSI Librarian?

OTSI Librarian is a self-service book lending system for the office. Users sign up, browse the catalog, and request books — the admin approves or rejects requests and hands the book over physically. Once a book is in hand, users log their daily reading to build streaks and climb the leaderboard.

Admins can also attach an EPUB file to any book in the catalog, making it instantly readable in the built-in ebook reader — with bookmarks, highlights, theme switching, and automatic resume. Users also have a private personal shelf to track books they own at home, with status, progress, half-star ratings, and dates.

Everything is in-app: no WhatsApp, no email — notifications appear in the bell icon and update automatically every 20 seconds via polling.

---

## ✦ Features

| | |
|---|---|
| 📖 **Catalog** | Browse all library books, request or join waitlist; ebook badge shown where available |
| 🔐 **Role-based auth** | Clerk auth — users self-serve, single admin manages requests |
| 🔍 **Google Books search** | Admin adds books by searching — cover, authors, metadata fetched automatically (debounced, AbortController) |
| ✅ **Borrow workflow** | Users request → admin approves with taken/due date → user collects physically |
| ⏳ **Waitlist** | If a book is out, users can join the waitlist and get notified when it's returned |
| 📅 **Daily reading log** | Log by current page number — app calculates pages read; progress bar shows completion % |
| 🔥 **Reading streaks** | Consecutive days logged build your streak |
| 🏆 **Leaderboard** | Public ranking by streak, tiebroken by total pages — links to each user's profile |
| 👤 **Public profiles** | `/@username` — reading history, currently reading, personal shelf, streak and stats |
| 🔔 **In-app notifications** | Approve, reject, waitlist alerts — bell polls every 20s, no refresh needed |
| 📚 **In-browser ebook reader** | Full-screen EPUB reader: bookmarks, text highlights (4 colours), theme (light/sepia/dark), font size, auto-resume at last page, TOC/bookmarks/highlights sidebar |
| 🗄️ **Ebook uploads** | Admin uploads EPUB per book (drag-drop, progress bar, Vercel Blob storage) |
| 📂 **Personal shelf** | Track books you own at home — want to read / reading / finished, current page, start & end dates, half-star rating (0.5–5), private notes |
| 🌙 **Dark mode** | System-aware theme toggle — also applies to ebook reader |
| 📱 **Mobile responsive** | Fully polished on all screen sizes |

---

## ✦ Requirements

- **Bun 1+** (or Node.js 20+)
- **Neon** (or any PostgreSQL) database
- **Clerk** account — publishable + secret keys
- **Vercel Blob** store — for ebook EPUB storage
- **Google Books API key** — optional but avoids rate limits

---

## ✦ Getting Started

```bash
# 1. Clone
git clone https://github.com/nagraj05/otsi-librarian.git
cd otsi-librarian

# 2. Install dependencies
bun install

# 3. Configure environment
cp .env.example .env.local
# fill in the values below
```

**.env.local**

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
DATABASE_URL=postgresql://...
ADMIN_CLERK_ID=user_...          # your Clerk user ID — grants admin role
GOOGLE_BOOKS_API_KEY=...         # optional — avoids Google Books rate limits
BLOB_READ_WRITE_TOKEN=...        # from Vercel Blob dashboard — required for ebook uploads
```

```bash
# 4. Set up the database (run once after starting the dev server)
#    Visit: http://localhost:3000/api/migrate
#    (or /api/reset to wipe and recreate all tables from scratch)

# 5. Start
bun dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in. If your Clerk ID matches `ADMIN_CLERK_ID` you'll have admin access automatically.

```bash
bun build      # production build
bun start      # serve production build
bun lint       # ESLint check
```

---

## ✦ Routes

| Route | Access | Description |
|---|---|---|
| `/` | Public | Landing page — sign in to enter |
| `/dashboard` | Auth | Personal dashboard — active borrows, reading log, streak, ebook links |
| `/catalog` | Auth | Browse all books — request, waitlist, availability + ebook badge |
| `/personal-books` | Auth | Personal shelf — track books you own with status, progress, rating |
| `/leaderboard` | Auth | Ranked by reading streak + total pages |
| `/@username` | Auth | Public user profile — stats, currently reading, history, personal readings |
| `/books/[bookId]` | Auth | Book detail — borrow history, "Read Ebook" button if ebook is available |
| `/read/[bookId]` | Auth | Full-screen EPUB reader — bookmarks, highlights, theme, auto-resume |
| `/admin` | Admin only | Manage requests, active borrows, library catalog + ebook uploads |
| `/api/books/search` | Internal | Google Books search proxy (`?q=query`) |
| `/api/books/[bookId]/ebook` | Internal | Vercel Blob upload token + ebook delete |
| `/api/ebook/[bookId]/progress` | Internal | Read position (CFI) save and restore |
| `/api/ebook/[bookId]/bookmarks` | Internal | Bookmark CRUD |
| `/api/ebook/[bookId]/highlights` | Internal | Highlight CRUD |
| `/api/notifications` | Internal | Returns current user's notifications (used by polling) |
| `/api/reset` | One-time | Drops and recreates all tables fresh |
| `/api/migrate` | One-time | Idempotent — adds new columns/tables to existing DB |

---

## ✦ Project Structure

```
otsi-librarian/
├── app/
│   ├── page.tsx                          ← Landing page
│   ├── layout.tsx                        ← Root shell: ClerkProvider, fonts, Toaster, syncUser
│   ├── globals.css                       ← Tailwind v4 + color palette
│   ├── actions.ts                        ← All server actions (borrow, reading log, personal books)
│   ├── (main)/
│   │   ├── layout.tsx                    ← Navbar + main content wrapper
│   │   ├── dashboard/page.tsx            ← Active borrows, reading log, streak
│   │   ├── catalog/page.tsx              ← Book catalog with ebook badges
│   │   ├── personal-books/
│   │   │   ├── page.tsx                  ← Personal shelf (server — fetches books)
│   │   │   └── personal-books-shelf.tsx  ← Filter tabs + card grid (client)
│   │   ├── leaderboard/page.tsx          ← Streak leaderboard
│   │   └── users/[username]/page.tsx     ← Public profile — borrows + personal readings
│   ├── admin/
│   │   ├── layout.tsx                    ← Admin role guard
│   │   └── page.tsx                      ← Requests, borrows, catalog + ebook upload
│   ├── books/[bookId]/page.tsx           ← Book detail — "Read Ebook" CTA
│   ├── read/[bookId]/
│   │   ├── page.tsx                      ← Reader server shell (auth, load progress)
│   │   └── reader-client.tsx             ← Full-screen EPUB reader (epub.js)
│   └── api/
│       ├── books/search/route.ts         ← Google Books proxy
│       ├── books/[bookId]/ebook/         ← Vercel Blob upload token + delete
│       ├── ebook/[bookId]/progress/      ← CFI position save/restore
│       ├── ebook/[bookId]/bookmarks/     ← Bookmark CRUD
│       ├── ebook/[bookId]/highlights/    ← Highlight CRUD
│       ├── notifications/route.ts        ← Notification polling
│       ├── reset/route.ts                ← Full DB reset
│       └── migrate/route.ts              ← Idempotent DB migration
├── components/
│   ├── navbar.tsx / nav-links.tsx        ← Shared navigation
│   ├── mobile-menu.tsx                   ← Mobile nav drawer
│   ├── notification-bell.tsx             ← Bell + 20s polling
│   ├── log-reading-form.tsx              ← Page-based daily reading logger
│   ├── book-search.tsx                   ← Google Books search (600ms debounce, AbortController)
│   ├── add-to-library-dialog.tsx         ← Admin: add book to catalog
│   ├── ebook-upload.tsx                  ← Admin: drag-drop EPUB upload with progress
│   ├── epub-reader.tsx                   ← Reader shell (keyboard shortcuts, layout)
│   ├── reader-toolbar.tsx                ← Reader top bar (theme, font, bookmark, sidebar)
│   ├── reader-sidebar.tsx                ← TOC / Bookmarks / Highlights panel
│   ├── personal-book-card.tsx            ← Personal shelf card (progress, rating, edit/delete)
│   ├── add-personal-book-dialog.tsx      ← 2-step dialog: search/manual → reading state
│   ├── update-personal-book-dialog.tsx   ← Edit status, progress, dates, rating
│   ├── half-star-rating.tsx              ← Interactive + display half-star component (0.5–5)
│   ├── request-button.tsx                ← Request / Waitlist button
│   ├── approve-request-dialog.tsx        ← Admin: approve with dates
│   ├── reject-request-dialog.tsx         ← Admin: reject with reason
│   ├── mark-returned-button.tsx          ← Mark book returned
│   ├── theme-toggle.tsx                  ← Light/dark toggle
│   └── ui/                               ← shadcn/ui primitives
├── lib/
│   ├── db.ts                             ← Neon SQL client
│   ├── types.ts                          ← TypeScript interfaces
│   ├── sync-user.ts                      ← Upsert user on every load
│   └── streak.ts                         ← Reading streak calculation
└── proxy.ts                              ← Clerk middleware (Next.js 16)
```

---

## ✦ Database Schema

| Table | Purpose |
|---|---|
| `users` | Clerk-synced users — id, name, email, username, role, image_url |
| `borrows` | Borrow records — status (`pending/active/returned/rejected`), dates, book snapshot |
| `books` | Library catalog — metadata + `ebook_url` (Vercel Blob) |
| `reading_logs` | Daily pages-read per borrow — drives streaks and leaderboard |
| `notifications` | Per-user alerts for approvals, rejections, waitlist |
| `ebook_progress` | Last EPUB position (CFI) per user+book — one row, UPSERT |
| `ebook_bookmarks` | User bookmarks: CFI + chapter label |
| `ebook_highlights` | User highlights: CFI range + text + colour (yellow/green/blue/pink) |
| `personal_books` | Personal shelf — status, current page, dates, rating (NUMERIC 0.5–5), private notes |

Run `/api/migrate` once after first deploy (and after any update) to apply all schema changes idempotently.

---

## ✦ How It Works

**Borrow flow**
```
User requests a book
  └─► requestBook() server action
        └─► INSERT INTO borrows (status = 'pending')
              └─► notify admin via notifications table

Admin approves
  └─► approveRequest(borrowId, takenDate, dueDate)
        └─► UPDATE borrows SET status = 'active'
              └─► notify user → bell updates within 20s

User logs reading (by current page number)
  └─► logReading(borrowId, pagesReadDelta)
        └─► UPSERT reading_logs (one row per user/book/day)
              └─► streak recalculated on next dashboard load

Book returned
  └─► markReturned(borrowId)
        └─► UPDATE borrows SET status = 'returned'
              └─► notify next person on waitlist if any
```

**Ebook flow**
```
Admin uploads EPUB
  └─► Vercel Blob client upload (drag-drop, progress bar)
        └─► blob URL stored in books.ebook_url

User opens reader (/read/[bookId])
  └─► Server loads book + saved CFI position + bookmarks + highlights
        └─► ReaderClient renders epub.js full-screen
              ├─► Position auto-saved (debounced 1.5s) on every page turn
              ├─► Text select → colour picker → highlight saved + rendered
              └─► Bookmark icon → saves current CFI with chapter label
```

**Personal shelf flow**
```
User adds a book (search or manual)
  └─► addPersonalBook() server action
        └─► INSERT INTO personal_books

User updates progress
  └─► updatePersonalBook(id, { status, current_page, ... })
        └─► UPDATE personal_books SET ... updated_at = NOW()
```

---

## ✦ Tech Stack

| Library | Version | Used for |
|---|---|---|
| [Next.js](https://nextjs.org) | 16 | App Router, server actions, API routes |
| [React](https://react.dev) | 19 | UI and client components |
| [Clerk](https://clerk.com) | v7 | Auth — sign in, session, role assignment |
| [Neon](https://neon.tech) | — | Serverless PostgreSQL |
| [Tailwind CSS](https://tailwindcss.com) | v4 | Utility styling, CSS variable theming |
| [shadcn/ui](https://ui.shadcn.com) | — | Button, Dialog, Sonner toast, and more |
| [react-reader](https://github.com/gerhardsletten/react-reader) | 2 | EPUB rendering (epub.js wrapper) |
| [@vercel/blob](https://vercel.com/docs/storage/vercel-blob) | — | EPUB file storage with client-side upload |
| [Framer Motion](https://www.framer.com/motion/) | 12 | Animations — sidebar slide, color picker |
| [Lucide React](https://lucide.dev) | — | Icons |
| [DM Sans](https://fonts.google.com/specimen/DM+Sans) | — | UI body font |
| [Fraunces](https://fonts.google.com/specimen/Fraunces) | — | Serif display font |
| [Bun](https://bun.sh) | 1 | Package manager + runtime |

---

<div align="center">

Made for the OTSI office — because sticky notes don't scale.

</div>
