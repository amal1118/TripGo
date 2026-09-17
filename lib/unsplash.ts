/**
 * lib/unsplash.ts — تحويل `imageQuery` إلى صورة حقيقية للمكان.
 *
 * كان النموذج يُنتج `imageQuery` لكل عنصر ثم تُهمله الواجهة تماماً، فتظهر
 * صور مخزون عامة فوق أسماء أماكن محدّدة. هنا نبحث عنها فعلياً مرة واحدة —
 * وقت توليد الخطة على الخادم — ونُخزّن الرابط داخل الخطة نفسها، فلا يتكرر
 * البحث عند كل فتح للصفحة ولا يُكشف المفتاح للمتصفح.
 *
 * بلا `UNSPLASH_ACCESS_KEY` لا يحدث شيء: تعود الدالة خريطة فارغة وتُكمل
 * الواجهة بمجموعات الصور المنتقاة مسبقاً في lib/images.ts.
 * ملاحظة ترخيص: Unsplash تشترط إسناد المصوّر عند عرض نتائج البحث.
 */

/** المهلة الكلية — الخطة أهم من صورها، فلا نُؤخّر الاستجابة من أجلها. */
const TOTAL_TIMEOUT_MS = 6_000;
/** طلبات متوازية — حصة Unsplash المجانية 50 طلباً/ساعة، والخطة ~20 عنصراً. */
const CONCURRENCY = 6;

interface SearchResult {
  results?: { urls?: { raw?: string; regular?: string } }[];
}

function accessKey() {
  return process.env.UNSPLASH_ACCESS_KEY?.trim() || '';
}

export function unsplashEnabled() {
  return accessKey().length > 0;
}

/** رابط بأبعاد ثابتة من raw — أصغر حجماً من regular وبنفس معايير بقية التطبيق. */
function sized(raw: string) {
  const sep = raw.includes('?') ? '&' : '?';
  return `${raw}${sep}auto=format&fit=crop&w=800&h=600&q=72`;
}

async function searchOne(query: string, key: string, signal: AbortSignal): Promise<string | null> {
  const url = new URL('https://api.unsplash.com/search/photos');
  url.searchParams.set('query', query);
  url.searchParams.set('per_page', '1');
  url.searchParams.set('orientation', 'landscape');
  url.searchParams.set('content_filter', 'high');

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${key}`, 'Accept-Version': 'v1' },
      signal,
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as SearchResult;
    const raw = data.results?.[0]?.urls?.raw;
    return raw ? sized(raw) : data.results?.[0]?.urls?.regular ?? null;
  } catch {
    return null;
  }
}

/**
 * يبحث عن كل استعلام مرة واحدة (بعد إزالة التكرار) ويعيد خريطة
 * استعلام → رابط. الاستعلامات التي تفشل تُحذف ببساطة، فيسقط العنصر
 * إلى المجموعة العامة بلا أي خطأ ظاهر للمستخدم.
 */
export async function resolveImages(queries: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const key = accessKey();
  if (!key) return out;

  const unique = [...new Set(queries.map((q) => q.trim()).filter((q) => q.length >= 3))];
  if (!unique.length) return out;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TOTAL_TIMEOUT_MS);

  try {
    let cursor = 0;
    const workers = Array.from({ length: Math.min(CONCURRENCY, unique.length) }, async () => {
      while (cursor < unique.length && !controller.signal.aborted) {
        const q = unique[cursor++];
        const url = await searchOne(q, key, controller.signal);
        if (url) out.set(q, url);
      }
    });
    await Promise.all(workers);
  } finally {
    clearTimeout(timer);
  }

  return out;
}
