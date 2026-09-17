'use client';
import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '@/lib/utils';

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    // صف بارتفاع ثابت: التسمية بأيقونة والتسمية بدونها تشغلان الارتفاع نفسه،
    // فتبقى الحقول المتجاورة في الشبكة على خط أفقي واحد.
    className={cn('flex h-5 items-center gap-1.5 text-sm font-medium leading-none peer-disabled:opacity-70', className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;
export { Label };
