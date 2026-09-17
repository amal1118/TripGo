'use client';

import * as React from 'react';
import Image from 'next/image';
import { getCardImage, getFallbackImage } from '@/lib/images';
import type { CardCategory } from '@/types/trip';
import { cn } from '@/lib/utils';

/**
 * وجهة الرحلة الحالية — تُوفَّر مرة واحدة من ItineraryView.
 *
 * لماذا سياق بدل تمرير الخاصية؟ البطاقات تُستدعى من ست قوائم مختلفة عبر
 * مستويين، وتمرير الوجهة يدوياً في كل واحدة تكرار خالص. والسياق ثابت طوال
 * عمر الشاشة فلا يُسبب إعادة رسم.
 */
export const TripDestinationContext = React.createContext<string | null>(null);

interface CardImageProps {
  category: CardCategory;
  query: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  /** ترتيب البطاقة داخل فئتها — يمنع ظهور الصورة نفسها في بطاقتين متجاورتين. */
  seed?: number;
  /** صورة العنصر نفسه إن حُلّت وقت التوليد — أدقّ من أي مجموعة عامة. */
  url?: string | null;
}

/**
 * صورة بطاقة مع تدرّج سفلي لقراءة النص، وتبديل تلقائي لمصدر بديل عند الفشل.
 * memo لأن البطاقات تُعاد ترتيبها كثيراً عند التصفية.
 */
function CardImageBase({ category, query, alt, className, priority, sizes = '(max-width: 768px) 100vw, 380px', seed = 0, url }: CardImageProps) {
  const [failed, setFailed] = React.useState(false);
  const destination = React.useContext(TripDestinationContext);
  const src = failed
    ? getFallbackImage(query)
    : getCardImage(category, query, { seed, destination, url });

  return (
    <div className={cn('relative overflow-hidden bg-muted', className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        onError={() => setFailed(true)}
        className="object-cover transition-transform duration-700 ease-out will-change-transform group-hover:scale-[1.06]"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
    </div>
  );
}

export const CardImage = React.memo(CardImageBase);
