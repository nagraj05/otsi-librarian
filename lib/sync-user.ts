'server-only';

import { currentUser } from '@clerk/nextjs/server';
import sql from '@/lib/db';

const ADMIN_CLERK_ID = process.env.ADMIN_CLERK_ID!;

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '.');
}

async function generateUsername(base: string, excludeId?: string): Promise<string> {
  let candidate = base;
  let suffix = 1;

  while (true) {
    const rows = await sql`
      SELECT id FROM users WHERE username = ${candidate} AND id != ${excludeId ?? ''}
    `;
    if (rows.length === 0) return candidate;
    candidate = `${base}${++suffix}`;
  }
}

export async function syncUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
    clerkUser.username ||
    'Unknown';
  const email    = clerkUser.emailAddresses[0]?.emailAddress ?? '';
  const role     = clerkUser.id === ADMIN_CLERK_ID ? 'admin' : 'user';
  const imageUrl = clerkUser.imageUrl ?? null;

  // If Clerk has a username, always sync it (handling collisions with other users).
  // Otherwise fall back to the existing DB slug or generate a new one.
  let username: string;
  if (clerkUser.username) {
    username = await generateUsername(clerkUser.username, clerkUser.id);
  } else {
    const existing = await sql`SELECT username FROM users WHERE id = ${clerkUser.id}`;
    const existingUsername = (existing[0] as { username: string | null } | undefined)?.username;
    username = existingUsername ?? await generateUsername(toSlug(name), clerkUser.id);
  }

  await sql`
    INSERT INTO users (id, name, email, username, role, image_url)
    VALUES (${clerkUser.id}, ${name}, ${email}, ${username}, ${role}, ${imageUrl})
    ON CONFLICT (id) DO UPDATE
      SET name      = EXCLUDED.name,
          email     = EXCLUDED.email,
          username  = EXCLUDED.username,
          role      = ${role},
          image_url = EXCLUDED.image_url
  `;

  return { id: clerkUser.id, name, email, username, role } as const;
}
