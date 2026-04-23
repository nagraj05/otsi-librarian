'use client';

import { motion } from 'framer-motion';
import { Library, BookOpen, Flame, Bell, Users, Trophy } from 'lucide-react';
import { SignInButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';

const ease = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease, delay: i * 0.1 },
  }),
};

const features = [
  {
    icon: BookOpen,
    title: 'Browse catalog',
    desc: 'Search the full library and see what\'s available at a glance.',
  },
  {
    icon: Users,
    title: 'Request books',
    desc: 'Request a book — admin approves and hands it over.',
  },
  {
    icon: Flame,
    title: 'Reading streaks',
    desc: 'Log pages daily to build your streak and stay consistent.',
  },
  {
    icon: Trophy,
    title: 'Leaderboard',
    desc: 'Compete with teammates on streaks and total pages read.',
  },
  {
    icon: Bell,
    title: 'Notifications',
    desc: 'Get notified when requests are approved or books become available.',
  },
  {
    icon: Library,
    title: 'Waitlist',
    desc: 'Book already out? Join the waitlist and get alerted when it\'s free.',
  },
];

export function LandingClient() {
  return (
    <div className="min-h-screen flex flex-col bg-background overflow-hidden">

      {/* Decorative blobs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-brand/8 blur-[120px]" />
        <div className="absolute top-1/2 -right-48 w-[400px] h-[400px] rounded-full bg-brand/6 blur-[100px]" />
        <div className="absolute -bottom-32 left-1/3 w-[360px] h-[360px] rounded-full bg-warn/5 blur-[100px]" />
      </div>

      {/* Nav */}
      <header className="relative z-40 sticky top-0 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease }}
          >
            <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center shadow-md shadow-brand/20">
              <Library style={{ width: 18, height: 18 }} className="text-white" />
            </div>
            <span className="font-bold text-foreground text-[15px] tracking-tight">OTSI LIBRARY</span>
          </motion.div>

          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease }}
          >
            <ThemeToggle />
            <SignInButton mode="modal" forceRedirectUrl="/dashboard">
              <Button size="sm" className="bg-brand hover:bg-brand/90 text-white rounded-xl h-8 px-4 text-[13px] font-semibold shadow-sm shadow-brand/20">
                Sign in
              </Button>
            </SignInButton>
          </motion.div>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pt-16 pb-24 text-center">

        {/* Eyebrow */}
        <motion.p
          className="text-[11px] font-semibold tracking-[0.2em] uppercase text-brand mb-6"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
        >
          Members only · OTSI Team
        </motion.p>

        {/* Logo mark */}
        <motion.div
          className="w-20 h-20 rounded-3xl bg-brand flex items-center justify-center shadow-2xl shadow-brand/30 mb-8"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease }}
        >
          <Library className="w-10 h-10 text-white" />
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="font-serif text-5xl sm:text-6xl lg:text-7xl font-medium text-foreground leading-[1.05] tracking-tight mb-6 max-w-3xl"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
        >
          The office library,{' '}
          <em className="text-brand not-italic">finally organised.</em>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-muted-foreground text-lg sm:text-xl max-w-lg leading-relaxed mb-10"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
        >
          Borrow books, log your reading, build streaks, and compete with your teammates.
        </motion.p>

        {/* CTA */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={3}
        >
          <SignInButton mode="modal" forceRedirectUrl="/dashboard">
            <Button
              size="lg"
              className="bg-brand hover:bg-brand/90 text-white rounded-2xl px-10 h-12 text-[15px] font-semibold shadow-lg shadow-brand/25 transition-all duration-200 hover:shadow-xl hover:shadow-brand/30 hover:-translate-y-0.5"
            >
              Get started
            </Button>
          </SignInButton>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          className="mt-24 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 max-w-3xl w-full"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.07, delayChildren: 0.5 } } }}
        >
          {features.map(({ icon: Icon, title, desc }) => (
            <motion.div
              key={title}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
              }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="bg-card rounded-2xl ring-1 ring-foreground/5 shadow-sm p-4 sm:p-5 flex flex-col items-start gap-3 text-left cursor-default"
            >
              <div className="w-9 h-9 rounded-xl bg-brand-muted flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-brand" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed hidden sm:block">{desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </main>

      <motion.footer
        className="relative z-10 py-6 text-center text-xs text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
      >
        OTSI Library · Members only
      </motion.footer>
    </div>
  );
}
