'use client';

/**
 * DestinationCard — البطاقة الموحّدة للوجهة.
 *
 * تُستخدم في قسم الاكتشاف بصفحة الهبوط وفي صفحة الوجهات معاً، فلا يختلف
 * شكل الوجهة الواحدة بين شاشتين. زرّ الحفظ خارج الرابط عمداً: عنصر تفاعلي
 * داخل رابط يكسر التنقّل بلوحة المفاتيح ويخالف HTML.
 *
 * الزجاج: صورة الوجهة تملأ البطاقة كلها؛ النصف العلوي نافذة صافية عليها،
 * والنصف السفلي لوح مثلج (backdrop-filter) يرشح ألوانها. فالزجاج هنا له ما
 * يكسره فعلاً بدل أن يكون بياضاً شفافاً فوق خلفية مسطّحة.
 *
 * الوضوح أولاً: اللوح يستخدم أقوى درجة زجاج (‎0.8 تعتيم + ضبابية ‎34px)،
 * فيبقى تباين النص الثانوي مقبولاً حتى فوق أغمق الصور؛ والصورة نفسها تبقى
 * صافية تماماً في نافذتها، والأيقونات فوقها على زجاج داكن مع حدّ فاتح.
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
    <article className="group relative isolate flex flex-col overflow-hidden rounded-3xl border border-white/55 shadow-card transition-all duration-500 hover:-translate-y-1 hover:shadow-card-lg dark:border-white/10">
      {/* الصورة تملأ البطاقة: نافذة صافية أعلى، ومصدر الزجاج أسفل.
          alt فارغ لأنها زخرفية هنا — الرابط يحمل اسم الوجهة ونصّها. */}
      <div aria-hidden className="absolute inset-0 overflow-hidden">
        <Image
          src={unsplash(d.image, 760, 900)}
          alt=""
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 45vw, 420px"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
        />
      </div>

      <button
        type="button"
        onClick={() => setLiked((v) => !v)}
        aria-label={liked ? `إزالة ${d.name} من المفضلة` : `أضف ${d.name} للمفضلة`}
        aria-pressed={liked}
        className="absolute end-4 top-4 z-20 grid size-10 place-items-center rounded-full border border-white/40 bg-neutral-950/50 shadow-card backdrop-blur-xl transition-all hover:scale-105 hover:bg-neutral-950/65 active:scale-95"
      >
        <Heart
          className={cn(
            'size-[18px] transition-colors [filter:drop-shadow(0_1px_2px_hsl(20_25%_6%/0.6))]',
            liked ? 'fill-rose-500 text-rose-500' : 'text-white',
          )}
        />
      </button>

      <Link href={href} className="relative block h-56 sm:h-60">
        <div className="absolute inset-0 img-scrim" />

        <span className="absolute start-4 top-4 rounded-full border border-white/25 bg-neutral-950/35 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-xl">
          {d.region}
        </span>

        <div className="absolute inset-x-5 bottom-4 text-white">
          <span className="mb-1 flex items-center gap-1 text-[11px] font-medium text-white/75">
            <MapPin className="size-3" />
            {d.country}
          </span>
          <h4 className="font-display text-xl font-semibold leading-snug drop-shadow-[0_1px_6px_hsl(20_25%_6%/0.5)]">{d.name}</h4>
          <div className="mt-1 flex items-center gap-1.5 t-sm">
            <Star className="size-4 fill-sand-300 text-sand-300" />
            <span className="num font-semibold text-sand-200">{d.rating}</span>
            <span className="text-white/75">({d.reviews} تقييم)</span>
          </div>
        </div>
      </Link>

      {/* اللوح الزجاجي — حدّ علوي فقط، والظلّ للبطاقة لا له */}
      <div className="glass glass-strong relative flex min-w-0 flex-1 flex-col gap-4 border-x-0 border-b-0 border-t-white/50 p-5 shadow-none dark:border-t-white/10">
        <p className="line-clamp-2 t-sm text-foreground/80">{d.description}</p>

        <div className="mt-auto flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-[11px] font-medium text-foreground/65">
              <CalendarDays className="size-3.5" />
              {d.recommendedDays}
            </p>
            <p className="mt-1.5 text-lg font-bold text-primary [text-shadow:0_1px_0_hsl(0_0%_100%/0.5)] dark:[text-shadow:none]">
              {formatPrice(d.priceFrom, d.currency)}
              <span className="ms-1 text-xs font-normal text-foreground/60">/ للشخص</span>
            </p>
          </div>

          <Link
            href={href}
            className="shrink-0 rounded-full border border-white/60 bg-white/55 px-5 py-2.5 text-xs font-semibold text-foreground backdrop-blur-md transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground dark:border-white/15 dark:bg-white/10"
          >
            التفاصيل
          </Link>
        </div>
      </div>
    </article>
  );
});
