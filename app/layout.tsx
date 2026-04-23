import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from '@/components/ui/sonner';
import { Providers } from '@/components/providers';
import { syncUser } from '@/lib/sync-user';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
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
      <html lang="en" className={`${plusJakarta.variable} h-full`} suppressHydrationWarning>
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
