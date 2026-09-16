'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export const UserMenu = React.memo(function UserMenu({ email, avatarUrl }: { email: string; avatarUrl: string | null }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const signOut = React.useCallback(async () => {
    await createClient().auth.signOut();
    router.push('/');
    router.refresh();
  }, [router]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="grid size-9 place-items-center overflow-hidden rounded-full border border-border bg-muted text-xs font-medium transition-transform hover:scale-105"
        aria-label="قائمة الحساب"
      >
        {avatarUrl
          ? <Image src={avatarUrl} alt="" width={36} height={36} className="size-full object-cover" unoptimized />
          : email.slice(0, 2).toUpperCase()}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="glass glass-sheen absolute end-0 top-11 z-50 w-56 overflow-hidden rounded-2xl p-1.5">
            <p className="truncate px-3 py-2 text-xs text-muted-foreground" dir="ltr">{email}</p>
            <div className="my-1 h-px bg-border/60" />
            <button
              onClick={signOut}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
            >
              <LogOut className="size-4" />
              تسجيل الخروج
            </button>
          </div>
        </>
      )}
    </div>
  );
});
