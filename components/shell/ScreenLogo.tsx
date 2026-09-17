import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * شعار مصغّر يتكرر أعلى شاشات التطبيق الداخلية.
 * الحاوية الخارجية دائماً flex-center بلا عرض ثابت، فيعمل التوسيط سواء
 * استُخدم في تدفّق الصفحة العادي أو كطبقة مطلقة بعرض كامل (inset-x-0).
 */
export function ScreenLogo({ className }: { className?: string }) {
  return (
    <div className={cn('flex justify-center', className)}>
      <Link
        href="/"
        aria-label="TripGo"
        className="block h-6 w-auto overflow-hidden rounded-md shadow-sm sm:h-7"
      >
        <Image
          src="/logo-wordmark.png"
          alt="TripGo"
          width={975}
          height={415}
          className="h-full w-auto object-contain"
        />
      </Link>
    </div>
  );
}
