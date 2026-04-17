<div align="center">

```
 ██████╗ ████████╗███████╗██╗    ██╗     ██╗██████╗ ██████╗  █████╗ ██████╗ ██╗ █████╗ ███╗   ██╗
██╔═══██╗╚══██╔══╝██╔════╝██║    ██║     ██║██╔══██╗██╔══██╗██╔══██╗██╔══██╗██║██╔══██╗████╗  ██║
██║   ██║   ██║   ███████╗██║    ██║     ██║██████╔╝██████╔╝███████║██████╔╝██║███████║██╔██╗ ██║
██║   ██║   ██║   ╚════██║██║    ██║     ██║██╔══██╗██╔══██╗██╔══██║██╔══██╗██║██╔══██║██║╚██╗██║
╚██████╔╝   ██║   ███████║██║    ███████╗██║██████╔╝██║  ██║██║  ██║██║  ██║██║██║  ██║██║ ╚████║
 ╚═════╝    ╚═╝   ╚══════╝╚═╝    ╚══════╝╚═╝╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝
```

**Know who has your books. Always.**  
A clean office book tracker — public borrow feed, admin dashboard, full Google Books metadata.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![Clerk](https://img.shields.io/badge/Clerk-v7-6C47FF?style=flat-square&logo=clerk&logoColor=white)
![Neon](https://img.shields.io/badge/Neon-PostgreSQL-00E599?style=flat-square&logoColor=black)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-1-FBF0DF?style=flat-square&logo=bun&logoColor=black)

</div>

---

## ✦ What is OTSI Librarian?

OTSI Librarian is a lightweight office book-lending tracker. Anyone on the team can open the home page and immediately see which books are checked out and who has them. The admin (you) logs in to add new borrow records, mark books as returned, or delete entries.

When you add a book, the title is looked up via the Google Books API and all metadata — cover art, authors, description, publisher, page count, categories, ISBN, and rating — is fetched and stored automatically.

---

## ✦ Features

| | |
|---|---|
| 📖 **Public borrow feed** | Anyone can see who has which books, grouped by borrower |
| 🔐 **Admin-only login** | Clerk auth — only you can add or manage records |
| 🔍 **Google Books search** | Autocomplete as you type; cover + authors shown inline |
| 📚 **Full metadata storage** | Cover, description, publisher, pages, ISBN, rating saved at borrow time |
| 🪐 **Book detail pages** | Per-book page with hero cover, details grid, and full borrow history timeline |
| ↩️ **Return tracking** | Mark a book returned — timestamp recorded automatically |
| 🗑️ **Delete records** | Remove any borrow entry from the admin dashboard |
| 📱 **Mobile responsive** | Cards on mobile, table on desktop — both fully polished |
| ⚡ **Skeleton loading** | Every page has a matching loading skeleton for instant perceived performance |
| 🎨 **Consistent design** | Plus Jakarta Sans, warm `#F7F6F3` background, shadcn/ui components throughout |

---

## ✦ Requirements

- **Node.js 18+** or **Bun 1+**
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
GOOGLE_BOOKS_API_KEY=...        # optional
```

```bash
# 4. Create the database table (run once)
#    Start the dev server, then visit:
#    http://localhost:3000/api/setup

# 5. Start
bun dev
```

Open [http://localhost:3000](http://localhost:3000), click **Admin Login**, and add your first record.

```bash
bun build      # production build
bun start      # serve production build
bun lint       # ESLint check
```

---

## ✦ Routes

| Route | Access | Description |
|---|---|---|
| `/` | Public | Home — currently borrowed (grouped by person) + returned history |
| `/admin` | Auth only | Add borrows, mark returns, delete records |
| `/books/[bookId]` | Public | Book detail page — metadata, stats, borrow timeline |
| `/api/books/search` | Internal | Google Books search proxy (`?q=query`) |
| `/api/setup` | One-time | Creates the `borrows` table in the database |

---

## ✦ Project Structure

```
otsi-librarian/
├── app/
│   ├── page.tsx                  ← Public home — borrow feed grouped by person
│   ├── layout.tsx                ← Root shell: ClerkProvider, font, Toaster
│   ├── loading.tsx               ← Home page skeleton
│   ├── globals.css               ← Tailwind v4 imports + CSS variables
│   ├── admin/
│   │   ├── page.tsx              ← Admin dashboard — table + mobile cards
│   │   └── loading.tsx           ← Admin skeleton
│   ├── books/[bookId]/
│   │   ├── page.tsx              ← Book detail — hero, metadata, history timeline
│   │   └── loading.tsx           ← Book detail skeleton
│   └── api/
│       ├── books/search/route.ts ← Google Books API proxy
│       └── setup/route.ts        ← One-time DB table creation
├── components/
│   ├── add-borrow-dialog.tsx     ← Modal: borrower + book search + date + notes
│   ├── book-search.tsx           ← Debounced autocomplete against Google Books
│   ├── return-button.tsx         ← Mark-returned server action button
│   ├── delete-button.tsx         ← Delete record server action button
│   └── ui/                       ← shadcn/ui primitives (badge, button, dialog…)
├── lib/
│   ├── db.ts                     ← Neon SQL client
│   └── types.ts                  ← Borrow + GoogleBook TypeScript interfaces
├── app/actions.ts                ← Server actions: addBorrow, returnBook, deleteBorrow
└── proxy.ts                      ← Clerk middleware (Next.js 16 uses proxy.ts)
```

---

## ✦ How It Works

```
Admin types a book title
  └─► /api/books/search?q=...
        └─► Google Books API → volumeInfo (cover, authors, pages, ISBN, rating…)
              └─► BookSearch dropdown → user picks a result
                    └─► addBorrow() server action
                          └─► INSERT INTO borrows (all metadata stored once)
                                └─► revalidatePath('/') + revalidatePath('/admin')

Public visitor opens /
  └─► getBorrows() → SELECT * FROM borrows ORDER BY borrowed_at DESC
        └─► reduce into Record<borrowerName, Borrow[]>
              └─► PersonCard grid (currently out) + ReturnedCard grid
```

Book detail pages read entirely from the **database** — no second API call needed because all metadata was captured at borrow time.

---

## ✦ Tech Stack

| Library | Version | Used for |
|---|---|---|
| [Next.js](https://nextjs.org) | 16 | App Router, server actions, API routes |
| [React](https://react.dev) | 19 | UI and client components |
| [Clerk](https://clerk.com) | v7 | Authentication — login modal, session, `auth()` |
| [Neon](https://neon.tech) | — | Serverless PostgreSQL (`@neondatabase/serverless`) |
| [Tailwind CSS](https://tailwindcss.com) | v4 | Utility styling, CSS variable theming |
| [shadcn/ui](https://ui.shadcn.com) | base-nova | Badge, Button, Dialog, Sonner toast |
| [Lucide React](https://lucide.dev) | — | Icons |
| [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) | — | UI font via `next/font/google` |
| [Bun](https://bun.sh) | 1 | Package manager + runtime |

---

<div align="center">

Made for the OTSI office — because sticky notes don't scale.

</div>
