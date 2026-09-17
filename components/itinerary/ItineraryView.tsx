'use client';

/**
 * ItineraryView — شاشة تفاصيل الرحلة على نمط تطبيقات الجوال:
 * صورة بملء العرض في الأعلى (مع زر رجوع ومفضلة وعنوان فوقها)، تليها
 * "ورقة" بيضاء منزلقة بحواف علوية مستديرة تحمل المحتوى، وزر إجراء ثابت
 * أسفل الشاشة فوق شريط التنقل.
 *
 * أداء: خرائط بحث تُبنى مرة واحدة (useMemo)، وكل بطاقة memo،
 * والتبويبات تُركّب محتواها عند التفعيل فقط.
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ChevronRight, Heart, Share2, Check, Star, MapPin, Wallet, Lightbulb,
  CalendarRange, Hotel as HotelIcon, Plane, Utensils, Ticket,
  Landmark as LandmarkIcon, ShoppingBag, Bookmark,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  HotelCard, FlightCard, RestaurantCard, ExperienceCard,
  LandmarkCard, ShoppingCard,
} from './cards';
import { DaysTimeline, EmptyTab, type BlockRef } from './DaysTimeline';
import { ScreenLogo } from '@/components/shell/ScreenLogo';
import { getCardImage } from '@/lib/images';
import { TripDestinationContext } from '@/components/glass/CardImage';
import { unsplash } from '@/lib/destinations';
import { formatPrice, daysAr, cn } from '@/lib/utils';
import type { Itinerary } from '@/types/trip';

const BUDGET_LABELS: Record<keyof Itinerary['budgetBreakdown'], string> = {
  flights: 'الطيران', stay: 'الإقامة', food: 'الطعام',
  activities: 'الأنشطة', shopping: 'التسوق', transport: 'التنقل',
};

/** بطاقات «نظرة سريعة» — المفتاح يطابق اسم المصفوفة في الخطة. */
const STATS = [
  { key: 'days',        label: 'أيام',    icon: CalendarRange },
  { key: 'hotels',      label: 'فنادق',   icon: HotelIcon },
  { key: 'flights',     label: 'رحلات',   icon: Plane },
  { key: 'restaurants', label: 'مطاعم',   icon: Utensils },
  { key: 'experiences', label: 'تجارب',   icon: Ticket },
  { key: 'landmarks',   label: 'معالم',   icon: LandmarkIcon },
] as const;

/** صور رفاق الرحلة — عنصر بصري من مرجع التصميم. */
const COMPANIONS = ['photo-1507003211169-0a1dd7228f2d', 'photo-1494790108377-be9c29b29330', 'photo-1500648767791-00dcc994a43e'];

export function ItineraryView({
  itinerary, tripId, unsaved = false,
}: {
  itinerary: Itinerary; tripId?: string; unsaved?: boolean;
}) {
  const router = useRouter();
  const { meta, days, budgetBreakdown, practicalTips } = itinerary;
  const [saved, setSaved] = React.useState(!unsaved);
  const [copied, setCopied] = React.useState(false);

  /**
   * فهرس refId → العنصر الأصلي. يحمل الفئة واستعلام الصورة أيضاً، فمقاطع
   * الأيام تعرض صورة العنصر بدل نص مجرّد.
   */
  const lookup = React.useMemo(() => {
    const map = new Map<string, BlockRef>();
    // البذرة = ترتيب العنصر داخل فئته، وهي نفسها التي تستخدمها البطاقة —
    // فتظهر الصورة نفسها في البطاقة وفي شريط اليوم بلا تناقض.
    const put = (id: string, name: string, category: BlockRef['category'], imageQuery: string, seed: number) => {
      if (id) map.set(id, { name, category, imageQuery, seed });
    };
    itinerary.hotels.forEach((h, i) => put(h.id, h.name, 'hotels', h.imageQuery, i));
    // فاصل محايد بدل سهم: السهم ينقلب معناه داخل نص عربي ثنائي الاتجاه
    itinerary.flights.forEach((f, i) => put(f.id, `${f.airline} — ${f.from} إلى ${f.to}`, 'flights', f.imageQuery, i));
    itinerary.restaurants.forEach((r, i) => put(r.id, r.name, 'restaurants', r.imageQuery, i));
    itinerary.experiences.forEach((e, i) => put(e.id, e.title, 'experiences', e.imageQuery, i));
    itinerary.landmarks.forEach((l, i) => put(l.id, l.name, 'landmarks', l.imageQuery, i));
    itinerary.shopping.forEach((s, i) => put(s.id, s.name, 'shopping', s.imageQuery, i));
    return map;
  }, [itinerary]);

  const resolveRef = React.useCallback((refId: string) => lookup.get(refId), [lookup]);

  const budgetMax = React.useMemo(() => Math.max(1, ...Object.values(budgetBreakdown)), [budgetBreakdown]);

  const share = React.useCallback(async () => {
    const url = tripId ? `${window.location.origin}/trips/${tripId}` : window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: meta.title, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch { /* ألغى المستخدم */ }
  }, [tripId, meta.title]);

  /** اسم الوجهة كما سيُطابَق بكتالوج الوجهات لاختيار صور المكان الحقيقي. */
  const destinationKey = meta.destinationEn || meta.destination;

  return (
    <TripDestinationContext.Provider value={destinationKey}>
    <div className="canvas relative min-h-dvh">
      {/* ================= الصورة العلوية ================= */}
      <div className="relative h-[46svh] min-h-[300px] w-full sm:h-[52svh]">
        <Image
          src={getCardImage('landmarks', destinationKey, { w: 1400, h: 900, destination: destinationKey })}
          alt={meta.destination}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/85 via-neutral-950/15 to-neutral-950/45" />

        <ScreenLogo className="absolute inset-x-0 top-[max(1rem,env(safe-area-inset-top))] z-10" />

        {/* أزرار عائمة */}
        <div className="absolute inset-x-4 top-[max(1rem,env(safe-area-inset-top))] z-10 flex items-center justify-between sm:inset-x-6">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="رجوع"
            className="grid size-11 place-items-center rounded-full bg-white/95 text-neutral-900 shadow-card transition-transform active:scale-90"
          >
            <ChevronRight className="size-5" />
          </button>

          <button
            type="button"
            onClick={share}
            aria-label="مشاركة الرحلة"
            className="grid size-11 place-items-center rounded-full bg-white/25 text-white backdrop-blur-md transition-transform active:scale-90"
          >
            {copied ? <Check className="size-5" /> : <Share2 className="size-[18px]" />}
          </button>
        </div>

        {/* العنوان والتقييم ورفاق الرحلة */}
        <div className="absolute inset-x-5 bottom-6 z-10 sm:inset-x-8">
          <div className="mb-2.5 flex flex-wrap gap-1.5">
            {meta.tags.slice(0, 3).map((t) => (
              <Badge key={t} variant="glass" className="border-white/30 text-white">{t}</Badge>
            ))}
          </div>

          <h1 className="max-w-[16ch] font-display text-[28px] font-bold leading-[1.15] text-white sm:text-4xl">
            {meta.title}
          </h1>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-white/75">
            <span className="flex items-center gap-1.5">
              <Star className="size-4 fill-sand-300 text-sand-300" />
              <span className="num font-semibold text-sand-200">4.8</span>
            </span>
            <Dot />
            <span>{meta.destination}</span>
            <Dot />
            <span>{daysAr(meta.durationDays)}</span>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex -space-x-2.5 rtl:space-x-reverse">
                {COMPANIONS.map((id) => (
                  <span key={id} className="relative size-9 overflow-hidden rounded-full ring-2 ring-white/80">
                    <Image src={unsplash(id, 80, 80)} alt="" fill sizes="36px" className="object-cover" />
                  </span>
                ))}
                <span className="grid size-9 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground ring-2 ring-white/80">
                  +4
                </span>
              </div>
              <span className="hidden text-[12px] text-white/75 sm:inline">حجزوا رحلة مشابهة</span>
            </div>

            <button
              type="button"
              onClick={() => setSaved((v) => !v)}
              aria-label={saved ? 'إزالة من المحفوظات' : 'حفظ الرحلة'}
              aria-pressed={saved}
              className="grid size-12 place-items-center rounded-full bg-white shadow-card transition-transform active:scale-90"
            >
              <Heart className={cn('size-5 transition-colors', saved ? 'fill-rose-500 text-rose-500' : 'text-neutral-400')} />
            </button>
          </div>
        </div>
      </div>

      {/* ================= الورقة المنزلقة ================= */}
      <div className="relative z-20 -mt-7 rounded-t-[32px] bg-card px-5 pb-40 pt-5 shadow-[0_-12px_40px_-12px_hsl(20_30%_10%/0.25)] sm:px-8">
        {/* مقبض الورقة */}
        <div className="mx-auto mb-6 h-1.5 w-11 rounded-full bg-border" />

        <div className="mx-auto w-full max-w-[1100px]">
          {/* الوصف والسعر */}
          <div className="mb-5 flex items-start justify-between gap-5">
            <div className="min-w-0 flex-1">
              <h2 className="t-eyebrow mb-2 text-muted-foreground">نبذة</h2>
              <p className="t-body text-foreground/85">{meta.summary}</p>
            </div>
            <div className="shrink-0 text-end">
              <span className="block text-[11px] text-muted-foreground">التكلفة التقديرية</span>
              <bdi className="block font-display text-[26px] font-bold leading-tight text-primary">
                {formatPrice(meta.estimatedTotalCost, meta.currency)}
              </bdi>
              <span className="block text-[11px] text-muted-foreground">للشخص الواحد</span>
            </div>
          </div>

          <p className="mb-5 inline-flex items-start gap-2 rounded-2xl bg-primary/10 px-3.5 py-2 text-[12px] font-medium leading-relaxed text-primary">
            <CalendarRange className="mt-0.5 size-3.5 shrink-0" />
            <span>{meta.bestTimeNote}</span>
          </p>

          {/* نظرة سريعة — ما الذي تتضمّنه الخطة، قبل الدخول في التفاصيل */}
          <div className="mb-7 grid grid-cols-3 gap-2.5 sm:grid-cols-6">
            {STATS.map(({ key, label, icon: Icon }) => {
              const count = key === 'days' ? days.length : itinerary[key].length;
              if (!count) return null;
              return (
                <div key={key} className="card-warm flex flex-col items-center gap-1 px-2 py-3 text-center">
                  <Icon className="size-4 text-primary" />
                  <span className="num text-[17px] font-bold leading-none">{count}</span>
                  <span className="text-[10.5px] leading-tight text-muted-foreground">{label}</span>
                </div>
              );
            })}
          </div>

          {/* التبويبات */}
          <Tabs defaultValue="days" className="w-full">
            <div className="scrollbar-none -mx-5 mb-1 overflow-x-auto px-5 sm:-mx-8 sm:px-8">
              <TabsList>
                <TabsTrigger value="days"><CalendarRange className="size-4" />الأيام</TabsTrigger>
                <TabsTrigger value="hotels"><HotelIcon className="size-4" />الفنادق</TabsTrigger>
                <TabsTrigger value="flights"><Plane className="size-4" />الطيران</TabsTrigger>
                <TabsTrigger value="food"><Utensils className="size-4" />المطاعم</TabsTrigger>
                <TabsTrigger value="experiences"><Ticket className="size-4" />التجارب</TabsTrigger>
                <TabsTrigger value="landmarks"><LandmarkIcon className="size-4" />المعالم</TabsTrigger>
                <TabsTrigger value="shopping"><ShoppingBag className="size-4" />التسوق</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="days">
              <DaysTimeline days={days} currency={meta.currency} resolve={resolveRef} />
            </TabsContent>

            <TabsContent value="hotels">
              {itinerary.hotels.length
                ? <Grid>{itinerary.hotels.map((h, i) => <HotelCard key={h.id} item={h} index={i} />)}</Grid>
                : <EmptyTab label="فنادق مقترحة" />}
            </TabsContent>
            <TabsContent value="flights">
              {itinerary.flights.length
                ? <Grid cols={2}>{itinerary.flights.map((f, i) => <FlightCard key={f.id} item={f} index={i} />)}</Grid>
                : <EmptyTab label="رحلات طيران" />}
            </TabsContent>
            <TabsContent value="food">
              {itinerary.restaurants.length
                ? <Grid>{itinerary.restaurants.map((r, i) => <RestaurantCard key={r.id} item={r} index={i} />)}</Grid>
                : <EmptyTab label="مطاعم" />}
            </TabsContent>
            <TabsContent value="experiences">
              {itinerary.experiences.length
                ? <Grid>{itinerary.experiences.map((e, i) => <ExperienceCard key={e.id} item={e} index={i} />)}</Grid>
                : <EmptyTab label="تجارب" />}
            </TabsContent>
            <TabsContent value="landmarks">
              {itinerary.landmarks.length
                ? <Grid>{itinerary.landmarks.map((l, i) => <LandmarkCard key={l.id} item={l} index={i} />)}</Grid>
                : <EmptyTab label="معالم" />}
            </TabsContent>
            <TabsContent value="shopping">
              {itinerary.shopping.length
                ? <Grid>{itinerary.shopping.map((s, i) => <ShoppingCard key={s.id} item={s} index={i} />)}</Grid>
                : <EmptyTab label="أماكن تسوّق" />}
            </TabsContent>
          </Tabs>

          {/* الميزانية والنصائح */}
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <section className="card-warm p-5 sm:p-6">
              <h3 className="mb-5 flex items-center gap-2 t-h3">
                <Wallet className="size-5 text-primary" />
                توزيع الميزانية
              </h3>
              <div className="space-y-3.5">
                {(Object.keys(budgetBreakdown) as (keyof typeof budgetBreakdown)[]).map((key) => (
                  <div key={key}>
                    <div className="mb-1.5 flex items-center justify-between t-sm">
                      <span className="text-muted-foreground">{BUDGET_LABELS[key]}</span>
                      <span className="font-semibold">{formatPrice(budgetBreakdown[key], meta.currency)}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                      <motion.div
                        className="h-full rounded-full bg-primary"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${(budgetBreakdown[key] / budgetMax) * 100}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="card-warm p-5 sm:p-6">
              <h3 className="mb-5 flex items-center gap-2 t-h3">
                <Lightbulb className="size-5 text-primary" />
                نصائح عملية
              </h3>
              <ul className="space-y-3">
                {practicalTips.map((tip, i) => (
                  <li key={i} className="flex gap-3 t-sm">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary/15">
                      <Check className="size-3 text-primary" />
                    </span>
                    <span className="text-muted-foreground">{tip}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* الموقع */}
          <section className="card-warm mt-5 p-5 sm:p-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="t-h3">الموقع</h3>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(meta.destinationEn || meta.destination)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[12px] font-medium text-primary hover:underline"
              >
                <MapPin className="size-3.5" />
                افتح الخريطة
              </a>
            </div>
            <div className="relative grid h-24 place-items-center overflow-hidden rounded-2xl border border-primary/20 bg-primary/5">
              <div
                aria-hidden
                className="absolute inset-0 opacity-40"
                style={{ backgroundImage: 'radial-gradient(hsl(var(--primary)) 1px, transparent 1px)', backgroundSize: '12px 12px' }}
              />
              <span className="relative flex items-center gap-2 rounded-full bg-card/90 px-3.5 py-2 text-[13px] font-medium backdrop-blur-sm">
                <span className="size-2 animate-ping rounded-full bg-primary" />
                {meta.destination}
              </span>
            </div>
          </section>
        </div>
      </div>

      {/* ================= زر الإجراء الثابت ================= */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(5.5rem,calc(env(safe-area-inset-bottom)+5rem))] pt-16 [background:linear-gradient(to_top,hsl(var(--canvas))_38%,transparent)]">
        <div className="pointer-events-auto flex w-full max-w-[520px] items-center gap-2.5">
          <button
            type="button"
            onClick={() => setSaved((v) => !v)}
            aria-label={saved ? 'محفوظة' : 'حفظ'}
            className="grid size-14 shrink-0 place-items-center rounded-2xl border border-border bg-card shadow-card-lg transition-transform active:scale-95"
          >
            <Bookmark className={cn('size-5', saved ? 'fill-primary text-primary' : 'text-muted-foreground')} />
          </button>

          <a
            href={itinerary.hotels[0]?.bookingUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-card-lg transition-all active:scale-[0.98] hover:brightness-110"
          >
            احجز رحلتك
            <Check className="size-[18px]" />
          </a>
        </div>
      </div>
    </div>
    </TripDestinationContext.Provider>
  );
}

/** فاصل رسومي بدل الحرف "·" — يتجنّب إعادة الترتيب ثنائية الاتجاه. */
function Dot() {
  return <span aria-hidden className="size-1 rounded-full bg-current opacity-50" />;
}

function Grid({ children, cols = 3 }: { children: React.ReactNode; cols?: 2 | 3 }) {
  return (
    <div className={cn('grid gap-4', cols === 2 ? 'lg:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3')}>
      {children}
    </div>
  );
}
