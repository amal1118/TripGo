'use client';

import * as React from 'react';
import Link from 'next/link';
import { Search, X, Menu, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';

const LINKS = [
  { label: 'استكشف', labelEn: 'Discover', href: '/#explore', active: true },
  { label: 'الوجهات', labelEn: 'Destinations', href: '/destinations' },
  { label: 'التجارب', labelEn: 'Experiences', href: '/#features' },
  { label: 'المساعد الذكي', labelEn: 'Concierge AI', href: '/chat', live: true },
  { label: 'رحلاتي', labelEn: 'Saved Trips', href: '/dashboard' },
];

/** شريط تنقّل الهيرو — نص أبيض فوق خلفية داكنة، مع قائمة جوال بملء الشاشة. */
export const LandingNav = React.memo(function LandingNav() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <header className="relative z-20 w-full px-6 pb-4 pt-6 md:px-10 lg:px-14">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-6">
          {/* الشعار */}
          <Link href="/" className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full border border-white/25 bg-white/10 text-sand-300 backdrop-blur-md">
              <Compass className="size-5" />
            </span>
            <span className="flex items-baseline gap-2">
              <span className="font-display text-2xl font-semibold tracking-tight text-white">TripGo</span>
              <span className="hidden rounded border border-sand-400/40 bg-sand-500/10 px-1.5 py-0.5 text-[10px] font-medium tracking-[0.16em] text-sand-300 sm:inline">
                LUXURY
              </span>
            </span>
          </Link>

          {/* روابط سطح المكتب */}
          <nav className="hidden items-center gap-8 lg:flex">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  'flex items-center gap-1.5 text-[13px] font-medium transition-colors hover:text-sand-300',
                  l.active ? 'text-white' : 'text-white/75',
                )}
              >
                {l.live && <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />}
                {l.label}
              </Link>
            ))}
          </nav>

          {/* أدوات اليسار */}
          <div className="flex items-center gap-3">
            <Link
              href="/#explore"
              aria-label="بحث"
              className="grid size-9 place-items-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/25"
            >
              <Search className="size-4" />
            </Link>

            <Link
              href="/login"
              className="hidden rounded-full border border-white/20 bg-white/10 px-5 py-2 text-[13px] font-medium text-white backdrop-blur-md transition-colors hover:bg-white/25 sm:block"
            >
              تسجيل الدخول
            </Link>

            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="فتح القائمة"
              className="grid size-9 place-items-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md lg:hidden"
            >
              <Menu className="size-4" />
            </button>
          </div>
        </div>
      </header>

      {/* قائمة الجوال */}
      <div
        className={cn(
          'fixed inset-0 z-[100] bg-neutral-950 transition-all duration-500 [transition-timing-function:cubic-bezier(0.4,0,0.2,1)]',
          open ? 'visible opacity-100' : 'invisible opacity-0',
        )}
      >
        <div className={cn('flex h-full flex-col transition-transform duration-500', open ? 'translate-y-0' : '-translate-y-8')}>
          <div className="flex items-center justify-between px-6 pt-6 sm:px-8">
            <span className="font-display text-2xl font-semibold text-white">TripGo</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="إغلاق القائمة"
              className="grid size-10 place-items-center rounded-full border border-white/30 text-white transition-colors hover:border-white"
            >
              <X className="size-[18px]" />
            </button>
          </div>

          <nav className="flex flex-1 flex-col justify-center px-8 sm:px-12">
            {LINKS.map((l, i) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                style={{
                  opacity: open ? 1 : 0,
                  transform: open ? 'translateY(0)' : 'translateY(20px)',
                  transition: `all 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 60}ms`,
                }}
                className={cn(
                  'py-3.5 text-2xl font-light tracking-wide transition-colors sm:text-3xl',
                  l.active ? 'text-white' : 'text-white/60 hover:text-white',
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-6 px-8 pb-10 sm:px-12">
            <Link href="/login" onClick={() => setOpen(false)} className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">
              تسجيل الدخول
            </Link>
            <Link href="/plan/new" onClick={() => setOpen(false)} className="text-sm text-white/60 hover:text-white">
              ابدأ خطة جديدة
            </Link>
          </div>
        </div>
      </div>
    </>
  );
});
