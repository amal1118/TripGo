import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { DESTINATIONS } from '@/lib/destinations';
import { DestinationsExplorer } from '@/components/destinations/DestinationsExplorer';
import { ScreenLogo } from '@/components/shell/ScreenLogo';

export const metadata: Metadata = {
  title: 'الوجهات المقترحة',
  description: `${DESTINATIONS.length} وجهة سياحية مختارة حول العالم — تفاصيل كل وجهة وأفضل موسم لها وتكلفتها التقريبية، مع خطة جاهزة بالذكاء الاصطناعي.`,
};

/**
 * صفحة كل الوجهات المقترحة.
 * الترويسة تُرسل HTML جاهزاً (Server)، والتصفية وحدها تفاعلية على العميل.
 */
export default function DestinationsPage() {
  return (
    <main className="canvas min-h-dvh">
      <div className="mx-auto w-full max-w-[1500px] px-5 pb-36 pt-8 sm:px-8 sm:pt-12 lg:px-14">
        {/* ---------- الترويسة ---------- */}
        <header className="mb-9">
          <ScreenLogo className="mb-6" />
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowRight className="size-4" />
            العودة للرئيسية
          </Link>

          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <span className="t-eyebrow mb-3 flex items-center gap-2 text-primary">
                <span className="size-1.5 rounded-full bg-primary" />
                الوجهات المقترحة
              </span>
              <h1 className="t-h1 text-balance">
                <span className="num">{DESTINATIONS.length}</span> وجهة اخترناها بعناية، من كثبان العُلا إلى قمم باتاغونيا
              </h1>
              <p className="mt-4 t-body text-muted-foreground">
                لكل وجهة صفحة كاملة: أفضل موسم للزيارة، أبرز المعالم، تجارب مقترحة، ونصائح عملية —
                ثم خطّة يوماً بيوم يبنيها المساعد الذكي على مقاسك.
              </p>
            </div>

            <Link
              href="/plan/new"
              className="inline-flex w-fit shrink-0 items-center gap-2.5 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:-translate-y-0.5 hover:brightness-110"
            >
              <Sparkles className="size-4" />
              لديك وجهة أخرى؟ خطّط لها
            </Link>
          </div>
        </header>

        <DestinationsExplorer />
      </div>
    </main>
  );
}
