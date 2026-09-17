'use client';

/**
 * StickyPlanBar — زرّ «خطّط رحلتي» العائم على الشاشات الصغيرة.
 *
 * لماذا يوجد أصلاً؟ شريط التنقّل السفلي كبسولة معتمة ثابتة (z-50) تطفو فوق
 * المحتوى. على شاشة الجوال يبلغ عرضها أكثر من نصف الشاشة، فإذا توقّف
 * التمرير والزرّ الأساسي تحتها ابتلعت الكبسولةُ اللمسةَ ولم يستجب الزر —
 * والمستخدم يظنّه معطّلاً. لا يمكن حلّها بـ z-index: الكبسولة تُرسم بعد
 * المحتوى في التخطيط الجذري، ورفع الزر فوقها يجعله يتداخل معها بصرياً.
 *
 * الحلّ: مراقبة الزر داخل البطاقة عبر IntersectionObserver مع `rootMargin`
 * سفلي سالب يقتطع شريط التنقّل من منطقة الرصد. فمتى دخل الزرُّ ذلك الشريط
 * (أو غاب عن الشاشة) اعتُبر غير قابل للّمس، وظهر هذا الشريط فوق التنقّل
 * مباشرة ليبقى الإجراء الأساسي على بُعد لمسة واحدة دائماً.
 */

import * as React from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

/** ارتفاع كبسولة التنقّل + هامشها السفلي — المنطقة التي لا تصلها اللمسة. */
const NAV_STRIP = 96;

export function StickyPlanBar({
  href,
  name,
  price,
  /** معرّف الزر الأصلي داخل البطاقة الجانبية. */
  watch = 'plan-cta',
}: {
  href: string;
  name: string;
  price: string;
  watch?: string;
}) {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    const target = document.getElementById(watch);
    if (!target) return;

    const io = new IntersectionObserver(
      ([entry]) => setShow(!entry.isIntersecting),
      { rootMargin: `0px 0px -${NAV_STRIP}px 0px`, threshold: 0 },
    );
    io.observe(target);
    return () => io.disconnect();
  }, [watch]);

  return (
    <div
      className={cn(
        'fixed inset-x-0 z-40 px-4 transition-all duration-300 lg:hidden',
        show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-6 opacity-0',
      )}
      style={{ bottom: `calc(${NAV_STRIP / 16}rem + env(safe-area-inset-bottom))` }}
    >
      <div className="mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-border/60 bg-card/95 p-2.5 shadow-card-lg backdrop-blur-xl">
        <div className="min-w-0 ps-2">
          <p className="text-[10px] text-muted-foreground">تبدأ من</p>
          <p className="truncate text-sm font-bold text-primary">{price}</p>
        </div>
        <Link
          href={href}
          className="inline-flex flex-1 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-transform active:scale-95"
        >
          <Sparkles className="size-4" />
          خطّط رحلتي إلى {name}
        </Link>
      </div>
    </div>
  );
}
