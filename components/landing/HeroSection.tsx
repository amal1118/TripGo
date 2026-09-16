'use client';

/**
 * HeroSection — المشهد الافتتاحي.
 *
 * الخلفية: فيديو طيران فوق بحر من الغيوم، مُدفّأ لونياً عبر CSS ليطابق
 * الهوية. أربع دقات يختار المتصفح أنسبها، وصورة غلاف محلية تظهر فوراً،
 * والفيديو يتوقف خارج الشاشة ولا يُحمَّل عند تفضيل تقليل الحركة.
 *
 * البطاقات: مروحة ثلاثية الأبعاد (coverflow) فوق حاوية تمرير أصلية، فتعمل
 * باللمس والسحب بالفأرة ولوحة المفاتيح، مع شرائح تصفية حسب المنطقة.
 */

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Bookmark, ArrowLeft, Sparkles, Star } from 'lucide-react';
import { HERO_DESTINATIONS, HERO_REGIONS, FEATURED_INDEX, unsplash, type Destination } from '@/lib/destinations';
import { HERO_VIDEO, HERO_VIDEO_FILTER } from '@/lib/media';
import { useDragScroll } from '@/lib/hooks/useDragScroll';
import { useCoverflow } from '@/lib/hooks/useCoverflow';
import { cn } from '@/lib/utils';

export function HeroSection() {
  const [region, setRegion] = React.useState('الكل');
  const { ref: track, dragging, index, scrollToIndex } = useDragScroll<HTMLDivElement>();
  const { repaint } = useCoverflow(track);

  const destinations = React.useMemo(
    () => (region === 'الكل' ? HERO_DESTINATIONS : HERO_DESTINATIONS.filter((d) => d.region === region)),
    [region],
  );

  /** تغيير التصفية يُعيد الصف لبدايته ويُعيد حساب المروحة. */
  const pickRegion = React.useCallback(
    (r: string) => {
      setRegion(r);
      requestAnimationFrame(() => {
        track.current?.scrollTo({ left: 0, behavior: 'smooth' });
        repaint();
      });
    },
    [track, repaint],
  );

  /**
   * فتح الصفحة على الوجهة المميّزة فتتوزّع البطاقات على جانبيها.
   *
   * إطار واحد لا يكفي: التوسيط يعتمد على عرض البطاقة الفعلي، وقد يجري
   * قبل استقرار التخطيط (الخطوط والصور) فيعود المتصفح بالتمرير إلى الصفر.
   * لذلك نعيد المحاولة مرتين، ونتوقف فور أن يلمس المستخدم الصف بنفسه.
   */
  React.useEffect(() => {
    const target = Math.max(0, FEATURED_INDEX);
    if (!target) return;

    let cancelled = false;
    const timers: number[] = [];

    const settle = () => {
      const el = track.current;
      // إن كان المستخدم قد مرّر بنفسه فلا نخطف تمريره
      if (cancelled || !el || Math.abs(el.scrollLeft) > 4) return;
      scrollToIndex(target, 'auto');
    };

    timers.push(window.requestAnimationFrame(settle));
    timers.push(window.setTimeout(settle, 120));
    timers.push(window.setTimeout(settle, 400));

    return () => {
      cancelled = true;
      cancelAnimationFrame(timers[0]);
      timers.slice(1).forEach(clearTimeout);
    };
  }, [scrollToIndex, track]);

  const active = Math.min(index, destinations.length - 1);

  /**
   * الانتقال بفهرس محدد لا بإزاحة نسبية: مع scroll-snap الإلزامي تهبط
   * الإزاحة النسبية أحياناً بين نقطتي التقاط فيصحّحها المتصفح لنقطة
   * مجاورة، فلا يعود الضغط على "السابق" إلى الموضع نفسه بالضبط.
   */
  const step = React.useCallback(
    (dir: 1 | -1) => scrollToIndex(Math.min(destinations.length - 1, Math.max(0, active + dir))),
    [active, destinations.length, scrollToIndex],
  );

  return (
    <section className="relative flex min-h-[100svh] w-full flex-col overflow-hidden bg-neutral-950 text-white">
      <HeroBackdrop />

      <div className="relative z-10 mx-auto flex w-full max-w-[1500px] flex-1 flex-col justify-end px-5 pb-32 pt-12 sm:px-8 sm:pb-28 sm:pt-16 lg:justify-center lg:px-14 lg:pb-24 lg:pt-24">
        <div className="grid items-center gap-5 sm:gap-7 lg:grid-cols-12 lg:gap-10">
          {/* ---------- النص ---------- */}
          <div className="min-w-0 lg:col-span-5">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-white/90 backdrop-blur-md t-eyebrow">
              <Sparkles className="size-3.5 text-sand-300" />
              رحلات يرسمها الذكاء الاصطناعي
            </span>

            <h1 className="t-display text-white max-sm:!text-[2.05rem] max-sm:!leading-[1.1]">
              WONDERS
              <br />
              <span className="italic text-sand-200">of the</span> WORLD
            </h1>

            <p className="mt-3 max-w-md font-bold leading-snug text-white/95 t-h2 max-sm:text-[1.15rem] sm:mt-4">
              اكتشف عجائب العالم بخطة مصمّمة لك وحدك
            </p>

            <p className="mt-3 hidden max-w-lg text-white/70 t-body sm:block">
              أخبرنا بوجهتك وميزانيتك واهتماماتك، ونُسلّمك خط سير كامل موزّعاً يوماً بيوم.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2.5 sm:mt-7 sm:gap-3">
              <Link
                href="/plan/new"
                className="group inline-flex flex-1 items-center justify-center gap-2.5 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-float sm:px-7 sm:py-4 transition-all hover:brightness-110 active:scale-[0.98] sm:flex-none"
              >
                خطّط لرحلتك
                <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
              </Link>
              <Link
                href="/destinations"
                className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-5 py-3.5 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-white/20 sm:px-6 sm:py-4"
              >
                تصفّح الوجهات
              </Link>
            </div>
          </div>

          {/* ---------- المروحة ---------- */}
          <div className="min-w-0 lg:col-span-7">
            {/* شرائح التصفية */}
            <div className="scrollbar-none -mx-5 mb-4 flex gap-2 overflow-x-auto px-5 sm:-mx-8 sm:px-8 lg:mx-0 lg:justify-center lg:px-0">
              {HERO_REGIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => pickRegion(r)}
                  aria-pressed={region === r}
                  className={cn(
                    'shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-medium transition-all active:scale-95',
                    region === r
                      ? 'bg-white text-neutral-900 shadow-card'
                      : 'border border-white/20 bg-white/10 text-white/80 backdrop-blur-md hover:bg-white/20',
                  )}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* الصف: perspective على الحاوية حتى يظهر الميلان مجسّماً */}
            <div
              ref={track}
              className={cn(
                'scrollbar-none -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-[calc(50%-114px)] py-3 [perspective:1400px] sm:-mx-8 sm:px-[calc(50%-134px)]',
                dragging ? 'cursor-grabbing select-none [scroll-snap-type:none]' : 'lg:cursor-grab',
              )}
            >
              {destinations.map((d) => (
                <HeroCard key={d.id} destination={d} />
              ))}
            </div>

            {/* أدوات التحكم — داخل كبسولة داكنة لأنها قد تقع فوق غيوم
                ساطعة أو فوق منطقة التلاشي نحو لون الصفحة الفاتح. */}
            <div className="mt-3 flex justify-center">
              <div className="flex items-center gap-4 rounded-full bg-neutral-900/50 px-3 py-1.5 backdrop-blur-md">
                <NavButton label="السابق" onClick={() => step(-1)}>
                  <ChevronRight className="size-[18px]" />
                </NavButton>

                <span className="num text-[12px] tracking-[0.2em] text-white/75" dir="ltr">
                  <span className="font-bold text-white">{String(active + 1).padStart(2, '0')}</span>
                  <span className="mx-1.5 text-white/40">/</span>
                  <span>{String(destinations.length).padStart(2, '0')}</span>
                </span>

                <NavButton label="التالي" onClick={() => step(1)}>
                  <ChevronLeft className="size-[18px]" />
                </NavButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 h-14 w-full bg-gradient-to-b from-transparent to-[hsl(var(--canvas))]" />
    </section>
  );
}

/* ================= الخلفية ================= */

const HeroBackdrop = React.memo(function HeroBackdrop() {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [reduced, setReduced] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  /** إيقاف الفيديو خارج الشاشة — يوفّر البطارية وفكّ الترميز. */
  React.useEffect(() => {
    const v = videoRef.current;
    if (!v || reduced) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) void v.play().catch(() => {}); else v.pause(); },
      { threshold: 0.05 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, [reduced]);

  return (
    <div className="absolute inset-0 z-0">
      <Image
        src={HERO_VIDEO.poster}
        alt={HERO_VIDEO.alt}
        fill
        priority
        sizes="100vw"
        style={{ filter: HERO_VIDEO_FILTER }}
        className="object-cover object-center"
      />

      {!reduced && (
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
          poster={HERO_VIDEO.poster}
          aria-hidden
          style={{ filter: HERO_VIDEO_FILTER }}
          className="absolute inset-0 size-full object-cover object-center"
        >
          <source src={HERO_VIDEO.fhd} media="(min-width: 1600px)" type="video/mp4" />
          <source src={HERO_VIDEO.hd} media="(min-width: 1024px)" type="video/mp4" />
          <source src={HERO_VIDEO.md} media="(min-width: 640px)" type="video/mp4" />
          <source src={HERO_VIDEO.sd} type="video/mp4" />
        </video>
      )}

      {/* الغيوم ساطعة، فالحجب هنا أثقل مما كان مع المشاهد الداكنة */}
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/96 via-neutral-950/80 to-neutral-950/55 lg:bg-gradient-to-l lg:from-neutral-950/95 lg:via-neutral-950/72 lg:to-neutral-950/38" />
      <div
        aria-hidden
        className="absolute inset-0 mix-blend-soft-light"
        style={{ background: 'radial-gradient(75% 60% at 50% 100%, hsl(24 85% 58% / 0.6), transparent 70%)' }}
      />
    </div>
  );
});

/* ================= البطاقة ================= */

const HeroCard = React.memo(function HeroCard({ destination: d }: { destination: Destination }) {
  const [saved, setSaved] = React.useState(false);

  return (
    /* الغلاف الخارجي = عنصر الالتقاط: يبقى بلا تحويل حتى لا تنزاح نقاط
       scroll-snap. الطبقة الداخلية هي التي تميل وتصغر (انظر useCoverflow). */
    <article
      data-active="false"
      className="h-[318px] w-[228px] shrink-0 snap-center sm:h-[420px] sm:w-[268px]"
    >
      <div className="group relative size-full overflow-hidden rounded-[30px] border border-white/15 shadow-float will-change-transform [backface-visibility:hidden] [transform-style:preserve-3d]">
        <Image
          src={unsplash(d.image, 560, 880)}
          alt={d.name}
          fill
          sizes="(max-width: 640px) 228px, 268px"
          draggable={false}
          className="pointer-events-none object-cover"
        />

        {/* حجب متدرّج يضمن قراءة النص فوق أي صورة */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/55 to-neutral-950/10" />

        {d.featured && (
          <span className="absolute start-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground shadow-card">
            <Star className="size-3 fill-current" />
            الوجهة الأكثر تفضيلاً
          </span>
        )}

        {/* الرابط يغطي البطاقة كاملة (stretched link): زرّ الحفظ فوقه بـ z أعلى.
            سحب الصف لا يفتح الرابط — useDragScroll يبتلع النقرة بعد السحب. */}
        <Link
          href={`/destinations/${d.id}`}
          aria-label={`تفاصيل ${d.name}`}
          className="absolute inset-0 z-10"
        />

        <div className="pointer-events-none absolute inset-x-4 bottom-4 z-10 sm:inset-x-5 sm:bottom-5">
          <span className="mb-1.5 block text-[11px] font-medium text-white/65">{d.spot}</span>

          <h3 className="font-display text-[19px] font-bold leading-[1.25] text-white sm:text-[21px]">{d.name}</h3>

          <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-white/70 sm:mt-2 sm:text-[12.5px]">
            {d.description}
          </p>

          <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/15 pt-3 sm:mt-4 sm:pt-3.5">
            <button
              type="button"
              onClick={() => setSaved((v) => !v)}
              aria-label={saved ? 'إزالة من المحفوظات' : 'حفظ الوجهة'}
              aria-pressed={saved}
              className="pointer-events-auto relative z-20 grid size-9 shrink-0 place-items-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/25 active:scale-90"
            >
              <Bookmark className={cn('size-4', saved && 'fill-current text-sand-300')} />
            </button>

            <span className="truncate text-[12px] font-semibold text-sand-300">{d.recommendedDays}</span>
          </div>
        </div>
      </div>
    </article>
  );
});

function NavButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid size-10 place-items-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/30 active:scale-95"
    >
      {children}
    </button>
  );
}
