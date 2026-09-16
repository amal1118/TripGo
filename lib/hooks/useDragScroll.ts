'use client';

/**
 * useDragScroll — سحب أفقي بالمؤشر مع زخم (inertia) وتوافق كامل مع RTL.
 *
 * لماذا يدوياً بدل مكتبة؟ الحاوية أصلاً قابلة للتمرير باللمس عبر
 * scroll-snap الأصلي؛ ما ينقص هو السحب بالفأرة على سطح المكتب. هذا الخطّاف
 * يضيفه فقط، بـ Pointer Events، دون أن يعطّل التمرير اللمسي أو يفرض
 * إعادة رسم في كل إطار (كل شيء عبر refs وخصائص DOM مباشرة).
 *
 * تنبيه RTL: `scrollLeft` محور فيزيائي. في حاوية RTL يبدأ من صفر ويصبح
 * سالباً كلما تقدّمنا، لذلك التقدّم للأمام = طرح، لا إضافة.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

interface Options {
  /** عرض البطاقة + الفجوة — يُحسب تلقائياً إن لم يُمرَّر. */
  step?: number;
  /** تعطيل الزخم للأجهزة التي تفضّل تقليل الحركة. */
  momentum?: boolean;
}

export function useDragScroll<T extends HTMLElement = HTMLDivElement>(options: Options = {}) {
  const { momentum = true } = options;
  const ref = useRef<T>(null);

  const [dragging, setDragging] = useState(false);
  const [index, setIndex] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const state = useRef({ down: false, startX: 0, startScroll: 0, lastX: 0, lastT: 0, velocity: 0, moved: false });
  const raf = useRef(0);

  /** مقدار التقدّم لبطاقة واحدة. */
  const getStep = useCallback(() => {
    if (options.step) return options.step;
    const el = ref.current;
    const first = el?.firstElementChild as HTMLElement | null;
    if (!el || !first) return 280;
    const gap = parseFloat(getComputedStyle(el).columnGap || '20') || 20;
    return first.offsetWidth + gap;
  }, [options.step]);

  const syncState = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const pos = Math.abs(el.scrollLeft);           // abs يغطي RTL (قيم سالبة)
    setIndex(Math.round(pos / getStep()));
    setAtStart(pos < 8);
    setAtEnd(pos > max - 8);
  }, [getStep]);

  /** تحريك بمقدار بطاقة. dir = 1 يعني "التالي" بصرياً، أياً كان اتجاه الصفحة. */
  const scrollByCard = useCallback(
    (dir: 1 | -1) => {
      const el = ref.current;
      if (!el) return;
      const rtl = getComputedStyle(el).direction === 'rtl';
      // في RTL التقدّم للأمام يُنقص scrollLeft، فنقلب الإشارة
      const delta = getStep() * dir * (rtl ? -1 : 1);
      el.scrollBy({ left: delta, behavior: 'smooth' });
    },
    [getStep],
  );

  /** يوسّط بطاقة بعينها. يتعامل مع RTL حيث تكون قيم scrollLeft سالبة. */
  const scrollToIndex = useCallback(
    (i: number, behavior: ScrollBehavior = 'smooth') => {
      const el = ref.current;
      if (!el) return;
      const rtl = getComputedStyle(el).direction === 'rtl';
      const left = getStep() * i * (rtl ? -1 : 1);
      el.scrollTo({ left, behavior });
    },
    [getStep],
  );

  /* ---------- السحب بالمؤشر ---------- */

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const glide = () => {
      const s = state.current;
      if (Math.abs(s.velocity) < 0.4) { raf.current = 0; syncState(); return; }
      el.scrollLeft -= s.velocity;
      s.velocity *= 0.94;                            // احتكاك
      raf.current = requestAnimationFrame(glide);
    };

    const onPointerDown = (e: PointerEvent) => {
      // الفأرة فقط: اللمس يعمل أصلاً بتمرير المتصفح الأصلي وهو أنعم
      if (e.pointerType !== 'mouse') return;
      const s = state.current;
      s.down = true; s.moved = false;
      s.startX = e.clientX;
      s.startScroll = el.scrollLeft;
      s.lastX = e.clientX; s.lastT = performance.now(); s.velocity = 0;
      cancelAnimationFrame(raf.current); raf.current = 0;
      setDragging(true);
    };

    const onPointerMove = (e: PointerEvent) => {
      const s = state.current;
      if (!s.down) return;
      const dx = e.clientX - s.startX;
      if (!s.moved && Math.abs(dx) > 4) {
        s.moved = true;
        el.setPointerCapture(e.pointerId);
      }
      if (!s.moved) return;
      e.preventDefault();
      el.scrollLeft = s.startScroll - dx;

      const now = performance.now();
      const dt = now - s.lastT;
      if (dt > 0) s.velocity = ((e.clientX - s.lastX) / dt) * 16;  // بكسل لكل إطار
      s.lastX = e.clientX; s.lastT = now;
    };

    const onPointerUp = (e: PointerEvent) => {
      const s = state.current;
      if (!s.down) return;
      s.down = false;
      setDragging(false);
      if (el.hasPointerCapture?.(e.pointerId)) el.releasePointerCapture(e.pointerId);
      if (momentum && s.moved && Math.abs(s.velocity) > 1) raf.current = requestAnimationFrame(glide);
      else syncState();
    };

    /** يمنع فتح الرابط إذا كان المستخدم يسحب لا ينقر. */
    const onClickCapture = (e: MouseEvent) => {
      if (state.current.moved) { e.preventDefault(); e.stopPropagation(); }
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);
    el.addEventListener('click', onClickCapture, true);
    el.addEventListener('scroll', syncState, { passive: true });
    syncState();

    return () => {
      cancelAnimationFrame(raf.current);
      raf.current = 0;   // انظر الملاحظة نفسها في useCoverflow
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerUp);
      el.removeEventListener('click', onClickCapture, true);
      el.removeEventListener('scroll', syncState);
    };
  }, [momentum, syncState]);

  return { ref, dragging, index, atStart, atEnd, scrollByCard, scrollToIndex };
}
