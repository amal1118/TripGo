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
import { toast } from 'sonner';
import {
  ChevronRight, Share2, Check, Star, MapPin, Wallet, Lightbulb,
  CalendarRange, Hotel as HotelIcon, Plane, Utensils, Ticket,
  Landmark as LandmarkIcon, ShoppingBag, Bookmark, BookmarkCheck, Loader2,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  HotelCard, FlightCard, RestaurantCard, ExperienceCard,
  LandmarkCard, ShoppingCard,
} from './cards';
import { DaysTimeline, EmptyTab, type BlockRef } from './DaysTimeline';
import { ScreenLogo } from '@/components/shell/ScreenLogo';
import { getCoverImage, getFallbackImage, hotelSearchUrl, tripDestinationKey } from '@/lib/images';
import { TripDestinationContext } from '@/components/glass/CardImage';
import { formatPrice, daysAr, activitiesAr, cn, toErrorMessage } from '@/lib/utils';
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

export function ItineraryView({
  itinerary, tripId, coverImage,
}: {
  itinerary: Itinerary;
  /** وجوده يعني أن الخطة محفوظة؛ غيابه يُظهر شريط الحفظ. */
  tripId?: string;
  /** الغلاف المحفوظ في Supabase — يضمن تطابق الشاشة مع بطاقة «رحلاتي». */
  coverImage?: string | null;
}) {
  const router = useRouter();
  const { meta, days, budgetBreakdown, practicalTips } = itinerary;
  const [savedId, setSavedId] = React.useState<string | null>(tripId ?? null);
  const [saving, setSaving] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [heroFailed, setHeroFailed] = React.useState(false);

  /**
   * تقييم الرحلة = متوسط تقييمات الفنادق المقترحة فيها. كان الرقم 4.8
   * مكتوباً في الكود لكل خطة — نجمة لا تقيس شيئاً. ويختفي كلياً إن لم
   * تتضمّن الخطة فنادق بدل عرض قيمة مُختلقة.
   */
  const rating = React.useMemo(() => {
    const rated = itinerary.hotels.filter((h) => h.rating > 0);
    if (!rated.length) return null;
    return rated.reduce((sum, h) => sum + h.rating, 0) / rated.length;
  }, [itinerary.hotels]);

  /**
   * فهرس refId → العنصر الأصلي. يحمل الفئة واستعلام الصورة أيضاً، فمقاطع
   * الأيام تعرض صورة العنصر بدل نص مجرّد.
   */
  const lookup = React.useMemo(() => {
    const map = new Map<string, BlockRef>();
    // البذرة = ترتيب العنصر داخل فئته، وهي نفسها التي تستخدمها البطاقة —
    // فتظهر الصورة نفسها في البطاقة وفي شريط اليوم بلا تناقض.
    // imageUrl يُمرَّر أيضاً حتى تعرض الصورة المصغّرة في اليوم نفس صورة
    // البطاقة بالضبط، لا صورةً أخرى من المجموعة العامة.
    const put = (
      id: string, name: string, category: BlockRef['category'],
      imageQuery: string, imageUrl: string, seed: number,
    ) => {
      if (id) map.set(id, { name, category, imageQuery, imageUrl, seed });
    };
    itinerary.hotels.forEach((h, i) => put(h.id, h.name, 'hotels', h.imageQuery, h.imageUrl, i));
    // فاصل محايد بدل سهم: السهم ينقلب معناه داخل نص عربي ثنائي الاتجاه
    itinerary.flights.forEach((f, i) => put(f.id, `${f.airline} — ${f.from} إلى ${f.to}`, 'flights', f.imageQuery, f.imageUrl, i));
    itinerary.restaurants.forEach((r, i) => put(r.id, r.name, 'restaurants', r.imageQuery, r.imageUrl, i));
    itinerary.experiences.forEach((e, i) => put(e.id, e.title, 'experiences', e.imageQuery, e.imageUrl, i));
    itinerary.landmarks.forEach((l, i) => put(l.id, l.name, 'landmarks', l.imageQuery, l.imageUrl, i));
    itinerary.shopping.forEach((s, i) => put(s.id, s.name, 'shopping', s.imageQuery, s.imageUrl, i));
    return map;
  }, [itinerary]);

  const resolveRef = React.useCallback((refId: string) => lookup.get(refId), [lookup]);

  const budgetMax = React.useMemo(() => Math.max(1, ...Object.values(budgetBreakdown)), [budgetBreakdown]);

  const totalActivities = React.useMemo(
    () => days.reduce((sum, d) => sum + d.blocks.length, 0),
    [days],
  );

  /**
   * حفظ خطة المعاينة في «رحلاتي».
   * الزر كان يقلب أيقونة محلية فقط، فخطةٌ نجت من فشل الحفظ كانت تضيع
   * بإغلاق التبويب رغم أن شاشة المعاينة وُصفت بأنها «شبكة أمان».
   */
  const save = React.useCallback(async () => {
    if (savedId) return router.push('/dashboard');
    setSaving(true);
    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itinerary }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'تعذّر حفظ الخطة');
      setSavedId(data.tripId);
      sessionStorage.removeItem('tripgo:preview');
      toast.success('حُفظت في رحلاتك');
      router.replace(`/trips/${data.tripId}`);
    } catch (err) {
      toast.error(toErrorMessage(err, 'تعذّر حفظ الخطة'));
    } finally {
      setSaving(false);
    }
  }, [savedId, itinerary, router]);

  const share = React.useCallback(async () => {
    const id = savedId;
    const url = id ? `${window.location.origin}/trips/${id}` : window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: meta.title, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch { /* ألغى المستخدم */ }
  }, [savedId, meta.title]);

  /** اسم الوجهة كما سيُطابَق بكتالوج الوجهات لاختيار صور المكان الحقيقي. */
  const destinationKey = React.useMemo(() => tripDestinationKey(meta), [meta]);

  /**
   * صورة الرأس: الغلاف المحفوظ مع السجل أولاً حتى تتطابق الشاشة مع بطاقة
   * الرحلة في «رحلاتي»، وإلا فنفس الخوارزمية التي حسبَته وقت الحفظ.
   */
  const heroSrc = heroFailed
    ? getFallbackImage(destinationKey, 1400, 900)
    : coverImage || getCoverImage(destinationKey, 1400, 900);

  return (
    <TripDestinationContext.Provider value={destinationKey}>
    <div className="canvas relative min-h-dvh">
      {/* ================= الصورة العلوية ================= */}
      <div className="relative h-[46svh] min-h-[300px] w-full sm:h-[52svh]">
        <Image
          src={heroSrc}
          alt={meta.destination}
          fill
          priority
          sizes="100vw"
          // الرأس كان الصورة الوحيدة بلا بديل عند الفشل
          onError={() => setHeroFailed(true)}
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/85 via-neutral-950/15 to-neutral-950/45" />

        <ScreenLogo tone="onDark" className="absolute inset-x-0 top-[max(1rem,env(safe-area-inset-top))] z-10" />

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

        {/* العنوان والتقييم وملخّص الخطة */}
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
            {rating !== null && (
              <>
                <span className="flex items-center gap-1.5" title="متوسط تقييم الفنادق المقترحة">
                  <Star className="size-4 fill-sand-300 text-sand-300" />
                  <span className="num font-semibold text-sand-200">{rating.toFixed(1)}</span>
                </span>
                <Dot />
              </>
            )}
            <span>{meta.destination}</span>
            <Dot />
            <span>{daysAr(meta.durationDays)}</span>
          </div>

          {/* لا صور «رفاق» ولا «+4 حجزوا رحلة مشابهة»: كانت عناصر زخرفية
              تُقدَّم كدليل اجتماعي حقيقي. مكانها ملخّص فعلي للخطة. */}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-white/75">
            <span className="inline-flex items-center gap-1.5">
              <CalendarRange className="size-3.5" />
              {activitiesAr(totalActivities)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Wallet className="size-3.5" />
              <bdi className="font-semibold text-white">{formatPrice(meta.estimatedTotalCost, meta.currency)}</bdi>
              للشخص
            </span>
          </div>
        </div>
      </div>

      {/* ================= الورقة المنزلقة ================= */}
      <div className="relative z-20 -mt-7 rounded-t-[32px] bg-card px-5 pb-40 pt-5 shadow-[0_-12px_40px_-12px_hsl(20_30%_10%/0.25)] sm:px-8">
        {/* مقبض الورقة */}
        <div className="mx-auto mb-6 h-1.5 w-11 rounded-full bg-border" />

        <div className="mx-auto w-full max-w-[1100px]">
          {/* شبكة الأمان يجب أن تُعلن عن نفسها، وإلا أغلق المستخدم التبويب
              ظاناً أن الخطة محفوظة — وهي ليست كذلك. */}
          {!savedId && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/25 bg-primary/10 px-4 py-3">
              <p className="t-sm font-medium text-primary">هذه الخطة غير محفوظة بعد.</p>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition-transform active:scale-95 disabled:opacity-70"
              >
                {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Bookmark className="size-3.5" />}
                احفظها في رحلاتي
              </button>
            </div>
          )}

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
            {/* سبعة تبويبات لا تتسع لشاشة الجوال. التدرّج على الحافة
                اليسرى (نهاية السطر في RTL) يكشف أن وراءها المزيد. */}
            <div className="relative -mx-5 mb-1 sm:-mx-8">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-card to-transparent"
              />
              <div className="scrollbar-none overflow-x-auto px-5 sm:px-8">
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
            onClick={save}
            disabled={saving}
            aria-label={savedId ? 'محفوظة في رحلاتي — افتح رحلاتي' : 'احفظ الخطة في رحلاتي'}
            className={cn(
              'grid size-14 shrink-0 place-items-center rounded-2xl border shadow-card-lg transition-transform active:scale-95 disabled:opacity-70',
              savedId ? 'border-primary/30 bg-primary/10' : 'border-border bg-card',
            )}
          >
            {saving
              ? <Loader2 className="size-5 animate-spin text-primary" />
              : savedId
                ? <BookmarkCheck className="size-5 text-primary" />
                : <Bookmark className="size-5 text-muted-foreground" />}
          </button>

          {/* لا رابط «#» ميت: إن لم يُعِد النموذج رابط حجز نبحث في booking */}
          <a
            href={itinerary.hotels[0]?.bookingUrl || hotelSearchUrl(itinerary.hotels[0]?.name ?? '', meta.destinationEn || meta.destination)}
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
