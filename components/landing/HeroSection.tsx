'use client';

/**
 * HeroSection — المشهد الافتتاحي.
 *
 * الخلفية: فيديو طيران فوق بحر من الغيوم، مُدفّأ لونياً عبر CSS ليطابق
 * الهوية. أربع دقات يختار المتصفح أنسبها، وصورة غلاف محلية تظهر فوراً،
 * والفيديو يتوقف خارج الشاشة ولا يُحمَّل عند تفضيل تقليل الحركة.
 *
 * البطاقات: مروحة ثلاثية الأبعاد (coverflow) فوق حاوية تمرير أصلية، فتعمل
 * باللمس والسحب بالفأرة ولوحة المفاتيح. البطاقة الوسطى هي البطل: أكبر حجماً
 * وفي المقدمة، وما حولها يصغر ويغوص خلفها. كل المقادير نسبة من عرض بطاقة
 * مرن (clamp) فتتدرّج من الجوال إلى الشاشة الكبيرة.
 *
 * لا شرائح تصفية ولا مُرقِّم: المشهد الافتتاحي يعرض الوجهات ولا يُدير
 * تصفّحها — السحب واللمس وعجلة التمرير تكفي، والتصفية مكانها /destinations.
 *
 * العتمة: لا ظلّ خاصاً بكل بطاقة (كانت حوافه تُرى كبقعة فوق الغيوم)، بل
 * هالة واحدة واسعة تسبح خلف المروحة وتذوب في تدرّجات القسم نفسه.
 */

import * as React from 'react';
import Image from 'next/image';
import { TripGoLogo } from '@/components/brand/TripGoLogo';
import Link from 'next/link';
import { Bookmark, ArrowLeft, Sparkles, Star } from 'lucide-react';
import { HERO_DESTINATIONS, FEATURED_INDEX, unsplash, type Destination } from '@/lib/destinations';
import { HERO_VIDEO, HERO_VIDEO_FILTER } from '@/lib/media';
import { useDragScroll } from '@/lib/hooks/useDragScroll';
import { useCoverflow } from '@/lib/hooks/useCoverflow';
import { cn } from '@/lib/utils';

export function HeroSection() {
  const { ref: track, dragging, scrollToIndex } = useDragScroll<HTMLDivElement>();
  useCoverflow(track);

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

  return (
    <section className="relative flex min-h-[100svh] w-full flex-col overflow-hidden bg-neutral-950 text-white">
      <HeroBackdrop />

      {/* الشعار — ثابت أعلى المشهد، حجمه يتدرّج من الجوال إلى سطح المكتب */}
      <Link
        href="/"
        aria-label="TripGo"
        className="absolute start-5 top-[max(1.25rem,env(safe-area-inset-top))] z-20 block text-white sm:start-8 lg:start-14"
      >
        <TripGoLogo className="h-7 w-auto sm:h-8 lg:h-9" />
      </Link>

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
              اكتشف عجائب العالم بخطة مصممة لك وحدك
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
          <div className="relative min-w-0 lg:col-span-7">
            {/* الهالة: عتمة واحدة تحلّ محلّ ظلّ كل بطاقة على حدة.

                ظلّ البطاقة كان يُقرأ بقعةً لها حدّ فوق الغيوم الساطعة. هذه
                الهالة أوسع من المروحة بمرّة ونصف وتنتهي شفافة تماماً، فلا
                حافة لها، وتندمج مع تدرّجات القسم فتبدو جزءاً من المشهد. */}
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[150%] w-[155%] -translate-x-1/2 -translate-y-1/2 blur-2xl"
              style={{
                background:
                  'radial-gradient(closest-side, hsl(20 30% 4% / 0.62), hsl(20 30% 4% / 0.3) 52%, transparent 78%)',
              }}
            />

            {/* الصف: perspective على الحاوية حتى يظهر الميلان مجسّماً.

                المقاس كلّه معلّق على متغيّرين: --card-w مرن بـ clamp، و--card-h
                مشتقّ منه بنسبة ثابتة. الحشوة الجانبية والمروحة (useCoverflow)
                تقرآن العرض نفسه، فيبقى التوسيط والتراكب صحيحين عند أي شاشة.

                لماذا نُضيف عرض الهامش السالب إلى الحشوة؟ لأن نسبة الحشوة
                تُحسب من عرض الأب بينما التوسيط يجري إلى منتصف الصف نفسه
                (الأب + الهامشين)، فبدونها تقف البطاقة الأولى منزاحة قليلاً. */}
            <div
              ref={track}
              className={cn(
                'scrollbar-none -mx-5 flex snap-x snap-mandatory overflow-x-auto sm:-mx-8',
                '[--card-w:clamp(198px,57vw,248px)] sm:[--card-w:clamp(248px,33vw,288px)] lg:[--card-w:clamp(252px,19vw,300px)]',
                '[--card-h:calc(var(--card-w)_*_1.45)] sm:[--card-h:calc(var(--card-w)_*_1.52)]',
                'gap-[clamp(10px,2.2vw,18px)] py-4 sm:py-7',
                'px-[calc(50%_+_1.25rem_-_var(--card-w)_/_2)] sm:px-[calc(50%_+_2rem_-_var(--card-w)_/_2)]',
                '[perspective:1400px] [perspective-origin:50%_46%]',
                // تلاشٍ عند الطرفين بدل القصّ الحادّ لحافة الحاوية
                '[-webkit-mask-image:linear-gradient(to_right,transparent,#000_7%,#000_93%,transparent)]',
                '[mask-image:linear-gradient(to_right,transparent,#000_7%,#000_93%,transparent)]',
                dragging ? 'cursor-grabbing select-none [scroll-snap-type:none]' : 'lg:cursor-grab',
              )}
            >
              {HERO_DESTINATIONS.map((d) => (
                <HeroCard key={d.id} destination={d} />
              ))}
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
      ([entry]) => { if (entry.isIntersecting) void v.play().catch(() => { }); else v.pause(); },
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
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/95 via-neutral-950/80 to-neutral-950/55 lg:bg-gradient-to-l lg:from-neutral-950/95 lg:via-neutral-950/70 lg:to-neutral-950/40" />
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
      className="group/card h-[var(--card-h)] w-[var(--card-w)] shrink-0 snap-center"
    >
      {/* لا ظلّ خارجياً هنا: العتمة كلّها في هالة القسم. البطاقة الوسطى
          تتميّز بحدّ أوضح فقط، والباقي يتكفّل به الحجم والعمق والضبابية. */}
      <div className="group relative size-full overflow-hidden rounded-[26px] border border-white/15 transition-colors duration-500 will-change-transform [backface-visibility:hidden] [transform-style:preserve-3d] group-data-[active=true]/card:border-white/35 sm:rounded-[30px]">
        <Image
          src={unsplash(d.image, 560, 880)}
          alt={d.name}
          fill
          sizes="(max-width: 640px) 57vw, (max-width: 1024px) 33vw, 300px"
          draggable={false}
          className="pointer-events-none object-cover"
        />

        {/* حجب متدرّج يضمن قراءة النص فوق أي صورة */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/55 to-neutral-950/10" />

        {d.featured && (
          <span className="absolute start-3.5 top-3.5 z-10 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-primary px-2.5 py-1.5 text-[10.5px] font-semibold text-primary-foreground shadow-card sm:start-4 sm:top-4 sm:px-3 sm:text-[11px]">
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
