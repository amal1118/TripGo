'use client';

/**
 * ExploreSection — لوحة البحث والاكتشاف العائمة فوق حدّ الهيرو.
 *
 * بنيتها: بطاقة بيضاء ناعمة تضم شريط فئات + مربع بحث ذكي، يليها مجموعة
 * محدّدة من بطاقات الوجهات المقترحة (أربع بطاقات) وبطاقة تفصيلية على
 * الجهة المقابلة، ورابط إلى صفحة الوجهات كاملة.
 *
 * شرائح الفئات تُصفّي البطاقات فعلياً من كتالوج الوجهات — لا تغيّر مظهراً
 * فقط. والبحث يمرّر النص إلى /plan/new عبر query param، فتبدأ الخطة
 * مملوءة بدل أن يُعيد المستخدم كتابة رغبته مرتين.
 */

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search, Sparkles, Star, Heart, MapPin, ArrowLeft, CheckCircle2,
  Mountain, Waves, Landmark, Users, Leaf, Compass,
} from 'lucide-react';
import {
  DESTINATIONS, FEATURED_DETAIL, EXPLORE_CATEGORIES, trendingFor, planUrl, unsplash,
} from '@/lib/destinations';
import { DestinationCard } from '@/components/destinations/DestinationCard';
import { formatPrice, cn } from '@/lib/utils';

const ICONS = {
  compass: Compass, mountain: Mountain, waves: Waves,
  landmark: Landmark, users: Users, leaf: Leaf,
} as const;

export function ExploreSection() {
  const router = useRouter();
  const [category, setCategory] = React.useState<string>('all');
  const [query, setQuery] = React.useState('');

  const cards = React.useMemo(() => trendingFor(category, 4), [category]);

  const search = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const q = query.trim();
      router.push(q ? `/plan/new?q=${encodeURIComponent(q)}` : '/plan/new');
    },
    [query, router],
  );

  return (
    <section id="explore" className="canvas relative z-30 -mt-10 px-5 pb-16 sm:px-8 lg:px-14">
      <div className="mx-auto max-w-[1500px]">
        {/* ---------- لوحة البحث ---------- */}
        <div className="card-warm p-5 shadow-card-lg sm:p-8">
          <div className="mb-6 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <span className="t-eyebrow mb-2.5 flex items-center gap-2 text-primary">
                <span className="size-1.5 rounded-full bg-primary" />
                إلى أين تريد أن تذهب؟
              </span>
              <h2 className="t-h1 max-w-lg text-balance">
                استكشف مغامرات منتقاة وملاذات لا يعرفها الكثيرون
              </h2>
            </div>

            {/* فئات التصفية */}
            <div className="scrollbar-none -mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1">
              {EXPLORE_CATEGORIES.map((c) => {
                const Icon = ICONS[c.icon];
                const on = category === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    aria-pressed={on}
                    className={cn(
                      'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2.5 text-[13px] font-semibold transition-all active:scale-95',
                      on
                        ? 'bg-primary text-primary-foreground shadow-glow'
                        : 'bg-secondary text-secondary-foreground hover:bg-accent',
                    )}
                  >
                    <Icon className="size-4" />
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* مربع البحث الذكي */}
          <form
            onSubmit={search}
            className="flex w-full flex-col items-center gap-3 rounded-3xl border border-border/70 bg-secondary/60 p-2.5 md:flex-row md:rounded-full"
          >
            <div className="flex w-full items-center gap-3 px-4 py-1">
              <Search className="size-5 shrink-0 text-primary" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="تشينكوي تيري، قرى ملوّنة وجولات بحرية لمدة 5 أيام…"
                className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
              />
            </div>
            <button
              type="submit"
              className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-foreground px-7 py-3 text-sm font-semibold text-background transition-all hover:opacity-90 md:w-auto md:rounded-full"
            >
              <Sparkles className="size-4 text-primary" />
              خطّط بالذكاء الاصطناعي
            </button>
          </form>
        </div>

        {/* ---------- الشبكة ---------- */}
        <div className="mt-8 grid items-start gap-6 lg:grid-cols-12">
          {/* الوجهات المقترحة */}
          <div className="flex min-w-0 flex-col gap-5 lg:col-span-8">
            <div className="flex items-center justify-between gap-3">
              <h3 className="t-h2 flex items-baseline gap-2">
                وجهات مقترحة
                <span className="text-sm font-normal text-muted-foreground">مختارة لك</span>
              </h3>
              <Link
                href="/destinations"
                className="group inline-flex shrink-0 items-center gap-1.5 text-[13px] font-semibold text-primary hover:underline"
              >
                عرض الكل (<span className="num">{DESTINATIONS.length}</span>)
                <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
              </Link>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {cards.map((d) => <DestinationCard key={d.id} destination={d} />)}
            </div>
          </div>

          {/* البطاقة التفصيلية */}
          <div className="min-w-0 lg:col-span-4">
            <FeaturedCard />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- البطاقة التفصيلية ---------- */

const FeaturedCard = React.memo(function FeaturedCard() {
  const d = FEATURED_DETAIL;
  const [liked, setLiked] = React.useState(true);
  const href = `/destinations/${d.id}`;

  return (
    <article className="card-warm flex flex-col p-5 shadow-card-lg">
      <div className="relative mb-4">
        <button
          type="button"
          onClick={() => setLiked((v) => !v)}
          aria-label={liked ? 'إزالة من المفضلة' : 'أضف للمفضلة'}
          aria-pressed={liked}
          className="absolute bottom-3 end-3 z-10 grid size-10 place-items-center rounded-full bg-white/95 shadow-card transition-transform hover:scale-105 active:scale-95"
        >
          <Heart className={cn('size-[18px]', liked ? 'fill-rose-500 text-rose-500' : 'text-neutral-400')} />
        </button>

        <Link href={href} className="group relative block h-60 overflow-hidden rounded-[22px]">
          <Image
            src={unsplash(d.image, 700, 560)}
            alt={`${d.name} — ${d.country}`}
            fill
            sizes="(max-width: 1024px) 100vw, 420px"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 img-scrim" />

          <div className="absolute inset-x-4 bottom-3 pe-12 text-white">
            <h4 className="font-display text-lg font-semibold leading-snug">{d.name}، {d.country}</h4>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs">
              <Star className="size-3.5 fill-sand-300 text-sand-300" />
              <span className="num font-semibold text-sand-200">{d.rating}</span>
              <span className="text-white/75">({d.reviews} تقييم)</span>
            </div>
          </div>
        </Link>
      </div>

      {/* صفّ المسافرين */}
      <div className="mb-4 flex items-center gap-3 border-b border-border/60 pb-4">
        <div className="flex -space-x-2.5 rtl:space-x-reverse">
          {['photo-1507003211169-0a1dd7228f2d', 'photo-1494790108377-be9c29b29330', 'photo-1500648767791-00dcc994a43e'].map((id) => (
            <span key={id} className="relative size-8 overflow-hidden rounded-full ring-2 ring-card">
              <Image src={unsplash(id, 80, 80)} alt="" fill sizes="32px" className="object-cover" />
            </span>
          ))}
          <span className="grid size-8 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground ring-2 ring-card">
            +4
          </span>
        </div>
        <span className="t-sm text-muted-foreground">حجزها 4 من معارفك مؤخراً</span>
      </div>

      {/* الوصف والسعر */}
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="t-eyebrow">الوصف</span>
        <div className="text-end">
          <span className="block text-[10px] text-muted-foreground">تبدأ من</span>
          <span className="font-display text-2xl font-bold text-primary">{formatPrice(d.priceFrom, d.currency)}</span>
        </div>
      </div>
      <p className="mb-5 t-sm text-muted-foreground">{d.about[0]}</p>

      {/* الخريطة */}
      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-bold">الموقع على الخريطة</span>
          <span className="flex items-center gap-1 text-[11px] font-medium text-primary">
            <MapPin className="size-3.5" />
            {d.country}
          </span>
        </div>
        <div className="relative grid h-20 place-items-center overflow-hidden rounded-2xl border border-primary/20 bg-primary/5">
          <div
            aria-hidden
            className="absolute inset-0 opacity-40"
            style={{ backgroundImage: 'radial-gradient(hsl(var(--primary)) 1px, transparent 1px)', backgroundSize: '12px 12px' }}
          />
          <span className="relative flex items-center gap-2 rounded-full bg-card/90 px-3 py-1.5 text-center text-xs font-medium backdrop-blur-sm">
            <span className="size-2 animate-ping rounded-full bg-primary" />
            {d.spot}
          </span>
        </div>
      </div>

      <div className="mt-auto flex gap-2">
        <Link
          href={href}
          className="inline-flex flex-1 items-center justify-center rounded-2xl bg-secondary py-3.5 text-sm font-semibold transition-colors hover:bg-accent"
        >
          التفاصيل
        </Link>
        <Link
          href={planUrl(d)}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:-translate-y-0.5 hover:brightness-110"
        >
          خطّط رحلتك
          <CheckCircle2 className="size-[18px]" />
        </Link>
      </div>
    </article>
  );
});
