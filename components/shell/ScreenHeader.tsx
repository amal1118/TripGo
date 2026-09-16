import Image from 'next/image';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { ThemeToggle } from '@/components/shared/ThemeToggle';

/**
 * ScreenHeader — ترويسة داخل الصفحة على نمط تطبيقات الجوال:
 * صورة المستخدم + تحية على اليمين، وأزرار الإجراءات على اليسار.
 * ليست شريطاً ثابتاً — تنزلق مع المحتوى كما في التطبيقات الأصلية.
 */
export function ScreenHeader({
  name,
  avatarUrl,
  greeting = 'أهلاً بعودتك،',
}: {
  name: string;
  avatarUrl?: string | null;
  greeting?: string;
}) {
  return (
    <header className="mb-6 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <Link href="/dashboard" className="relative size-12 shrink-0 overflow-hidden rounded-full bg-secondary ring-1 ring-border">
          {avatarUrl ? (
            <Image src={avatarUrl} alt="" fill sizes="48px" className="object-cover" unoptimized />
          ) : (
            <span className="grid size-full place-items-center text-sm font-semibold text-muted-foreground">
              {name.slice(0, 2) || 'TG'}
            </span>
          )}
        </Link>

        <div className="min-w-0">
          <p className="t-sm text-muted-foreground">{greeting}</p>
          <p className="truncate text-lg font-bold leading-tight">{name}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <ThemeToggle />
        <button
          type="button"
          aria-label="الإشعارات"
          className="grid size-11 place-items-center rounded-full border border-border bg-card shadow-card transition-colors hover:bg-secondary"
        >
          <Bell className="size-[18px]" />
        </button>
      </div>
    </header>
  );
}
