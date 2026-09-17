import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

/**
 * الـ middleware يتحقق من الجلسة ويعيد التوجيه — وهذا سلوك صحيح للصفحات فقط.
 * لو سرى على أصول البناء (`_next/**`) أو ملفات `public/` لصار طلب ملف CSS
 * أو JS مُعرّضاً لتوجيه 307 إلى `/login`، فتصل الصفحة بلا تنسيق: HTML خام.
 * لذلك نستثني شجرة `_next` كاملة وكل امتدادات الملفات الساكنة، لا بعضها.
 */
export const config = {
  matcher: [
    '/((?!_next/|favicon\\.ico|.*\\.(?:css|js|mjs|map|json|txt|xml|webmanifest|svg|png|jpg|jpeg|gif|webp|avif|ico|mp4|webm|woff|woff2|ttf|otf|eot)$).*)',
  ],
};
