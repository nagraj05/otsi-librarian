import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import sql from '@/lib/db';

async function isAdmin(userId: string) {
  const rows = await sql`SELECT role FROM users WHERE id = ${userId} AND role = 'admin'`;
  return rows.length > 0;
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect('/');

  const admin = await isAdmin(userId);
  if (!admin) redirect('/dashboard');

  return <>{children}</>;
}
