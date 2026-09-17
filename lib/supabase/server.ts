import 'server-only';
/** عميل Supabase للخادم (Server Components و Route Handlers) مربوط بالكوكيز. */
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options: CookieOptions) => {
          try { cookieStore.set({ name, value, ...options }); } catch {
            /* استدعاء من Server Component — التحديث يتم في middleware */
          }
        },
        remove: (name: string, options: CookieOptions) => {
          try { cookieStore.set({ name, value: '', ...options }); } catch { /* المصدر نفسه أعلاه */ }
        },
      },
    },
  );
}

/** مختصر: يُرجع المستخدم الحالي أو null. */
export async function getUser() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

/**
 * يضمن وجود مستخدم داخل Server Component.
 *
 * الـ middleware يحرس المسارات الخاصة، لكنه يقرأ الكوكي في لحظة سابقة للعرض:
 * قد ينتهي التوكن بين الطلبين، أو تصل صفحة محمية قبل أن تُكتب كوكي الجلسة
 * بعد عودة OAuth. عندها كان `user!.id` يرمي TypeError فيُجهض عرض الصفحة،
 * فتصل للمتصفح صفحة ناقصة. التوجيه لصفحة الدخول هو السلوك الصحيح.
 */
export async function requireUser(next?: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(next ? `/login?next=${encodeURIComponent(next)}` : '/login');
  return { supabase, user };
}
