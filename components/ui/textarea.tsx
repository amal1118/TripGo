import * as React from 'react';
import { cn } from '@/lib/utils';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[90px] w-full resize-none rounded-xl border border-border/70 bg-white/60 px-4 py-3 text-sm backdrop-blur-md placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:opacity-50 dark:bg-white/5',
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';
export { Textarea };
