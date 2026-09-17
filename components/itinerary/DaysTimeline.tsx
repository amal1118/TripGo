'use client';

/**
 * DaysTimeline — عرض أيام الرحلة.
 *
 * قرارات التصميم:
 * - الأيام تبقى مكدّسة (لا تُخفى خلف تبويب لكل يوم) حتى يمسح القارئ المسار
 *   كاملاً بالتمرير، ويبقى شريط الأيام لقفزٍ سريع إلى يوم بعينه.
 * - الشريط لاصق (sticky) ويُبرز اليوم الظاهر عبر IntersectionObserver بدل
 *   حساب مواضع التمرير يدوياً في كل إطار.
 * - كل مقطع يعرض صورة العنصر المرتبط به (refId)، فالصور هي ما يجعل المسار
 *   مقروءاً بصرياً بدل قائمة نصية.
 */

import * as React from 'react';
import { CalendarDays, Wallet, Footprints } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TimelineBlock } from './cards';
import { formatPrice, activitiesAr, cn } from '@/lib/utils';
import type { TripDay, CardCategory, DayBlock } from '@/types/trip';

export interface BlockRef {
  /** ترتيب العنصر داخل فئته — تستخدمه الصورة المصغّرة لتطابق صورة البطاقة. */
  seed?: number;
  name: string;
  category: CardCategory;
  imageQuery: string;
}

export function DaysTimeline({
  days,
  currency,
  resolve,
}: {
  days: TripDay[];
  currency: string;
  /** يحوّل refId إلى العنصر الأصلي (اسم + فئة + استعلام صورة). */
  resolve: (refId: string) => BlockRef | undefined;
}) {
  const [active, setActive] = React.useState(days[0]?.day ?? 1);
  const sectionRefs = React.useRef(new Map<number, HTMLElement>());

  const registerSection = React.useCallback((day: number, el: HTMLElement | null) => {
    if (el) sectionRefs.current.set(day, el);
    else sectionRefs.current.delete(day);
  }, []);

  /* إبراز اليوم الظاهر حالياً — مراقب واحد لكل الأقسام */
  React.useEffect(() => {
    const els = Array.from(sectionRefs.current.entries());
    if (!els.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (!visible) return;
        const day = Number((visible.target as HTMLElement).dataset.day);
        if (!Number.isNaN(day)) setActive(day);
      },
      // الشريط اللاصق يغطي ~120px من الأعلى، فنُزيح منطقة الرصد تحته
      { rootMargin: '-120px 0px -55% 0px', threshold: 0 },
    );

    els.forEach(([, el]) => observer.observe(el));
    return () => observer.disconnect();
  }, [days]);

  const jumpTo = React.useCallback((day: number) => {
    sectionRefs.current.get(day)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <div>
      {/* ===== شريط الأيام اللاصق ===== */}
      <div className="sticky top-0 z-30 -mx-5 mb-5 bg-card/85 px-5 py-3 backdrop-blur-xl sm:-mx-8 sm:px-8">
        <div className="scrollbar-none flex gap-2 overflow-x-auto">
          {days.map((d) => {
            const isActive = d.day === active;
            return (
              <button
                key={d.day}
                type="button"
                onClick={() => jumpTo(d.day)}
                aria-current={isActive ? 'true' : undefined}
                className={cn(
                  'flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-medium transition-all active:scale-95',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-glow'
                    : 'bg-secondary text-muted-foreground hover:bg-secondary/70 hover:text-foreground',
                )}
              >
                <span className={cn('num text-[11px] font-bold', isActive ? 'opacity-90' : 'text-primary')}>
                  {d.day}
                </span>
                <span className="max-w-[9rem] truncate">{d.title || `اليوم ${d.day}`}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== أقسام الأيام ===== */}
      <div className="space-y-5">
        {days.map((day) => (
          <DaySection
            key={day.day}
            day={day}
            currency={currency}
            resolve={resolve}
            register={registerSection}
          />
        ))}
      </div>
    </div>
  );
}

const DaySection = React.memo(function DaySection({
  day, currency, resolve, register,
}: {
  day: TripDay;
  currency: string;
  resolve: (refId: string) => BlockRef | undefined;
  register: (day: number, el: HTMLElement | null) => void;
}) {
  const dayCost = React.useMemo(
    () => day.blocks.reduce((sum, b) => sum + (b.estimatedCost || 0), 0),
    [day.blocks],
  );

  return (
    <section
      ref={(el) => register(day.day, el)}
      data-day={day.day}
      // يمنع الشريط اللاصق من تغطية العنوان عند القفز
      className="card-warm scroll-mt-28 p-4 sm:p-6"
    >
      <header className="mb-5 border-b border-border/60 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <span className="num text-lg font-bold leading-none">{day.day}</span>
              <span className="mt-0.5 text-[9px] font-medium opacity-70">اليوم</span>
            </div>
            <div className="min-w-0">
              <h3 className="t-h3 leading-snug">{day.title || `اليوم ${day.day}`}</h3>
              {day.theme && <p className="mt-0.5 text-[12px] text-muted-foreground">{day.theme}</p>}
            </div>
          </div>

          {day.theme && <Badge variant="muted" className="shrink-0">{day.theme}</Badge>}
        </div>

        {/* ملخّص اليوم — يجيب «ماذا يتضمّن هذا اليوم؟» قبل قراءة التفاصيل */}
        <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Footprints className="size-3.5 text-primary/70" />
            {activitiesAr(day.blocks.length)}
          </span>
          {dayCost > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <Wallet className="size-3.5 text-primary/70" />
              <bdi>{formatPrice(dayCost, currency)}</bdi>
            </span>
          )}
        </div>
      </header>

      {day.blocks.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-muted-foreground">
          لا توجد أنشطة مُسجَّلة في هذا اليوم.
        </p>
      ) : (
        day.blocks.map((b, i) => <Block key={`${day.day}-${i}`} block={b} currency={currency} resolve={resolve} isLast={i === day.blocks.length - 1} />)
      )}
    </section>
  );
});

function Block({
  block, currency, resolve, isLast,
}: {
  block: DayBlock; currency: string;
  resolve: (refId: string) => BlockRef | undefined;
  isLast: boolean;
}) {
  const ref = block.refId ? resolve(block.refId) : undefined;

  return (
    <TimelineBlock
      time={block.time}
      period={block.period}
      // النموذج يترك العنوان فارغاً أحياناً ويكتفي بـ refId
      title={block.title || ref?.name || 'نشاط'}
      description={block.description}
      transitNote={block.transitNote}
      cost={block.estimatedCost}
      currency={currency}
      isLast={isLast}
      refType={block.refType}
      image={ref ? { category: ref.category, query: ref.imageQuery || ref.name, seed: ref.seed ?? 0 } : null}
    />
  );
}

/** حالة فارغة موحّدة لتبويبات الفئات. */
export function EmptyTab({ label }: { label: string }) {
  return (
    <div className="card-warm grid place-items-center gap-2 px-6 py-12 text-center">
      <CalendarDays className="size-7 text-muted-foreground/40" />
      <p className="text-[13px] text-muted-foreground">لم تتضمّن هذه الخطة {label}.</p>
    </div>
  );
}
