import { cn } from '@/lib/utils';
import { ScreenLogo } from './ScreenLogo';

/**
 * AppScreen — الغلاف المشترك لصفحات التطبيق (لا صفحة الهبوط).
 *
 * فلسفة Mobile-First: التخطيط مبني لعرض الهاتف أولاً، وعلى الشاشات الكبيرة
 * يبقى العمود محدود العرض في المنتصف بدل التمدد — فتظل التجربة "تطبيقاً"
 * لا صفحة ويب عريضة. الحشو السفلي يترك مساحة للشريط العائم.
 */
export function AppScreen({
  className,
  width = 'app',
  children,
}: {
  className?: string;
  /** app: عمود التطبيق (680px) · wide: للشاشات التي تحتاج شبكة أوسع */
  width?: 'app' | 'wide' | 'full';
  children: React.ReactNode;
}) {
  return (
    <div className="canvas relative min-h-dvh">
      <div
        className={cn(
          'relative mx-auto w-full px-4 pb-32 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6',
          width === 'app' && 'max-w-[680px]',
          width === 'wide' && 'max-w-[1100px]',
          className,
        )}
      >
        <ScreenLogo className="mb-5" />
        {children}
      </div>
    </div>
  );
}
