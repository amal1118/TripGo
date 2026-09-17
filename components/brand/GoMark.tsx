import { cn } from '@/lib/utils';
import { BRAND_MARK, GO_PATHS, GO_VIEW_BOX } from './marks';

/**
 * علامة «Go» وحدها — نفس رسم الشعار الكامل مقصوصاً على الحرفين والسهم،
 * بخلفية مفرّغة كذلك. تُستخدم حيث نحتاج شعاراً أيقونياً لا كلمة كاملة
 * (بطاقة تسجيل الدخول مثلاً) بدل مربّع صورة بخلفية.
 */
export function GoMark({
  className,
  /** يرسم العلامة بلون النص بدل برتقالي الهوية. */
  mono = false,
}: {
  className?: string;
  mono?: boolean;
}) {
  return (
    <svg
      viewBox={GO_VIEW_BOX}
      className={cn('block h-10 w-auto', className)}
      fill={mono ? 'currentColor' : BRAND_MARK}
      fillRule="evenodd"
      aria-hidden
      focusable="false"
    >
      {GO_PATHS.map((d) => (
        <path key={d.slice(0, 24)} d={d} />
      ))}
    </svg>
  );
}
