import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowRight, ArrowLeft, Star, MapPin, CalendarDays, Plane, Sun, Wallet,
  Languages, BadgeCheck, Coins, Sparkles, Lightbulb, Compass, ExternalLink,
} from 'lucide-react';
import {
  DESTINATIONS, EXPLORE_CATEGORIES, getDestination, getRelated, planUrl, unsplash,
} from '@/lib/destinations';
import { DestinationCard } from '@/components/destinations/DestinationCard';
import { StickyPlanBar } from '@/components/destinations/StickyPlanBar';
import { ScreenLogo } from '@/components/shell/ScreenLogo';
import { mapsUrl } from '@/lib/images';
import { formatPrice } from '@/lib/utils';

interface Props { params: { slug: string } }

/** الوجهات ثابتة في الكود، فتُبنى الصفحات العشرون مسبقاً بلا أي طلب وقت التشغيل. */
export function generateStaticParams() {
  return DESTINATIONS.map((d) => ({ slug: d.id }));
}

export function generateMetadata({ params }: Props): Metadata {
  const d = getDestination(params.slug);
  if (!d) return { title: 'وجهة غير موجودة' };
  return {
    title: `${d.name}، ${d.country}`,
    description: `${d.tagline} — ${d.description}`,
    openGraph: {
      title: `${d.name}، ${d.country} · TripGo`,
      description: d.tagline,
      images: [unsplash(d.image, 1200, 630)],
      type: 'article',
    },
  };
}

/* ======================== الصفحة ======================== */

export default function DestinationPage({ params }: Props) {
  const d = getDestination(params.slug);
  if (!d) notFound();

  const related = getRelated(d.id, 3);
  const categories = EXPLORE_CATEGORIES.filter(
    (c) => c.id !== 'all' && d.categories.includes(c.id as never),
  );

  const facts = [
    { icon: Sun, label: 'أفضل موسم', value: d.facts.bestTime },
    { icon: CalendarDays, label: 'المدة الموصى بها', value: d.recommendedDays },
    { icon: Plane, label: 'زمن الطيران', value: d.facts.flightTime },
    { icon: Wallet, label: 'تبدأ من', value: `${formatPrice(d.priceFrom, d.currency)} للشخص` },
    { icon: Sun, label: 'الطقس', value: d.facts.weather },
    { icon: Languages, label: 'اللغة', value: d.facts.language },
    { icon: Coins, label: 'العملة', value: d.facts.localCurrency },
    { icon: BadgeCheck, label: 'التأشيرة', value: d.facts.visa },
  ];

  return (
    <main className="canvas min-h-dvh pb-36">
      {/* ---------------- الغلاف ---------------- */}
      <section className="relative h-[62svh] min-h-[420px] w-full overflow-hidden bg-neutral-950 text-white">
        <Image
          src={unsplash(d.image, 1800, 1100)}
          alt={`${d.name} — ${d.country}`}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/55 to-neutral-950/25" />

        <ScreenLogo className="absolute inset-x-0 top-[max(1rem,env(safe-area-inset-top))] z-10" />

        <div className="relative z-10 mx-auto flex h-full w-full max-w-[1500px] flex-col justify-between px-5 pb-10 pt-8 sm:px-8 lg:px-14">
          <Link
            href="/destinations"
            className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-[13px] font-medium backdrop-blur-md transition-colors hover:bg-white/20"
          >
            <ArrowRight className="size-4" />
            كل الوجهات
          </Link>

          <div className="max-w-3xl">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground">
                {d.region}
              </span>
              {categories.map((c) => (
                <span
                  key={c.id}
                  className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[11px] font-medium backdrop-blur-md"
                >
                  {c.label}
                </span>
              ))}
              {d.featured && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sand-300 px-3 py-1.5 text-[11px] font-semibold text-neutral-900">
                  <Star className="size-3 fill-current" />
                  الوجهة الأكثر تفضيلاً
                </span>
              )}
            </div>

            <p className="mb-2 flex items-center gap-1.5 text-white/75 t-sm">
              <MapPin className="size-4" />
              {d.spot} · {d.country}
            </p>

            <h1 className="t-display !text-[clamp(2rem,5vw,3.75rem)] text-white">{d.name}</h1>
            <p className="mt-3 max-w-2xl text-white/85 t-body">{d.tagline}</p>

            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 t-sm">
              <span className="flex items-center gap-1.5">
                <Star className="size-4 fill-sand-300 text-sand-300" />
                <span className="num font-bold text-sand-200">{d.rating}</span>
                <span className="text-white/65">({d.reviews} تقييم)</span>
              </span>
              <span className="flex items-center gap-1.5 text-white/80">
                <CalendarDays className="size-4" />
                {d.recommendedDays}
              </span>
              <span className="flex items-center gap-1.5 text-white/80">
                <Wallet className="size-4" />
                تبدأ من <span className="font-bold text-sand-200">{formatPrice(d.priceFrom, d.currency)}</span> للشخص
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1500px] px-5 sm:px-8 lg:px-14">
        {/* ---------------- شريط الحقائق ---------------- */}
        {/* gap-px فوق خلفية بلون الحدّ يرسم شبكة فواصل نظيفة — الحدود المفردة
            على كل خلية تتضاعف أو تنكسر عند تغيّر عدد الأعمدة. */}
        <div className="card-warm relative z-10 -mt-8 grid gap-px overflow-hidden bg-border/60 shadow-card-lg sm:grid-cols-2 lg:grid-cols-4">
          {facts.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex gap-3 bg-card p-5">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10">
                <Icon className="size-[18px] text-primary" />
              </span>
              <div className="min-w-0">
                <p className="t-eyebrow text-muted-foreground">{label}</p>
                <p className="mt-1 text-[13px] font-semibold leading-relaxed">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ---------------- المحتوى ---------------- */}
        <div className="mt-10 grid items-start gap-8 lg:grid-cols-12">
          <div className="min-w-0 space-y-10 lg:col-span-8">
            {/* عن الوجهة */}
            <section>
              <h2 className="t-h2 mb-4">عن {d.name}</h2>
              <div className="space-y-4">
                {d.about.map((p) => (
                  <p key={p.slice(0, 24)} className="t-body text-muted-foreground">{p}</p>
                ))}
              </div>
            </section>

            {/* المعرض */}
            <section>
              <h2 className="t-h2 mb-4">من الوجهة</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {d.gallery.map((id, i) => (
                  <div key={id} className="relative aspect-[16/10] overflow-hidden rounded-2xl sm:aspect-[3/4]">
                    <Image
                      src={unsplash(id, 640, 800)}
                      alt={`${d.name} — صورة ${i + 1}`}
                      fill
                      sizes="(max-width: 640px) 100vw, 320px"
                      className="object-cover transition-transform duration-700 hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* أبرز المعالم */}
            <section>
              <h2 className="t-h2 mb-4">أبرز ما تراه</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {d.highlights.map((h, i) => (
                  <article key={h.title} className="card-warm p-5">
                    <span className="num mb-3 block text-sm font-bold text-primary/70">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className="t-h3 mb-2">{h.title}</h3>
                    <p className="t-sm text-muted-foreground">{h.body}</p>
                  </article>
                ))}
              </div>
            </section>

            {/* تجارب مقترحة */}
            <section>
              <h2 className="t-h2 mb-4">تجارب مقترحة</h2>
              <ul className="card-warm divide-y divide-border/60 overflow-hidden">
                {d.experiences.map((e) => (
                  <li key={e} className="flex items-center gap-4 p-5">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10">
                      <Sparkles className="size-4 text-primary" />
                    </span>
                    <span className="t-sm">{e}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* نصائح */}
            <section>
              <h2 className="t-h2 mb-4">قبل أن تسافر</h2>
              <ul className="space-y-3">
                {d.tips.map((t) => (
                  <li key={t} className="flex gap-4 rounded-2xl bg-secondary/60 p-5">
                    <Lightbulb className="mt-0.5 size-5 shrink-0 text-primary" />
                    <span className="t-sm">{t}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* ---------------- العمود الجانبي ---------------- */}
          <aside className="min-w-0 lg:col-span-4 lg:sticky lg:top-6">
            <div className="card-warm p-6 shadow-card-lg">
              <p className="t-eyebrow text-muted-foreground">رحلة إلى</p>
              <p className="mt-1 font-display text-2xl font-bold">{d.name}</p>

              <div className="my-5 space-y-3 border-y border-border/60 py-5">
                <Row label="المدة المقترحة" value={d.recommendedDays} />
                <Row label="أفضل موسم" value={d.facts.bestTime} />
                <Row label="تبدأ من" value={`${formatPrice(d.priceFrom, d.currency)} / للشخص`} strong />
              </div>

              <p className="mb-5 t-sm text-muted-foreground">
                يبني المساعد الذكي خطّة كاملة لهذه الوجهة: طيران وإقامة ومطاعم وتجارب، موزّعة يوماً بيوم
                حسب ميزانيتك واهتماماتك.
              </p>

              <Link
                id="plan-cta"
                href={planUrl(d)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:-translate-y-0.5 hover:brightness-110"
              >
                <Sparkles className="size-[18px]" />
                خطّط رحلتي إلى {d.name}
              </Link>

              <a
                href={mapsUrl(`${d.nameEn} ${d.country}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-secondary py-3.5 text-sm font-semibold transition-colors hover:bg-accent"
              >
                <MapPin className="size-4" />
                الموقع على الخريطة
                <ExternalLink className="size-3.5 text-muted-foreground" />
              </a>
            </div>
          </aside>
        </div>

        {/* ---------------- وجهات قريبة ---------------- */}
        {related.length > 0 && (
          <section className="mt-16">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="t-h2 flex items-center gap-2">
                <Compass className="size-5 text-primary" />
                وجهات قد تعجبك أيضاً
              </h2>
              <Link href="/destinations" className="group inline-flex shrink-0 items-center gap-1.5 text-[13px] font-semibold text-primary hover:underline">
                عرض الكل
                <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
              </Link>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {related.map((r) => <DestinationCard key={r.id} destination={r} />)}
            </div>
          </section>
        )}
      </div>

      <StickyPlanBar
        href={planUrl(d)}
        name={d.name}
        price={formatPrice(d.priceFrom, d.currency)}
      />
    </main>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 t-sm text-muted-foreground">{label}</span>
      <span className={strong ? 'text-end text-[13px] font-bold text-primary' : 'text-end text-[13px] font-semibold'}>
        {value}
      </span>
    </div>
  );
}
