'use client';

import * as React from 'react';
import { ExternalLink, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Action { label: string; href: string; icon?: 'map' | 'external'; primary?: boolean }

/** أزرار CTA داخل البطاقة — روابط خارجية آمنة (noopener) وتفتح في تبويب جديد. */
function CardActionsBase({ actions, className }: { actions: Action[]; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {actions.filter((a) => a.href).map((a) => (
        <a
          key={a.label}
          href={a.href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all active:scale-95',
            a.primary
              ? 'bg-primary text-primary-foreground hover:brightness-110'
              : 'border border-white/40 bg-white/25 text-foreground backdrop-blur-md hover:bg-white/45 dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/20',
          )}
        >
          {a.icon === 'map' ? <MapPin className="size-3.5" /> : <ExternalLink className="size-3.5" />}
          {a.label}
        </a>
      ))}
    </div>
  );
}

export const CardActions = React.memo(CardActionsBase);
