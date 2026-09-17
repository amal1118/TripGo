'use client';

/**
 * useCoverflow — يحوّل صف بطاقات أفقياً عادياً إلى "مروحة" ثلاثية الأبعاد:
 * البطاقة في المنتصف قائمة وكاملة الحجم وفي المقدمة، وما حولها ينكمش ويميل
 * نحو المركز ويغوص للخلف ويبهت، فتتراكب الجوانب تحت البطاقة البارزة.
 *
 * لماذا بهذا الشكل؟ لأن الحاوية تبقى حاوية تمرير أصلية، فيعمل السحب باللمس
 * وscroll-snap ولوحة المفاتيح كما هي؛ نحن نضيف طبقة بصرية فقط.
 *
 * الاستجابة للأحجام: كل المقادير الأفقية نِسَب من **عرض البطاقة نفسها** لا
 * قيم بكسل ثابتة، وعرض البطاقة نفسه مرن (clamp في CSS). فالمروحة تتصرّف
 * بالتناسب ذاته على الجوال وعلى الشاشة الكبيرة دون نقاط توقّف إضافية.
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
  /** أقصى زاوية ميلان للبطاقات الجانبية (الحافة الداخلية نحو الناظر). */
  maxRotate?: number;
  /** مقدار التصغير لكل خطوة ابتعاد عن المنتصف. */
  scaleStep?: number;
  /** أصغر تصغير مسموح مهما بعُدت البطاقة. */
  minScale?: number;
  /** مقدار التلاشي لكل خطوة. */
  fadeStep?: number;
  /** سحب البطاقات الجانبية للخلف في محور Z (بكسل لكل خطوة). */
  depth?: number;
  /** تقارب الجوانب نحو المنتصف — نسبة من عرض البطاقة لكل خطوة. */
  gather?: number;
  /** إعتام البطاقات البعيدة لكل خطوة (محاكاة العمق). */
  dimStep?: number;
  /** ضبابية العمق القصوى بالبكسل. */
  maxBlur?: number;
  /** أبعد مسافة تُحتسب — بعدها تتجمّد القيم فلا تختفي البطاقات تماماً. */
  maxDistance?: number;
}

export function useCoverflow<T extends HTMLElement = HTMLDivElement>(
  trackRef: React.RefObject<T>,
  {
    maxRotate = 24,
    scaleStep = 0.17,
    minScale = 0.6,
    fadeStep = 0.17,
    depth = 130,
    gather = 0.28,
    dimStep = 0.14,
    maxBlur = 3,
    maxDistance = 2.6,
  }: Options = {},
) {
  const raf = useRef(0);
  const flat = useRef(false);

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
      const clamped = Math.max(-maxDistance, Math.min(maxDistance, offset));
      const dist = Math.abs(clamped);

      const scale = Math.max(minScale, 1 - dist * scaleStep);
      const fade = Math.max(0.3, 1 - dist * fadeStep);
      // التقارب يُقاس بعرض البطاقة، فيبقى التراكب متماثلاً في كل الأحجام
      const pull = -clamped * r.width * gather;

      if (flat.current) {
        // تفضيل تقليل الحركة: نحتفظ بهرمية الحجم ونُسقط الميلان والعمق
        inner.style.transform = `translateX(${pull.toFixed(1)}px) scale(${scale.toFixed(3)})`;
        inner.style.opacity = fade.toFixed(3);
        inner.style.filter = '';
      } else {
        // الحافة الداخلية تميل نحو الناظر (كوفر-فلو الكلاسيكي) فتبدو
        // الجوانب كأنها تلتفّ حول البطاقة الوسطى
        const rotate = clamped * maxRotate;
        const blur = Math.min(maxBlur, Math.max(0, dist - 0.3) * 1.6);
        const dim = Math.max(0.55, 1 - dist * dimStep);

        inner.style.transform =
          `translateX(${pull.toFixed(1)}px) translateZ(${(-dist * depth).toFixed(1)}px) ` +
          `rotateY(${rotate.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
        inner.style.opacity = fade.toFixed(3);
        inner.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px) brightness(${dim.toFixed(3)})` : '';
      }

      // ترتيب الطبقات: الوسطى دائماً في المقدمة ثم ما يليها
      card.style.zIndex = String(100 - Math.round(dist * 10));
      card.dataset.active = dist < 0.45 ? 'true' : 'false';
    }
  }, [trackRef, maxRotate, scaleStep, minScale, fadeStep, depth, gather, dimStep, maxBlur, maxDistance]);

  const schedule = useCallback(() => {
    if (!raf.current) raf.current = requestAnimationFrame(paint);
  }, [paint]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    flat.current = motion.matches;
    const onMotion = (e: MediaQueryListEvent) => { flat.current = e.matches; schedule(); };
    motion.addEventListener('change', onMotion);

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
      motion.removeEventListener('change', onMotion);
      track.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      ro.disconnect();
    };
  }, [trackRef, schedule]);

  return { repaint: schedule };
}
