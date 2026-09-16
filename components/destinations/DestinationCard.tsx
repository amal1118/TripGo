'use client';

/**
 * DestinationCard — البطاقة الموحّدة للوجهة.
 *
 * تُستخدم في قسم الاكتشاف بصفحة الهبوط وفي صفحة الوجهات معاً، فلا يختلف
 * شكل الوجهة الواحدة بين شاشتين. زرّ الحفظ خارج الرابط عمداً: عنصر تفاعلي
 * داخل رابط يكسر التنقّل بلوحة المفاتيح ويخالف HTML.
 */

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Heart, MapPin, CalendarDays } from 'lucide-react';
import { unsplash, type Destination } from '@/lib/destinations';
import { formatPrice, cn } from '@/lib/utils';

export const DestinationCard = React.memo(function DestinationCard({
  destination: d,
  priority = false,
}: {
  destination: Destination;
  /** للبطاقات الظاهرة فوق الطيّة فقط — تحميل الصورة بأولوية. */
  priority?: boolean;
}) {
  const [liked, setLiked] = React.useState(false);
  const href = `/destinations/${d.id}`;

  return (
    <article className="card-warm card-warm-hover group relative flex flex-col overflow-hidden">
      <button
        type="button"
        onClick={() => setLiked((v) => !v)}
        aria-label={liked ? `إزالة ${d.name} من المفضلة` : `أضف ${d.name} للمفضلة`}
        aria-pressed={liked}
        className="absolute end-4 top-4 z-10 grid size-10 place-items-center rounded-full bg-white/95 shadow-card transition-all hover:scale-105 active:scale-95"
      >
        <Heart className={cn('size-[18px] transition-colors', liked ? 'fill-rose-500 text-rose-500' : 'text-neutral-400')} />
      </button>

      <Link href={href} className="relative block h-56 overflow-hidden sm:h-60">
        <Image
          src={unsplash(d.image, 760, 560)}
          alt={`${d.name} — ${d.country}`}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 45vw, 420px"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 img-scrim" />

        <span className="absolute start-4 top-4 rounded-full bg-black/45 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-md">
          {d.region}
        </span>

        <div className="absolute inset-x-5 bottom-4 text-white">
          <span className="mb-1 flex items-center gap-1 text-[11px] font-medium text-white/70">
            <MapPin className="size-3" />
            {d.country}
          </span>
          <h4 className="font-display text-xl font-semibold leading-snug">{d.name}</h4>
          <div className="mt-1 flex items-center gap-1.5 t-sm">
            <Star className="size-4 fill-sand-300 text-sand-300" />
            <span className="num font-semibold text-sand-200">{d.rating}</span>
            <span className="text-white/70">({d.reviews} تقييم)</span>
          </div>
        </div>
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-4 p-5">
        <p className="line-clamp-2 t-sm text-muted-foreground">{d.description}</p>

        <div className="mt-auto flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <CalendarDays className="size-3.5" />
              {d.recommendedDays}
            </p>
            <p className="mt-1.5 text-lg font-bold text-primary">
              {formatPrice(d.priceFrom, d.currency)}
              <span className="ms-1 text-xs font-normal text-muted-foreground">/ للشخص</span>
            </p>
          </div>

          <Link
            href={href}
            className="shrink-0 rounded-full bg-secondary px-5 py-2.5 text-xs font-semibold transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            التفاصيل
          </Link>
        </div>
      </div>
    </article>
  );
});
