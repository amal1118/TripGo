import { cn } from '@/lib/utils';
import { BRAND_MARK, GO_PATHS, WORDMARK_VIEW_BOX } from './marks';

/**
 * شعار TripGo الكامل — رسم متجهي بخلفية مفرّغة.
 *
 * «Trip» يرث currentColor فيتكيّف مع الخلفية التي يقف عليها (فاتحة أو داكنة)،
 * بينما «Go» يبقى ببرتقالي الهوية ثابتاً في كل الأوضاع. هذا ما استبدل صورة
 * PNG القديمة التي كانت تحمل خلفيتها الكريمية معها، فاضطرّت كل استدعاء
 * لإخفائها داخل بطاقة بيضاء ذات حواف دائرية وظل.
 */
export function TripGoLogo({
  className,
  /** يرسم «Go» بلون النص أيضاً — لسطحٍ أحادي اللون. */
  mono = false,
}: {
  className?: string;
  mono?: boolean;
}) {
  return (
    <svg
      viewBox={WORDMARK_VIEW_BOX}
      className={cn('block h-7 w-auto', className)}
      fill="none"
      aria-hidden
      focusable="false"
    >
      <g fill="currentColor">
        <rect x="59" y="78" width="165" height="41" rx="13" />
        <rect x="119" y="78" width="46" height="205" rx="14" />
        <rect x="222" y="132" width="45" height="151" rx="14" />
        <path d="M240,199 C252,200 262,199 268,196 C276,184 288,175 302,172 L317,171 L315,133 C296,131 281,137 271,152 L240,152 Z" />
        <circle cx="355" cy="95" r="25.5" />
        <rect x="333" y="132" width="45" height="151" rx="14" />
        <rect x="397" y="132" width="46" height="218" rx="14" />
        <path
          fillRule="evenodd"
          d="M397,207.5 a78,76.5 0 1,0 156,0 a78,76.5 0 1,0 -156,0 Z M444,208 a32,37 0 1,0 64,0 a32,37 0 1,0 -64,0 Z"
        />
      </g>
      <g fill={mono ? 'currentColor' : BRAND_MARK} fillRule="evenodd">
        {GO_PATHS.map((d) => (
          <path key={d.slice(0, 24)} d={d} />
        ))}
      </g>
    </svg>
  );
}
