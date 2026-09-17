import Link from 'next/link';
import { TripGoLogo } from '@/components/brand/TripGoLogo';
import { cn } from '@/lib/utils';

/**
 * شعار مصغّر يتكرر أعلى شاشات التطبيق الداخلية.
 * الحاوية الخارجية دائماً flex-center بلا عرض ثابت، فيعمل التوسيط سواء
 * استُخدم في تدفّق الصفحة العادي أو كطبقة مطلقة بعرض كامل (inset-x-0).
 *
 * الشعار متجهي بخلفية مفرّغة، فلون «Trip» يأتي من الحاوية: `auto` يتبع
 * لون النص في السمة، و`onDark` يُثبّته أبيض فوق صور الغلاف الداكنة حيث
 * لا يتغيّر الخلف بتغيّر السمة.
 */
export function ScreenLogo({
  className,
  tone = 'auto',
}: {
  className?: string;
  tone?: 'auto' | 'onDark';
}) {
  return (
    <div className={cn('flex justify-center', className)}>
      <Link
        href="/"
        aria-label="TripGo"
        className={cn('block', tone === 'onDark' ? 'text-white' : 'text-foreground')}
      >
        <TripGoLogo className="h-6 w-auto sm:h-7" />
      </Link>
    </div>
  );
}
