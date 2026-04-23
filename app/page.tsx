import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { SignInButton } from '@clerk/nextjs';
import { Library, BookOpen, Flame, Bell, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';

export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) redirect('/dashboard');

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center shadow-md shadow-brand/20">
              <Library className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
            </div>
            <span className="font-bold text-foreground text-[15px] tracking-tight">OTSI LIBRARY</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <SignInButton mode="modal" forceRedirectUrl="/dashboard">
              <Button size="sm" className="bg-brand hover:bg-brand/90 text-white rounded-xl h-8 px-4 text-[13px] font-semibold shadow-sm shadow-brand/20">
                Sign in
              </Button>
            </SignInButton>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-brand flex items-center justify-center shadow-xl shadow-brand/30 mb-6">
          <Library className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight mb-4">
          OTSI Library
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg max-w-md mb-8 leading-relaxed">
          Borrow books, track your reading, build streaks. A private library for the OTSI team.
        </p>
        <SignInButton mode="modal" forceRedirectUrl="/dashboard">
          <Button size="lg" className="bg-brand hover:bg-brand/90 text-white rounded-xl px-8 font-semibold shadow-md shadow-brand/25">
            Get started
          </Button>
        </SignInButton>

        {/* Feature pills */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl w-full">
          {[
            { icon: BookOpen, label: 'Browse catalog' },
            { icon: Users,    label: 'Request books' },
            { icon: Flame,    label: 'Reading streaks' },
            { icon: Bell,     label: 'Notifications' },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="bg-card rounded-2xl ring-1 ring-foreground/5 shadow-sm p-4 flex flex-col items-center gap-2"
            >
              <div className="w-9 h-9 rounded-xl bg-brand-muted flex items-center justify-center">
                <Icon className="w-4 h-4 text-brand" />
              </div>
              <p className="text-xs font-semibold text-foreground">{label}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-muted-foreground">
        OTSI Library · Members only
      </footer>
    </div>
  );
}
