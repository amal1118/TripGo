'use client';

/**
 * useCoverflow — يحوّل صف بطاقات أفقياً عادياً إلى "مروحة" ثلاثية الأبعاد:
 * البطاقة في المنتصف قائمة وكاملة الحجم، وما حولها يميل ويصغر ويبهت تدريجياً.
 *
 * لماذا بهذا الشكل؟ لأن الحاوية تبقى حاوية تمرير أصلية، فيعمل السحب باللمس
 * وscroll-snap ولوحة المفاتيح كما هي؛ نحن نضيف طبقة بصرية فقط.
 *
 * الأداء: الحساب يجري داخل rAF ويُكتب مباشرة في style عناصر DOM — بلا
 * حالة React وبلا إعادة رسم، حتى أثناء السحب المستمر.
 *
 * مهم: التحويل يُطبَّق على الابن الأول لا على عنصر الالتقاط نفسه، لأن
 * scroll-snap يحسب مواضع الالتقاط من الصندوق **بعد** التحويل — فلو حرّكنا
 * عنصر الالتقاط لانزاحت نقاط الالتقاط معه ولما عاد السهم إلى الموضع نفسه.
 */

import { useCallback, useEffect, useRef } from 'react';

interface Options {
  /** أقصى زاوية ميلان للبطاقات الجانبية. */
  maxRotate?: number;
  /** مقدار التصغير لكل خطوة ابتعاد عن المنتصف. */
  scaleStep?: number;
  /** مقدار التلاشي لكل خطوة. */
  fadeStep?: number;
  /** سحب البطاقات الجانبية للخلف في محور Z. */
  depth?: number;
}

export function useCoverflow<T extends HTMLElement = HTMLDivElement>(
  trackRef: React.RefObject<T>,
  { maxRotate = 26, scaleStep = 0.1, fadeStep = 0.32, depth = 90 }: Options = {},
) {
  const raf = useRef(0);
  const enabled = useRef(true);

  const paint = useCallback(() => {
    raf.current = 0;
    const track = trackRef.current;
    if (!track) return;

    const trackCenter = track.getBoundingClientRect().left + track.clientWidth / 2;
    const children = track.children;

    for (let i = 0; i < children.length; i++) {
      const card = children[i] as HTMLElement;
      // عنصر الالتقاط يبقى ثابتاً؛ الطبقة الداخلية هي التي تتحرك
      const inner = (card.firstElementChild as HTMLElement | null) ?? card;
      const r = card.getBoundingClientRect();
      if (!r.width) continue;

      // البعد عن المنتصف مقيساً بعرض البطاقة: 0 = في المنتصف، 1 = بطاقة كاملة جانباً
      const offset = (r.left + r.width / 2 - trackCenter) / r.width;
      const dist = Math.min(Math.abs(offset), 2.2);

      if (!enabled.current) {
        inner.style.transform = '';
        inner.style.opacity = '1';
        card.style.zIndex = '';
        continue;
      }

      const rotate = Math.max(-maxRotate, Math.min(maxRotate, -offset * maxRotate));
      const scale = Math.max(0.72, 1 - dist * scaleStep);
      const fade = Math.max(0.35, 1 - dist * fadeStep);
      // البطاقات الجانبية تتقارب قليلاً نحو المنتصف فتتراكب كما في المرجع
      const pull = offset * -14;

      inner.style.transform =
        `translateX(${pull.toFixed(1)}px) translateZ(${(-dist * depth).toFixed(1)}px) ` +
        `rotateY(${rotate.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      inner.style.opacity = fade.toFixed(3);
      card.style.zIndex = String(100 - Math.round(dist * 10));
      card.dataset.active = dist < 0.45 ? 'true' : 'false';
    }
  }, [trackRef, maxRotate, scaleStep, fadeStep, depth]);

  const schedule = useCallback(() => {
    if (!raf.current) raf.current = requestAnimationFrame(paint);
  }, [paint]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    enabled.current = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    track.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    // الصور تصل متأخرة وتُغيّر المقاسات — نعيد الحساب بعد اكتمال التخطيط
    const ro = new ResizeObserver(schedule);
    ro.observe(track);
    schedule();

    return () => {
      // تصفير المرجع إلزامي: StrictMode في التطوير يُركّب التأثير مرتين،
      // فلو بقي raf.current غير صفري بعد الإلغاء لحجب الجدولة التالية للأبد
      // ولما رُسمت المروحة إطلاقاً.
      cancelAnimationFrame(raf.current);
      raf.current = 0;
      track.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      ro.disconnect();
    };
  }, [trackRef, schedule]);

  return { repaint: schedule };
}
