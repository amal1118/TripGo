import { Suspense } from 'react';
import Link from 'next/link';
import { LoginCard } from '@/components/shared/LoginCard';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = { title: 'تسجيل الدخول' };

export default function LoginPage() {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-6 py-16">
      <div aria-hidden className="aurora pointer-events-none absolute inset-0" />
      <div aria-hidden className="pointer-events-none absolute -top-24 start-1/4 size-96 animate-float rounded-full bg-primary/20 blur-3xl" />

      <div className="relative w-full max-w-md">
        <Link href="/" className="mb-8 block text-center text-sm text-muted-foreground hover:text-foreground">
          ← العودة للرئيسية
        </Link>
        <Suspense fallback={<Skeleton className="h-96 w-full rounded-3xl" />}>
          <LoginCard />
        </Suspense>
      </div>
    </main>
  );
}
