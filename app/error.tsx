'use client';

/**
 * حدّ الأخطاء العام.
 * بدونه كان أي استثناء في مكوّن خادم (انقطاع Supabase مثلاً) يُسقط
 * المستخدم على شاشة Next الافتراضية بلا طريق عودة.
 */
import * as React from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function GlobalError({
  error, reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error('[app] unhandled', error);
  }, [error]);

  return (
    <div className="canvas grid min-h-dvh place-items-center px-6 pb-28 text-center">
      <div className="max-w-sm">
        <span className="mx-auto mb-5 grid size-16 place-items-center rounded-3xl bg-primary/10">
          <AlertTriangle className="size-8 text-primary" />
        </span>
        <h1 className="t-h2">حدث خلل غير متوقع</h1>
        <p className="mt-2 t-sm text-muted-foreground">
          لم نتمكّن من عرض هذه الصفحة. جرّب التحديث، وإن تكرّر الأمر فارجع لاحقاً.
        </p>
        {error.digest && (
          <p className="num mt-3 text-[11px] text-muted-foreground/70">رمز الخطأ: {error.digest}</p>
        )}

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform active:scale-95"
          >
            <RotateCcw className="size-4" />
            أعد المحاولة
          </button>
          <Link
            href="/dashboard"
            className="rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold transition-colors hover:bg-secondary"
          >
            رحلاتي
          </Link>
        </div>
      </div>
    </div>
  );
}
