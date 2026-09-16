'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toErrorMessage } from '@/lib/utils';

const GoogleLogo = (
  <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
    <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.05l3.66 2.84c.87-2.6 3.3-4.51 6.16-4.51Z" />
  </svg>
);

export function LoginCard() {
  const params = useSearchParams();
  const next = params.get('next') ?? '/dashboard';
  const [googlePending, setGooglePending] = React.useState(false);
  const [emailPending, setEmailPending] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [sentTo, setSentTo] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (params.get('error')) toast.error('تعذّر إكمال تسجيل الدخول. حاول مرة أخرى.');
  }, [params]);

  /** الوجهة بعد نجاح المصادقة — نفس المسار للمزوّد وللرابط السحري. */
  const callbackUrl = React.useCallback(
    () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
    [next],
  );

  const signInWithGoogle = React.useCallback(async () => {
    setGooglePending(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // PKCE: يعود المستخدم إلى /auth/callback ليُبدَّل الكود بجلسة
          redirectTo: callbackUrl(),
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      });
      if (error) throw error;
    } catch (err) {
      toast.error(toErrorMessage(err, 'تعذّر بدء تسجيل الدخول'));
      setGooglePending(false);
    }
  }, [callbackUrl]);

  const signInWithEmail = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const address = email.trim();
      if (!address) return;

      setEmailPending(true);
      try {
        const supabase = createClient();
        // رابط سحري لمرة واحدة — بلا كلمة مرور، ويُنشئ الحساب عند أول دخول
        const { error } = await supabase.auth.signInWithOtp({
          email: address,
          options: { emailRedirectTo: callbackUrl(), shouldCreateUser: true },
        });
        if (error) throw error;
        setSentTo(address);
      } catch (err) {
        toast.error(toErrorMessage(err, 'تعذّر إرسال رابط الدخول'));
      } finally {
        setEmailPending(false);
      }
    },
    [email, callbackUrl],
  );

  if (sentTo) {
    return (
      <div className="card-warm p-7 text-center shadow-card-lg sm:p-10">
        <div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-primary/15 text-primary">
          <CheckCircle2 className="size-7" />
        </div>
        <h1 className="text-2xl font-semibold">تفقّد بريدك</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          أرسلنا رابط دخول إلى <span className="font-medium text-foreground">{sentTo}</span>.
          <br />
          افتح الرابط من هذا المتصفح نفسه لإتمام تسجيل الدخول.
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="mt-7"
          onClick={() => {
            setSentTo(null);
            setEmail('');
          }}
        >
          استخدام بريد آخر
        </Button>
      </div>
    );
  }

  const busy = googlePending || emailPending;

  return (
    <div className="card-warm p-7 shadow-card-lg sm:p-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-primary/15 text-xl font-semibold text-primary">
          TG
        </div>
        <h1 className="text-2xl font-semibold">أهلاً بك في TripGo</h1>
        <p className="mt-2 text-sm text-muted-foreground">سجّل دخولك لحفظ رحلاتك والوصول للمساعد الذكي</p>
      </div>

      <Button
        variant="glass"
        size="lg"
        className="w-full justify-center gap-3"
        disabled={busy}
        onClick={signInWithGoogle}
      >
        {googlePending ? <Loader2 className="size-4 animate-spin" /> : GoogleLogo}
        المتابعة بحساب Google
      </Button>

      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-border/70" />
        <span className="text-xs text-muted-foreground">أو بالبريد الإلكتروني</span>
        <span className="h-px flex-1 bg-border/70" />
      </div>

      <form onSubmit={signInWithEmail} className="space-y-3">
        <Label htmlFor="email" className="sr-only">
          البريد الإلكتروني
        </Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute end-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            required
            dir="ltr"
            autoComplete="email"
            placeholder="you@example.com"
            className="pe-11 text-start"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
          />
        </div>
        <Button type="submit" size="lg" className="w-full justify-center gap-2" disabled={busy || !email.trim()}>
          {emailPending ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4 rotate-180" />}
          إرسال رابط الدخول
        </Button>
      </form>

      <p className="mt-8 text-center text-xs leading-relaxed text-muted-foreground">
        بالمتابعة فإنك توافق على شروط الاستخدام وسياسة الخصوصية.
        <br />
        لا نطلب كلمة مرور — نرسل لك رابط دخول لمرة واحدة.
      </p>
    </div>
  );
}
