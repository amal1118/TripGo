'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface OptionGroupProps<T extends string> {
  label: string;
  description?: string;
  options: readonly { value: T; label: string; hint?: string; emoji?: string; range?: string }[];
  value: T | T[];
  onChange: (value: T) => void;
  multiple?: boolean;
  columns?: 2 | 3 | 4;
}

/**
 * مجموعة خيارات زجاجية — تدعم الاختيار المفرد والمتعدد.
 * onChange تُمرَّر كـ callback مستقرة من الأب، والمكوّن memo،
 * فلا تُعاد رسم المجموعات الأخرى عند تغيير واحدة.
 */
function OptionGroupInner<T extends string>({
  label, description, options, value, onChange, multiple, columns = 2,
}: OptionGroupProps<T>) {
  const selected = React.useMemo(
    () => new Set(Array.isArray(value) ? value : [value]),
    [value],
  );

  return (
    <fieldset>
      <legend className="mb-1 text-sm font-medium">{label}</legend>
      {description && <p className="mb-3 text-xs text-muted-foreground">{description}</p>}

      <div className={cn('grid gap-2.5', columns === 2 && 'sm:grid-cols-2', columns === 3 && 'grid-cols-2 sm:grid-cols-3', columns === 4 && 'grid-cols-2 sm:grid-cols-4')}>
        {options.map((opt) => {
          const isOn = selected.has(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={isOn}
              onClick={() => onChange(opt.value)}
              className={cn(
                'relative overflow-hidden rounded-2xl border p-3.5 text-start transition-all duration-300 active:scale-[0.98]',
                isOn
                  // خط تحديد واحد فقط: إطار البطاقة نفسه — بلا ring ولا هالة shadow-glow
                  // (تحتوي على 0 0 0 1px) كي لا تظهر خطوط مزدوجة حول الخيار.
                  ? 'border-primary bg-primary/10 shadow-[0_12px_40px_-12px_hsl(var(--primary)/0.45)]'
                  : 'border-border bg-secondary/50 hover:-translate-y-0.5 hover:bg-secondary',
              )}
            >
              <div className="flex items-center gap-2">
                {opt.emoji && <span className="text-lg leading-none">{opt.emoji}</span>}
                <span className={cn('text-sm font-medium', isOn && 'text-primary')}>{opt.label}</span>
              </div>
              {opt.hint && <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{opt.hint}</p>}
              {opt.range && <p className="mt-1.5 text-[11px] font-medium tabular-nums text-primary/70" dir="ltr">{opt.range}</p>}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export const OptionGroup = React.memo(OptionGroupInner) as typeof OptionGroupInner;
