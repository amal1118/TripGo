'use client';

/**
 * components/itinerary/cards.tsx
 * بطاقات زجاجية لكل فئة. كلها memo — شاشة الخطة قد تعرض 25+ بطاقة،
 * وإعادة الرسم عند تبديل التبويب أو التصفية يجب ألا تمسّها.
 */

import * as React from 'react';
import Image from 'next/image';
import {
  Star, Clock, Plane, MapPin, Utensils, Ticket, ShoppingBag,
  Landmark as LandmarkIcon, BadgeCheck, Navigation,
  Sunrise, Sun, Sunset, Moon,
} from 'lucide-react';
import { GlassCard } from '@/components/glass/GlassCard';
import { CardImage, TripDestinationContext } from '@/components/glass/CardImage';
import { CardActions } from '@/components/glass/CardActions';
import { Badge } from '@/components/ui/badge';
import { formatPrice, formatDuration, priceLevelLabel, hoursAr, cn } from '@/lib/utils';
import { mapsUrl, getCardImage, getFallbackImage } from '@/lib/images';
import type {
  Flight, Hotel, Restaurant, Experience, Landmark, Shopping,
  DayBlock, CardCategory,
} from '@/types/trip';

/* ---------- عناصر مشتركة ---------- */

function PriceTag({ value, currency, suffix }: { value: number; currency: string; suffix?: string }) {
  return (
    // السعر وحده يُعزل بـ bdi حتى لا يُعيد محرّك bidi ترتيب الرقم مع الرمز،
    // واللاحقة العربية تبقى خارج العزل لترث اتجاه الصفحة (RTL).
    <div className="flex items-baseline gap-1 text-start">
      <bdi className="text-lg font-semibold text-foreground">{formatPrice(value, currency)}</bdi>
      {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
    </div>
  );
}

function CornerIcon({ icon: Icon }: { icon: React.ElementType }) {
  return (
    <div className="absolute end-4 top-4 z-10 grid size-9 place-items-center rounded-full border border-white/40 bg-white/25 backdrop-blur-xl">
      <Icon className="size-4 text-white" />
    </div>
  );
}

/* ---------- الفنادق ---------- */

export const HotelCard = React.memo(function HotelCard({ item, index }: { item: Hotel; index: number }) {
  return (
    <GlassCard index={index} tilt className="flex flex-col">
      <div className="relative h-48">
        <CardImage category="hotels" query={item.imageQuery || item.name} alt={item.name} seed={index} className="absolute inset-0" />
        <CornerIcon icon={BadgeCheck} />
        <div className="absolute bottom-3 start-4 end-4 z-10">
          <div className="mb-1 flex items-center gap-1.5">
            <Star className="size-3.5 fill-sand-400 text-sand-400" />
            <span className="text-sm font-medium text-white">{item.rating.toFixed(1)}</span>
            <span className="text-xs text-white/70">· {item.area}</span>
          </div>
          <h3 className="line-clamp-1 text-lg font-semibold text-white">{item.name}</h3>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{item.whyItFits}</p>

        <div className="flex flex-wrap gap-1.5">
          {item.highlights.slice(0, 3).map((h) => (
            <Badge key={h} variant="glass">{h}</Badge>
          ))}
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <PriceTag value={item.pricePerNight} currency={item.currency} suffix="/ ليلة" />
          <CardActions
            actions={[
              { label: 'احجز الآن', href: item.bookingUrl, primary: true },
              { label: 'الخريطة', href: item.mapUrl || mapsUrl(item.name), icon: 'map' },
            ]}
          />
        </div>
      </div>
    </GlassCard>
  );
});

/* ---------- الطيران ---------- */

export const FlightCard = React.memo(function FlightCard({ item, index }: { item: Flight; index: number }) {
  const stopsLabel = item.stops === 0 ? 'مباشرة' : item.stops === 1 ? 'توقف واحد' : `${item.stops} توقفات`;

  return (
    <GlassCard index={index} className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="grid size-9 place-items-center rounded-full bg-primary/15">
            <Plane className="size-4 -rotate-45 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">{item.airline}</p>
            <p className="text-xs text-muted-foreground">
              {item.cabin === 'economy' ? 'اقتصادية' : item.cabin === 'premium' ? 'مميزة' : 'رجال أعمال'}
            </p>
          </div>
        </div>
        <Badge variant={item.stops === 0 ? 'default' : 'muted'}>{stopsLabel}</Badge>
      </div>

      {/* خط الرحلة */}
      <div className="flex items-center gap-3" dir="ltr">
        <div className="text-center">
          <p className="text-xl font-semibold tabular-nums">{item.departTime}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{item.from}</p>
        </div>

        <div className="relative flex-1 px-1">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background px-2 text-[10px] text-muted-foreground">
            {formatDuration(item.durationMinutes)}
          </div>
        </div>

        <div className="text-center">
          <p className="text-xl font-semibold tabular-nums">{item.arriveTime}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{item.to}</p>
        </div>
      </div>

      <p className="mt-4 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{item.priceNote}</p>

      <div className="mt-4 flex items-end justify-between gap-2 border-t border-border/50 pt-4">
        <PriceTag value={item.price} currency={item.currency} suffix="/ شخص" />
        <CardActions actions={[{ label: 'عرض التذاكر', href: item.bookingUrl, primary: true }]} />
      </div>
    </GlassCard>
  );
});

/* ---------- المطاعم والكافيهات ---------- */

const FOOD_TYPE_AR: Record<Restaurant['type'], string> = {
  restaurant: 'مطعم', cafe: 'كافيه', 'street-food': 'أكل شعبي', dessert: 'حلويات',
};

export const RestaurantCard = React.memo(function RestaurantCard({ item, index }: { item: Restaurant; index: number }) {
  return (
    <GlassCard index={index} className="flex flex-col overflow-hidden">
      <div className="relative h-36">
        <CardImage category="restaurants" query={item.imageQuery || item.name} alt={item.name} seed={index} className="absolute inset-0" />
        <CornerIcon icon={Utensils} />
        <div className="absolute bottom-3 start-4 end-4 z-10 flex items-center gap-2">
          <Badge variant="glass" className="text-white">{FOOD_TYPE_AR[item.type]}</Badge>
          {item.isHalalFriendly && <Badge variant="glass" className="text-white">حلال</Badge>}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-semibold">{item.name}</h3>
          <span className="shrink-0 text-xs font-medium text-primary" dir="ltr">{priceLevelLabel(item.priceLevel)}</span>
        </div>
        <p className="text-xs text-muted-foreground">{item.cuisine} · {item.area}</p>
        <p className="line-clamp-2 text-sm leading-relaxed">
          <span className="text-muted-foreground">جرّب: </span>{item.mustTry}
        </p>
        <CardActions className="mt-auto pt-2" actions={[{ label: 'الموقع على الخريطة', href: item.mapUrl || mapsUrl(item.name), icon: 'map' }]} />
      </div>
    </GlassCard>
  );
});

/* ---------- التجارب ---------- */

const EXP_CAT_AR: Record<Experience['category'], string> = {
  adventure: 'مغامرة', culture: 'ثقافة', nature: 'طبيعة',
  nightlife: 'حياة ليلية', wellness: 'استرخاء', family: 'عائلي',
};

export const ExperienceCard = React.memo(function ExperienceCard({ item, index }: { item: Experience; index: number }) {
  return (
    <GlassCard index={index} tilt className="flex flex-col">
      <div className="relative h-44">
        <CardImage category="experiences" query={item.imageQuery || item.title} alt={item.title} seed={index} className="absolute inset-0" />
        <CornerIcon icon={Ticket} />
        <div className="absolute bottom-3 start-4 end-4 z-10">
          <Badge variant="glass" className="mb-1.5 text-white">{EXP_CAT_AR[item.category]}</Badge>
          <h3 className="line-clamp-1 text-lg font-semibold text-white">{item.title}</h3>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><Clock className="size-3.5" />{hoursAr(item.durationHours)}</span>
          <span className="inline-flex items-center gap-1.5"><Star className="size-3.5" />{item.bestTime}</span>
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <PriceTag value={item.price} currency={item.currency} suffix={item.price ? '/ شخص' : undefined} />
          <CardActions actions={[{ label: 'احجز التجربة', href: item.bookingUrl, primary: true }]} />
        </div>
      </div>
    </GlassCard>
  );
});

/* ---------- المعالم ---------- */

const LANDMARK_AR: Record<Landmark['type'], string> = {
  historic: 'تاريخي', religious: 'ديني', modern: 'حديث', viewpoint: 'إطلالة', museum: 'متحف',
};

export const LandmarkCard = React.memo(function LandmarkCard({ item, index }: { item: Landmark; index: number }) {
  return (
    <GlassCard index={index} className="flex flex-col">
      <div className="relative h-40">
        <CardImage category="landmarks" query={item.imageQuery || item.name} alt={item.name} seed={index} className="absolute inset-0" />
        <CornerIcon icon={LandmarkIcon} />
        <div className="absolute bottom-3 start-4 end-4 z-10">
          <Badge variant="glass" className="mb-1.5 text-white">{LANDMARK_AR[item.type]}</Badge>
          <h3 className="line-clamp-1 text-lg font-semibold text-white">{item.name}</h3>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3">
          <p className="text-xs leading-relaxed text-foreground/80"><span className="font-medium text-primary">نصيحة: </span>{item.tip}</p>
        </div>

        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><Clock className="size-3.5" />{item.suggestedDuration}</span>
          <span className="font-medium text-foreground">{formatPrice(item.entryFee, item.currency)}</span>
        </div>

        <CardActions className="mt-auto pt-1" actions={[{ label: 'الموقع على الخريطة', href: item.mapUrl || mapsUrl(item.name), icon: 'map' }]} />
      </div>
    </GlassCard>
  );
});

/* ---------- التسوق ---------- */

const SHOP_AR: Record<Shopping['type'], string> = {
  mall: 'مول', souq: 'سوق شعبي', 'boutique-street': 'شارع بوتيكات', outlet: 'أوتلت',
};

export const ShoppingCard = React.memo(function ShoppingCard({ item, index }: { item: Shopping; index: number }) {
  return (
    <GlassCard index={index} className="flex flex-col">
      <div className="relative h-36">
        <CardImage category="shopping" query={item.imageQuery || item.name} alt={item.name} seed={index} className="absolute inset-0" />
        <CornerIcon icon={ShoppingBag} />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-semibold">{item.name}</h3>
          <span className="shrink-0 text-xs font-medium text-primary" dir="ltr">{priceLevelLabel(item.priceLevel)}</span>
        </div>
        <Badge variant="muted" className="w-fit">{SHOP_AR[item.type]}</Badge>
        <p className="line-clamp-2 text-sm text-muted-foreground">{item.knownFor}</p>
        <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="size-3.5" />{item.area}</p>
        <CardActions className="mt-auto pt-2" actions={[{ label: 'الموقع على الخريطة', href: item.mapUrl || mapsUrl(item.name), icon: 'map' }]} />
      </div>
    </GlassCard>
  );
});

/* ---------- مقطع في مسار اليوم ---------- */

const PERIODS = {
  morning:   { label: 'صباحاً', icon: Sunrise, tone: 'text-amber-600  dark:text-amber-400',  chip: 'bg-amber-500/10' },
  afternoon: { label: 'ظهراً',  icon: Sun,     tone: 'text-orange-600 dark:text-orange-400', chip: 'bg-orange-500/10' },
  evening:   { label: 'مساءً',  icon: Sunset,  tone: 'text-rose-600   dark:text-rose-400',   chip: 'bg-rose-500/10' },
  night:     { label: 'ليلاً',  icon: Moon,    tone: 'text-indigo-600 dark:text-indigo-400', chip: 'bg-indigo-500/10' },
} as const;

const REF_LABELS: Record<Exclude<DayBlock['refType'], 'free'>, string> = {
  hotel: 'إقامة', flight: 'طيران', restaurant: 'مطعم',
  experience: 'تجربة', landmark: 'معلم', shopping: 'تسوّق',
};

/** صورة مصغّرة للمقطع — تسقط إلى بديل حتمي عند فشل التحميل. */
const Thumb = React.memo(function Thumb(
  { category, query, alt, seed = 0 }: { category: CardCategory; query: string; alt: string; seed?: number },
) {
  const [failed, setFailed] = React.useState(false);
  const destination = React.useContext(TripDestinationContext);
  return (
    <div className="relative size-[68px] shrink-0 overflow-hidden rounded-2xl bg-muted ring-1 ring-black/5 dark:ring-white/10">
      <Image
        src={failed ? getFallbackImage(query, 160, 160) : getCardImage(category, query, { w: 160, h: 160, seed, destination })}
        alt={alt}
        fill
        sizes="68px"
        onError={() => setFailed(true)}
        className="object-cover transition-transform duration-500 group-hover/block:scale-110"
      />
    </div>
  );
});

export const TimelineBlock = React.memo(function TimelineBlock({
  time, period = 'morning', title, description, transitNote, cost, currency, isLast,
  image, refType,
}: {
  time: string; period?: DayBlock['period']; title: string; description: string;
  transitNote?: string; cost: number; currency: string; isLast: boolean;
  image?: { category: CardCategory; query: string; seed?: number } | null;
  refType?: DayBlock['refType'];
}) {
  const p = PERIODS[period] ?? PERIODS.morning;
  const PeriodIcon = p.icon;
  const refLabel = refType && refType !== 'free' ? REF_LABELS[refType] : null;

  return (
    <div className="group/block relative flex gap-3.5 pb-5 sm:gap-4">
      {/* عمود الزمن — الخط يحاذي مركز الدائرة على جانب البداية (يمين في العربية) */}
      <div className="relative flex w-[46px] shrink-0 flex-col items-center">
        {/* العمود عرضه 46px والدائرة مركزيّة فيه، فمركزها 23px من جهة البداية.
            تحديد الموضع بـ start- يجعله يميناً في العربية ويساراً في اللاتينية. */}
        {!isLast && (
          <div className="absolute start-[23px] top-12 h-[calc(100%-2.5rem)] w-px bg-gradient-to-b from-border via-border to-transparent" />
        )}
        <div className={cn('relative z-10 grid size-11 place-items-center rounded-2xl', p.chip)}>
          <PeriodIcon className={cn('size-[18px]', p.tone)} />
        </div>
        <span className="num mt-1.5 text-[11px] font-semibold tabular-nums text-muted-foreground">{time}</span>
      </div>

      {/* البطاقة */}
      <div className="glass glass-sheen relative flex-1 rounded-2xl p-3.5 transition-shadow duration-300 hover:shadow-card sm:p-4">
        <div className="flex gap-3.5">
          {image && <Thumb category={image.category} query={image.query} seed={image.seed} alt={title} />}

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2.5">
              <h4 className="text-[15px] font-semibold leading-snug">{title}</h4>
              {cost > 0 && (
                <bdi className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                  {formatPrice(cost, currency)}
                </bdi>
              )}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className={cn('text-[11px] font-medium', p.tone)}>{p.label}</span>
              {refLabel && (
                <>
                  <span aria-hidden className="size-1 rounded-full bg-current opacity-30" />
                  <span className="text-[11px] text-muted-foreground">{refLabel}</span>
                </>
              )}
            </div>

            {description && (
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{description}</p>
            )}
          </div>
        </div>

        {transitNote && (
          <p className="mt-3 flex items-start gap-1.5 rounded-xl bg-secondary/60 px-2.5 py-1.5 text-[11.5px] leading-relaxed text-muted-foreground">
            {/* أيقونة محايدة الاتجاه — السهم الأفقي ينقلب معناه في RTL */}
            <Navigation className="mt-px size-3 shrink-0 -scale-x-100 text-primary/70" />
            <span>{transitNote}</span>
          </p>
        )}
      </div>
    </div>
  );
});
