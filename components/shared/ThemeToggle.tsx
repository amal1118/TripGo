'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * زر واحد لتبديل المظهر، مكانه الشريط السفلي فيظهر في كل الصفحات.
 *
 * الأيقونة تدلّ على الوجهة لا على الحالة: قمر = انتقل إلى الداكن،
 * وشمس = انتقل إلى الفاتح. قبل التركيب يُعرض القمر على الخادم والعميل معاً
 * فلا يحدث تعارض ترطيب، لأن المظهر الفعلي لا يُعرف إلا في المتصفح.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === 'dark';
  const label = isDark ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن';

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'grid size-12 shrink-0 place-items-center rounded-full text-primary transition-colors hover:bg-primary/15',
        className,
      )}
    >
      {isDark ? <Sun className="size-[20px]" /> : <Moon className="size-[20px]" />}
    </button>
  );
}
