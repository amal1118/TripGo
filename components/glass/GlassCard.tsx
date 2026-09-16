'use client';

import * as React from 'react';
import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'ref' | 'children'> {
  children?: React.ReactNode;
  /** كثافة الزجاج. subtle للخلفيات المزدحمة، strong للحاويات الرئيسية. */
  intensity?: 'subtle' | 'default' | 'strong';
  /** ترتيب الظهور في الشبكة — يُستخدم لتأخير الحركة. */
  index?: number;
  /** ميلان تفاعلي يتتبع المؤشر (مكلف نسبياً — فعّله للبطاقات المميزة فقط). */
  tilt?: boolean;
  hoverLift?: boolean;
}

const INTENSITY = { subtle: 'glass-subtle', default: 'glass', strong: 'glass glass-strong' } as const;

/**
 * الحاوية الزجاجية الأساسية.
 * الأداء: memo + تأخير محسوب من index بدل إنشاء variants جديدة لكل بطاقة،
 * والحركة تقتصر على transform/opacity (خصائص مركّبة على GPU).
 */
function GlassCardBase({
  className,
  intensity = 'default',
  index = 0,
  tilt = false,
  hoverLift = true,
  children,
  ...props
}: GlassCardProps) {
  const reduce = useReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);

  const handlePointerMove = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!tilt || reduce || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      ref.current.style.setProperty('--rx', `${(-py * 6).toFixed(2)}deg`);
      ref.current.style.setProperty('--ry', `${(px * 8).toFixed(2)}deg`);
      ref.current.style.setProperty('--mx', `${((px + 0.5) * 100).toFixed(1)}%`);
      ref.current.style.setProperty('--my', `${((py + 0.5) * 100).toFixed(1)}%`);
    },
    [tilt, reduce],
  );

  const handlePointerLeave = React.useCallback(() => {
    if (!ref.current) return;
    ref.current.style.setProperty('--rx', '0deg');
    ref.current.style.setProperty('--ry', '0deg');
  }, []);

  return (
    <motion.div
      ref={ref}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: Math.min(index * 0.06, 0.4) }}
      onPointerMove={tilt ? handlePointerMove : undefined}
      onPointerLeave={tilt ? handlePointerLeave : undefined}
      className={cn(
        'glass-sheen group relative overflow-hidden rounded-3xl',
        INTENSITY[intensity],
        hoverLift && 'transition-[transform,box-shadow] duration-500 hover:-translate-y-1.5',
        tilt && '[transform:perspective(1000px)_rotateX(var(--rx,0))_rotateY(var(--ry,0))] [transform-style:preserve-3d]',
        className,
      )}
      {...props}
    >
      {/* وهج يتبع المؤشر — يعزّز إحساس الزجاج */}
      {tilt && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: 'radial-gradient(400px circle at var(--mx,50%) var(--my,50%), hsl(var(--primary)/0.14), transparent 45%)' }}
        />
      )}
      {children}
    </motion.div>
  );
}

export const GlassCard = React.memo(GlassCardBase);
