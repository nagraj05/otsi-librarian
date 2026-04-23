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
Browse the catalog, request books, track reading streaks, and compete on the leaderboard.

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

Everything is in-app: no WhatsApp, no email — notifications appear in the bell icon and update automatically every 20 seconds via polling.

---

## ✦ Features

| | |
|---|---|
| 📖 **Catalog** | Browse all library books, request or join waitlist |
| 🔐 **Role-based auth** | Clerk auth — users self-serve, single admin manages requests |
| 🔍 **Google Books search** | Admin adds books by searching — cover, authors, metadata fetched automatically |
| ✅ **Borrow workflow** | Users request → admin approves with taken/due date → user collects physically |
| ⏳ **Waitlist** | If a book is out, users can join the waitlist and get notified when it's returned |
| 📅 **Daily reading log** | Log pages read per book per day — progress bar shows completion % |
| 🔥 **Reading streaks** | Consecutive days logged build your streak |
| 🏆 **Leaderboard** | Public ranking by streak, tiebroken by total pages — links to each user's profile |
| 👤 **Public profiles** | `/@username` — reading history, currently reading, streak, stats |
| 🔔 **In-app notifications** | Approve, reject, waitlist alerts — bell polls every 20s, no refresh needed |
| 🌙 **Dark mode** | Warm parchment light / deep brown dark — toggled per user |
| 📱 **Mobile responsive** | Fully polished on all screen sizes |

---

## ✦ Requirements

- **Bun 1+** (or Node.js 18+)
- **Neon** (or any PostgreSQL) database
- **Clerk** account — publishable + secret keys
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
GOOGLE_BOOKS_API_KEY=...         # optional
```

```bash
# 4. Set up the database (run once after starting the dev server)
#    Visit: http://localhost:3000/api/reset
#    (or /api/migrate to add columns to an existing DB)

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
| `/dashboard` | Auth | Personal dashboard — active borrows, reading log, streak |
| `/catalog` | Auth | Browse all books — request, waitlist, availability status |
| `/leaderboard` | Auth | Ranked by reading streak + total pages |
| `/@username` | Auth | Public user profile — stats, currently reading, history |
| `/admin` | Admin only | Manage requests, active borrows, library catalog |
| `/api/books/search` | Internal | Google Books search proxy (`?q=query`) |
| `/api/notifications` | Internal | Returns current user's notifications (used by polling) |
| `/api/reset` | One-time | Drops and recreates all tables fresh |
| `/api/migrate` | One-time | Idempotent — adds new columns to existing tables |

---

## ✦ Project Structure

```
otsi-librarian/
├── app/
│   ├── page.tsx                     ← Landing page (guests) / redirect (authed)
│   ├── layout.tsx                   ← Root shell: ClerkProvider, fonts, Toaster, syncUser
│   ├── globals.css                  ← Tailwind v4 + warm color palette (light + dark)
│   ├── actions.ts                   ← All server actions
│   ├── dashboard/page.tsx           ← User dashboard — borrows, reading log
│   ├── catalog/page.tsx             ← Book catalog with request/waitlist buttons
│   ├── leaderboard/page.tsx         ← Streak leaderboard
│   ├── users/[username]/page.tsx    ← Public user profile
│   ├── admin/
│   │   ├── layout.tsx               ← Admin role guard (redirects non-admins)
│   │   └── page.tsx                 ← Admin dashboard — pending, active, catalog
│   └── api/
│       ├── notifications/route.ts   ← Notification polling endpoint
│       ├── books/search/route.ts    ← Google Books proxy
│       ├── reset/route.ts           ← Full DB reset
│       └── migrate/route.ts         ← Idempotent DB migration
├── components/
│   ├── navbar.tsx                   ← Shared nav (async, fetches notifications)
│   ├── notification-bell.tsx        ← Bell icon + dropdown + 20s polling
│   ├── log-reading-form.tsx         ← Per-book daily reading logger
│   ├── request-button.tsx           ← Request / Waitlist button
│   ├── request-row-actions.tsx      ← Admin approve/reject row
│   ├── approve-request-dialog.tsx   ← Approve with taken/due date inputs
│   ├── reject-request-dialog.tsx    ← Reject with optional reason
│   ├── mark-returned-button.tsx     ← Mark book returned
│   ├── add-to-library-dialog.tsx    ← Admin: add book to catalog
│   ├── remove-book-button.tsx       ← Admin: remove book from catalog
│   ├── theme-toggle.tsx             ← Light/dark toggle
│   └── ui/                          ← shadcn/ui primitives
├── lib/
│   ├── db.ts                        ← Neon SQL client
│   ├── types.ts                     ← TypeScript interfaces
│   ├── sync-user.ts                 ← Upsert user on every load, assign admin role
│   └── streak.ts                    ← Reading streak calculation
└── proxy.ts                         ← Clerk middleware (Next.js 16)
```

---

## ✦ How It Works

```
User requests a book
  └─► requestBook() server action
        └─► INSERT INTO borrows (status = 'pending')
              └─► notify admin via notifications table

Admin approves
  └─► approveRequest(borrowId, takenDate, dueDate)
        └─► UPDATE borrows SET status = 'active'
              └─► notify user → bell updates within 20s

User logs reading
  └─► logReading(borrowId, pagesRead)
        └─► UPSERT reading_logs (one row per user/book/day)
              └─► streak recalculated on next dashboard load

Book returned
  └─► markReturned(borrowId)
        └─► UPDATE borrows SET status = 'returned'
              └─► notify next person on waitlist if any
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
| [Lucide React](https://lucide.dev) | — | Icons |
| [DM Sans](https://fonts.google.com/specimen/DM+Sans) | — | UI body font |
| [Fraunces](https://fonts.google.com/specimen/Fraunces) | — | Serif display font |
| [Bun](https://bun.sh) | 1 | Package manager + runtime |

---

<div align="center">

Made for the OTSI office — because sticky notes don't scale.

</div>
