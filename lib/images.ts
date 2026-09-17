/**
 * lib/images.ts — مصادر صور بطاقات الخطة.
 *
 * خدمة `source.unsplash.com` القديمة أُوقفت، فنعتمد استراتيجية من ثلاث
 * طبقات لا تحتاج مفتاح API:
 *  1) صور الوجهة نفسها من كتالوج الوجهات — حين تطابق وجهةُ الخطة واحدةً
 *     من العشرين وجهة المعتمدة، فتكون صور المعالم من المكان الحقيقي.
 *  2) صور Unsplash مُنتقاة مسبقاً حسب الفئة (مستقرة وسريعة عبر CDN).
 *  3) picsum.photos ببذرة مشتقة من الاستعلام كبديل حتمي عند فشل التحميل.
 * لو أضفت مفتاح Unsplash لاحقاً، بدّل getCardImage فقط — بقية الكود لا يتغيّر.
 */
import type { CardCategory } from '@/types/trip';
import { DESTINATIONS } from '@/lib/destinations';

/**
 * كل المعرّفات تم التحقق من توفّرها ومن مطابقتها لفئتها بصرياً.
 * حجم المجموعة مقصود (12–14): الخطة الواحدة تعرض حتى 4 بطاقات في الفئة،
 * ومجموعة من 4 صور كانت تُنتج تكراراً ظاهراً داخل التبويب الواحد.
 */
const POOLS: Record<CardCategory, string[]> = {
  hotels: [
    'photo-1607712617949-8c993d290809', 'photo-1590381105924-c72589b9ef3f',
    'photo-1618773928121-c32242e63f39', 'photo-1629140727571-9b5c6f6267b4',
    'photo-1611892440504-42a792e24d32', 'photo-1562438668-bcf0ca6578f0',
    'photo-1587985064135-0366536eab42', 'photo-1566073771259-6a8506099945',
    'photo-1551882547-ff40c63fe5fa', 'photo-1590490360182-c33d57733427',
    'photo-1445019980597-93fa8acb246c', 'photo-1578683010236-d716f9a3f461',
  ],
  flights: [
    'photo-1644418634481-918f39597be8', 'photo-1631623083964-6c92bde02266',
    'photo-1613474616705-e1c09211497d', 'photo-1603277103691-756354934c2d',
    'photo-1527605158555-853f200063e9', 'photo-1530469641172-8ac15d0a7d6a',
    'photo-1573076978602-a16914734d61', 'photo-1553619948-505cc1cdc320',
    'photo-1436491865332-7a61a109cc05', 'photo-1540339832862-474599807836',
    'photo-1569154941061-e231b4725ef1', 'photo-1474302770737-173ee21bab63',
  ],
  restaurants: [
    'photo-1613274554329-70f997f5789f', 'photo-1550966871-3ed3cdb5ed0c',
    'photo-1574966739987-65e38db0f7ce', 'photo-1602232037779-30b01ac3c457',
    'photo-1517248135467-4c7edcad34c4', 'photo-1578474846511-04ba529f0b88',
    'photo-1551632436-cbf8dd35adfa', 'photo-1537047902294-62a40c20a6ae',
    'photo-1612569188733-05e38c694a0a', 'photo-1414235077428-338989a2e8c0',
    'photo-1555396273-367ea4eb4db5', 'photo-1466978913421-dad2ebd01d17',
    'photo-1504754524776-8f4f37790ca0',
  ],
  experiences: [
    'photo-1480480565647-1c4385c7c0bf', 'photo-1521336575822-6da63fb45455',
    'photo-1620903669944-de50fbe78210', 'photo-1554913968-6ba85b94df1f',
    'photo-1596736890254-cef0137163bc', 'photo-1562388831-a7a060b9c1fe',
    'photo-1450500392544-c2cb0fd6e3b8', 'photo-1536607961765-592e80bcc19e',
    'photo-1593739742226-5e5e2fdb1f1c', 'photo-1533105079780-92b9be482077',
    'photo-1527631746610-bca00a040d60', 'photo-1551632811-561732d1e306',
  ],
  /**
   * معالم محايدة عمداً — بلا معالم أيقونية يعرفها الجميع. صورة برج إيفل
   * فوق بطاقة معبد في كيوتو أسوأ من صورة عمارة محايدة. المعالم الحقيقية
   * تأتي من الطبقة الأولى (كتالوج الوجهات) حين تكون الوجهة معروفة.
   */
  landmarks: [
    'photo-1530127857930-4c7389cdca70', 'photo-1576235282476-debff2a4d0b9',
    'photo-1554554497-0095c34db3ec', 'photo-1566559631133-969041fc5583',
    'photo-1524413840807-0c3cb6fa808d', 'photo-1552832230-c0197dd311b5',
    'photo-1499856871958-5b9627545d1a', 'photo-1513635269975-59663e0ac1ad',
    'photo-1500153556700-4c8db53996c3', 'photo-1523131328515-865dbf27fe0f',
  ],
  shopping: [
    'photo-1701278773098-9cfd25e8cde3', 'photo-1643841370871-146b51aa4cca',
    'photo-1516274626895-055a99214f08', 'photo-1690289067654-53d497d4e588',
    'photo-1556459540-932d32273741', 'photo-1567958451986-2de427a4a0be',
    'photo-1621406384199-f9ee619e3810', 'photo-1613169465179-533a5d1ce175',
    'photo-1625396697190-fc456b241f97', 'photo-1441986300917-64674bd600d8',
    'photo-1519567241046-7f570eee3ce6', 'photo-1555529669-e69e7aa0ba9a',
  ],
};

/** تجزئة ثابتة (deterministic) — نفس الاستعلام يعطي نفس الصورة دائماً. */
function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * فهرس الوجهات حسب الاسم — يُبنى مرة واحدة.
 * المفتاح بالعربية والإنجليزية معاً لأن النموذج قد يعيد أياً منهما.
 */
const DESTINATION_IMAGES = (() => {
  const map = new Map<string, string[]>();
  for (const d of DESTINATIONS) {
    const images = [d.image, ...d.gallery];
    for (const key of [d.name, d.nameEn, d.country, d.id]) {
      if (key) map.set(key.trim().toLowerCase(), images);
    }
  }
  return map;
})();

/**
 * صور الوجهة نفسها إن كانت ضمن الكتالوج المعتمد.
 * المطابقة بالاحتواء لأن النموذج يُعيد «كيوتو، اليابان» أو «Kyoto, Japan»
 * لا الاسم المجرّد.
 */
export function destinationImages(destination?: string | null): string[] | null {
  if (!destination) return null;
  const q = destination.trim().toLowerCase();
  if (!q) return null;
  const exact = DESTINATION_IMAGES.get(q);
  if (exact) return exact;
  for (const [key, images] of DESTINATION_IMAGES) {
    if (key.length >= 3 && q.includes(key)) return images;
  }
  return null;
}

export function getCardImage(
  category: CardCategory,
  query: string,
  opts: {
    w?: number;
    h?: number;
    /** ترتيب البطاقة داخل فئتها — يمنع تكرار الصورة بين البطاقات المتجاورة. */
    seed?: number;
    /** وجهة الرحلة — تُفعّل صور المكان الحقيقي للمعالم. */
    destination?: string | null;
  } = {},
): string {
  const { w = 800, h = 600, seed = 0, destination } = opts;

  // المعالم هي ما يرتبط بالمكان فعلاً؛ الفندق والمطعم عامّان بطبيعتهما
  const local = category === 'landmarks' ? destinationImages(destination) : null;
  const pool = local ?? POOLS[category] ?? POOLS.landmarks;

  /**
   * الاختيار بالترتيب (البذرة = رقم البطاقة داخل فئتها) لا بتجزئة النص.
   * التجزئة كانت تُعطي بطاقتين متجاورتين الصورة نفسها كثيراً — مع مجموعة
   * من 12 صورة واحتمال تصادم بين 4 بطاقات يقارب 40%. الترتيب يضمن التمايز
   * ما دام عدد البطاقات ≤ حجم المجموعة، والتجزئة تبقى إزاحةً تختلف من
   * وجهة لأخرى فلا تتشابه كل الرحلات.
   */
  // الإزاحة تعتمد على الوجهة (أو الفئة) لا على نص البطاقة: لو اعتمدت على
  // النص لاختلفت لكل بطاقة فضاع ترتيبُها وعاد التصادم من جديد.
  const offset = hash(destination || category);
  const id = pool[(offset + seed) % pool.length];
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=72`;
}

/** بديل عام عند فشل تحميل الصورة الأساسية (onError). */
export function getFallbackImage(query: string, w = 800, h = 600) {
  return `https://picsum.photos/seed/${encodeURIComponent(query || 'tripgo')}/${w}/${h}`;
}

/** صورة غلاف للرحلة تُخزَّن مع السجل في Supabase. */
export function getCoverImage(destinationEn: string) {
  const local = destinationImages(destinationEn);
  if (local) {
    return `https://images.unsplash.com/${local[0]}?auto=format&fit=crop&w=1200&h=700&q=74`;
  }
  return getCardImage('landmarks', destinationEn, { w: 1200, h: 700 });
}

export function mapsUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function flightSearchUrl(from: string, to: string, date?: string) {
  const q = `flights from ${from} to ${to}${date ? ` on ${date}` : ''}`;
  return `https://www.google.com/travel/flights?q=${encodeURIComponent(q)}`;
}

export function hotelSearchUrl(name: string, city: string) {
  return `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(`${name} ${city}`)}`;
}
