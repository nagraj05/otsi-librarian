import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { LandingClient } from '@/components/landing-client';

export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) redirect('/dashboard');

  return <LandingClient />;
}
