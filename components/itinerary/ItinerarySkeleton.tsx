/**
 * هيكل انتظار صفحة الخطة — يحاكي التخطيط الفعلي (صورة علوية + ورقة
 * منزلقة) فلا تقفز العناصر عند وصول المحتوى.
 *
 * تستخدمه صفحة الرحلة المحفوظة (loading.tsx) وشاشة المعاينة معاً: كلاهما
 * كان يعرض بياضاً أو سطر «جارٍ التحميل…» عارياً بعد توست النجاح مباشرة.
 */
import { Skeleton } from '@/components/ui/skeleton';

export function ItinerarySkeleton() {
  return (
    <div className="canvas min-h-dvh" aria-busy="true" aria-live="polite">
      <span className="sr-only">جارٍ تحميل الخطة…</span>

      {/* الصورة العلوية */}
      <Skeleton className="h-[46svh] min-h-[300px] w-full rounded-none sm:h-[52svh]" />

      {/* الورقة المنزلقة */}
      <div className="relative z-20 -mt-7 rounded-t-[32px] bg-card px-5 pb-40 pt-5 sm:px-8">
        <div className="mx-auto mb-6 h-1.5 w-11 rounded-full bg-border" />

        <div className="mx-auto w-full max-w-[1100px] space-y-7">
          <div className="flex items-start justify-between gap-5">
            <div className="flex-1 space-y-2.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
            <Skeleton className="h-12 w-28 shrink-0" />
          </div>

          {/* نظرة سريعة */}
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[74px] rounded-3xl" />
            ))}
          </div>

          {/* التبويبات */}
          <div className="flex gap-2 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-24 shrink-0 rounded-full" />
            ))}
          </div>

          {/* أيام */}
          <div className="space-y-5">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-3xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
