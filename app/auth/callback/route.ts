/** OAuth 2.0 callback — تبديل الكود بجلسة ثم التوجيه. */
import { NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { getSiteUrl } from '@/lib/site-url';

/**
 * خلف وكيل Vercel يحمل `request.url` أحياناً نطاق النشر الداخلي
 * (`trip-go-<hash>.vercel.app`) لا النطاق الذي يتصفّحه المستخدم، فتُكتب كوكي
 * الجلسة على أصل وتُقرأ من أصل آخر. `x-forwarded-host` هو النطاق الحقيقي.
 */
function resolveOrigin(request: Request): string {
  const host = request.headers.get('x-forwarded-host');
  if (host) {
    const proto = request.headers.get('x-forwarded-proto') ?? 'https';
    return `${proto}://${host}`;
  }
  const { origin } = new URL(request.url);
  return origin || getSiteUrl();
}

/** يُبقي التوجيه داخل التطبيق — `next` يأتي من الرابط فلا يُوثق به. */
function safeNext(raw: string | null): string {
  return raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : '/dashboard';
}

function toLogin(origin: string, code: string, reason?: string | null) {
  const url = new URL('/login', origin);
  url.searchParams.set('error', code);
  if (reason) url.searchParams.set('reason', reason);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = resolveOrigin(request);
  const next = safeNext(searchParams.get('next'));

  // Supabase قد يصل إلى هنا بخطأ بدل كود — مثل فشل التبادل مع Google.
  // كان يُبتلع صامتاً ويظهر كصفحة دخول بلا سبب.
  const providerError = searchParams.get('error') ?? searchParams.get('error_code');
  if (providerError) {
    return toLogin(origin, providerError, searchParams.get('error_description'));
  }

  const supabase = createClient();
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const otpType = searchParams.get('type') as EmailOtpType | null;

  /**
   * مساران يصلان إلى هنا:
   *
   * 1) `token_hash` — رابط البريد. يُتحقق منه بلا PKCE، أي **يعمل من أي
   *    متصفح**. هذا مقصود: على الجوال يفتح تطبيق Gmail الرابطَ في متصفحه
   *    الداخلي لا في Safari الذي طلب الرابط، فلا يجد ملف تعريف الارتباط
   *    `code_verifier` ويفشل تبادل الكود. التحقق بالـ hash يتجاوز ذلك.
   * 2) `code` — مسار OAuth (PKCE). يلزم أن يُفتح في المتصفح نفسه.
   */
  if (tokenHash && otpType) {
    const { error } = await supabase.auth.verifyOtp({ type: otpType, token_hash: tokenHash });
    if (error) {
      const stale = /expired|invalid/i.test(error.message);
      return toLogin(origin, stale ? 'link_expired' : 'verify_failed', error.message);
    }
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      // كود مُستهلَك مسبقاً: نداء ثانٍ على هذا الرابط نفسه (تحديث بالسحب على
      // الجوال، أو متصفح داخل تطبيق يُسلّم الرابط للمتصفح الافتراضي).
      const reused = /expired|invalid|used/i.test(error.message);
      return toLogin(origin, reused ? 'reused_code' : 'exchange_failed', error.message);
    }
  } else {
    return toLogin(origin, 'missing_code');
  }

  // أول دخول؟ وجّهه لإعداد التفضيلات
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from('profiles').select('onboarded').eq('id', user.id).maybeSingle();
    if (!profile?.onboarded) return NextResponse.redirect(new URL('/onboarding', origin));
  }
  return NextResponse.redirect(new URL(next, origin));
}
