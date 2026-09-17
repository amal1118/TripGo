'use client';

/**
 * يلتقط أخطاء المصادقة التي يُسقطها Supabase على *أي* صفحة.
 *
 * حين يفشل تبادل الكود، أو حين لا يكون `redirect_to` مُدرجاً في قائمة
 * Redirect URLs، يرمي Supabase المستخدم على Site URL الجذر ومعه الخطأ في
 * الاستعلام *وفي الـ hash* معاً — أي على صفحة الهبوط، حيث لا شيء يقرأه،
 * فيرى المستخدم رابطاً غامضاً وصفحة تبدو سليمة. نقرأه هنا ونعرضه.
 */
import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';

const MESSAGES: Record<string, string> = {
  reused_code: 'انتهت صلاحية رابط الدخول أو استُخدم مرتين. اضغط زر الدخول مرة واحدة وانتظر.',
  missing_code: 'رابط الدخول غير مكتمل. ابدأ تسجيل الدخول من جديد.',
  access_denied: 'أُلغيت الموافقة على الدخول.',
};

export function AuthErrorRelay() {
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    // /login يعرض أخطاءه بنفسه عبر LoginCard — لا نُكرّر الرسالة.
    if (pathname === '/login') return;

    const query = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const code = query.get('error_code') ?? query.get('error') ?? hash.get('error_code') ?? hash.get('error');
    if (!code) return;

    const reason = query.get('error_description') ?? hash.get('error_description') ?? undefined;

    // نظّف الرابط أولاً، وإلا بقي الخطأ في التاريخ وعاد مع كل رجوع للخلف.
    window.history.replaceState(null, '', window.location.pathname);

    toast.error(MESSAGES[code] ?? 'تعذّر إكمال تسجيل الدخول.', { description: reason });
    router.push(`/login?error=${encodeURIComponent(code)}`);
  }, [pathname, router]);

  return null;
}
