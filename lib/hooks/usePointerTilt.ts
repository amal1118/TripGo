'use client';

/**
 * usePointerTilt — استجابة البطاقة للمؤشر: ميلان ثلاثي الأبعاد + وهج يتبع المؤشر.
 *
 * يكتب مباشرة في CSS custom properties عبر ref، فلا يمرّ بحالة React
 * ولا يُسبّب إعادة رسم أثناء حركة المؤشر (الحركة تصل 60+ حدثاً بالثانية).
 * يُعطَّل تلقائياً على الأجهزة اللمسية وعند تفضيل تقليل الحركة.
 */

import { useCallback, useEffect, useRef } from 'react';

export function usePointerTilt<T extends HTMLElement = HTMLDivElement>(maxDeg = 7) {
  const ref = useRef<T>(null);
  const enabled = useRef(true);

  useEffect(() => {
    enabled.current =
      window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<T>) => {
      const el = ref.current;
      if (!enabled.current || !el) return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty('--rx', `${(-py * maxDeg).toFixed(2)}deg`);
      el.style.setProperty('--ry', `${(px * maxDeg * 1.2).toFixed(2)}deg`);
      el.style.setProperty('--mx', `${((px + 0.5) * 100).toFixed(1)}%`);
      el.style.setProperty('--my', `${((py + 0.5) * 100).toFixed(1)}%`);
      el.style.setProperty('--lift', '1');
    },
    [maxDeg],
  );

  const onPointerLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
    el.style.setProperty('--lift', '0');
  }, []);

  return { ref, onPointerMove, onPointerLeave };
}
