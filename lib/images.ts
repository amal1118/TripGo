/**
 * lib/images.ts — مصادر صور مجانية للبطاقات.
 *
 * ملاحظة عملية: خدمة `source.unsplash.com` القديمة أُوقفت، لذا نعتمد
 * استراتيجية من طبقتين لا تحتاج مفتاح API:
 *  1) صور Unsplash مُنتقاة مسبقاً حسب الفئة (مستقرة وسريعة عبر CDN).
 *  2) picsum.photos ببذرة (seed) مشتقة من نص الاستعلام كبديل حتمي.
 * لو أضفت مفتاح Unsplash لاحقاً، بدّل getCardImage فقط — بقية الكود لا يتغيّر.
 */
import type { CardCategory } from '@/types/trip';

const POOLS: Record<CardCategory, string[]> = {
  hotels: [
    'photo-1566073771259-6a8506099945', 'photo-1551882547-ff40c63fe5fa',
    'photo-1590490360182-c33d57733427', 'photo-1445019980597-93fa8acb246c',
    'photo-1578683010236-d716f9a3f461',
  ],
  flights: [
    'photo-1436491865332-7a61a109cc05', 'photo-1540339832862-474599807836',
    'photo-1569154941061-e231b4725ef1', 'photo-1474302770737-173ee21bab63',
  ],
  restaurants: [
    'photo-1517248135467-4c7edcad34c4', 'photo-1414235077428-338989a2e8c0',
    'photo-1555396273-367ea4eb4db5', 'photo-1466978913421-dad2ebd01d17',
    'photo-1504754524776-8f4f37790ca0',
  ],
  experiences: [
    'photo-1533105079780-92b9be482077', 'photo-1527631746610-bca00a040d60',
    'photo-1551632811-561732d1e306', 'photo-1530789253388-582c481c54b0',
  ],
  landmarks: [
    'photo-1524413840807-0c3cb6fa808d', 'photo-1552832230-c0197dd311b5',
    'photo-1499856871958-5b9627545d1a', 'photo-1513635269975-59663e0ac1ad',
  ],
  shopping: [
    'photo-1441986300917-64674bd600d8', 'photo-1567958451986-2de427a4a0be',
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

export function getCardImage(
  category: CardCategory,
  query: string,
  opts: { w?: number; h?: number } = {},
): string {
  const { w = 800, h = 600 } = opts;
  const pool = POOLS[category] ?? POOLS.landmarks;
  const id = pool[hash(query || category) % pool.length];
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=72`;
}

/** بديل عام عند فشل تحميل الصورة الأساسية (onError). */
export function getFallbackImage(query: string, w = 800, h = 600) {
  return `https://picsum.photos/seed/${encodeURIComponent(query || 'tripgo')}/${w}/${h}`;
}

/** صورة غلاف للرحلة تُخزَّن مع السجل في Supabase. */
export function getCoverImage(destinationEn: string) {
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
