'use client';

/**
 * BottomNav — شريط التنقل السفلي العائم (يحلّ محل الشريط العلوي والتذييل).
 *
 * التصميم: كبسولة داكنة عائمة، العنصر النشط دائرة برتقالية.
 * الجوال: عرض شبه كامل مع احترام منطقة الأمان (safe-area).
 * سطح المكتب: نفس الكبسولة في المنتصف مع إظهار التسميات النصية.
 *
 * يُخفي نفسه في مسارات المصادقة والإعداد حيث يشتّت التنقل.
 */

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, BookMarked, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const ITEMS = [
  { href: '/', label: 'الرئيسية', icon: Home, match: (p: string) => p === '/' },
  { href: '/destinations', label: 'استكشف', icon: Search, match: (p: string) => p.startsWith('/destinations') || p.startsWith('/plan') },
  { href: '/dashboard', label: 'رحلاتي', icon: BookMarked, match: (p: string) => p.startsWith('/dashboard') || p.startsWith('/trips') },
  { href: '/chat', label: 'المساعد', icon: User, match: (p: string) => p.startsWith('/chat') },
];

/** مسارات بلا شريط تنقّل. */
const HIDDEN = ['/login', '/onboarding', '/auth'];

export function BottomNav() {
  const pathname = usePathname() || '/';
  if (HIDDEN.some((h) => pathname.startsWith(h))) return null;

  return (
    <nav
      aria-label="التنقل الرئيسي"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/10 bg-neutral-900/92 p-1.5 shadow-float backdrop-blur-xl sm:gap-2 sm:p-2 dark:bg-neutral-900/95">
        {ITEMS.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'group relative flex items-center justify-center gap-2 rounded-full transition-all duration-300',
                active
                  ? 'bg-primary text-primary-foreground shadow-glow'
                  : 'text-white/55 hover:bg-white/10 hover:text-white',
                // الجوال: أيقونة فقط. سطح المكتب: أيقونة + تسمية للعنصر النشط
                active ? 'h-12 px-4 sm:px-5' : 'size-12',
              )}
            >
              <Icon className="size-[20px] shrink-0" strokeWidth={active ? 2.2 : 1.9} />
              {active && <span className="hidden text-[13px] font-semibold sm:inline">{label}</span>}
              <span className="sr-only">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
