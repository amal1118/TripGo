'use client';

import * as React from 'react';
import Image from 'next/image';
import { getCardImage, getFallbackImage } from '@/lib/images';
import type { CardCategory } from '@/types/trip';
import { cn } from '@/lib/utils';

interface CardImageProps {
  category: CardCategory;
  query: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}

/**
 * صورة بطاقة مع تدرّج سفلي لقراءة النص، وتبديل تلقائي لمصدر بديل عند الفشل.
 * memo لأن البطاقات تُعاد ترتيبها كثيراً عند التصفية.
 */
function CardImageBase({ category, query, alt, className, priority, sizes = '(max-width: 768px) 100vw, 380px' }: CardImageProps) {
  const [failed, setFailed] = React.useState(false);
  const src = failed ? getFallbackImage(query) : getCardImage(category, query);

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
