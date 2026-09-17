/**
 * العنوان الأساسي (canonical origin) للتطبيق.
 *
 * لماذا لا نستعمل `window.location.origin` مباشرةً لمصادقة OAuth؟
 * لأن Supabase يطابق `redirect_to` مع قائمة Redirect URLs المسموح بها حرفياً.
 * نطاقات Vercel تتغيّر: كل معاينة تحصل على نطاق جديد
 * (`trip-go-<hash>-<user>.vercel.app`)، وإعادة ربط المشروع تغيّر نطاق الإنتاج
 * نفسه. أي نطاق غير مُدرج ⇒ يتجاهل Supabase `redirect_to` ويرمي المستخدم على
 * Site URL (أي `http://localhost:3000` عندنا) — وهو رابط لا يفتح على الجوال.
 * لذلك نُثبّت وجهة واحدة عبر `NEXT_PUBLIC_SITE_URL` ونُدرجها وحدها في Supabase.
 */

/** localhost أو جهاز على نفس الشبكة المحلية (اختبار الجوال على خادم التطوير). */
function isLocalHost(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' ||
    hostname.endsWith('.local') ||
    /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
  );
}

/** يضيف البروتوكول إن غاب ويحذف الشرطة الأخيرة. */
function normalize(raw: string): string {
  const withScheme = /^https?:\/\//.test(raw) ? raw : `https://${raw}`;
  return withScheme.replace(/\/+$/, '');
}

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (typeof window !== 'undefined') {
    // أثناء التطوير (localhost أو IP الشبكة المحلية) نبقى على العنوان الحالي،
    // وإلا لَما عاد اختبار الجوال على خادم التطوير ممكناً إطلاقاً.
    if (isLocalHost(window.location.hostname)) return window.location.origin;
    // على نطاق منشور: العنوان المُثبّت أولاً، فهو وحده المُدرج في Supabase.
    return configured ? normalize(configured) : window.location.origin;
  }

  return configured ? normalize(configured) : 'http://localhost:3000';
}

/** وجهة ما بعد المصادقة — نفس المسار لمزوّد OAuth وللرابط السحري. */
export function getAuthCallbackUrl(next: string): string {
  return `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(next)}`;
}
