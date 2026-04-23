import type { Metadata } from 'next';
import { DM_Sans, Fraunces } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from '@/components/ui/sonner';
import { Providers } from '@/components/providers';
import { syncUser } from '@/lib/sync-user';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  axes: ['opsz'],
});

export const metadata: Metadata = {
  title: 'OTSI Library',
  description: 'My Library',
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await syncUser();
  return (
    <ClerkProvider afterSignOutUrl="/">
      <html lang="en" className={`${dmSans.variable} ${fraunces.variable} h-full`} suppressHydrationWarning>
        <body className="min-h-full flex flex-col antialiased">
          <Providers>
            {children}
            <Toaster richColors position="top-right" />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
