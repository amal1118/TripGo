/**
 * صفحة 404 بالعربية.
 * بدونها كان `notFound()` يعرض صفحة Next الافتراضية — سطر إنجليزي
 * بمحاذاة يسارية داخل تطبيق عربي بالكامل.
 */
import Link from 'next/link';
import { Compass, ArrowLeft } from 'lucide-react';

export const metadata = { title: 'الصفحة غير موجودة' };

export default function NotFound() {
  return (
    <div className="canvas grid min-h-dvh place-items-center px-6 pb-28 text-center">
      <div className="max-w-sm">
        <span className="mx-auto mb-5 grid size-16 place-items-center rounded-3xl bg-primary/10">
          <Compass className="size-8 text-primary" />
        </span>
        <p className="num t-eyebrow mb-2 text-primary">404</p>
        <h1 className="t-h2">لم نجد هذه الصفحة</h1>
        <p className="mt-2 t-sm text-muted-foreground">
          قد يكون الرابط قديماً، أو الرحلة حُذفت من حسابك.
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform active:scale-95"
          >
            رحلاتي
            <ArrowLeft className="size-4" />
          </Link>
          <Link
            href="/"
            className="rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold transition-colors hover:bg-secondary"
          >
            الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
