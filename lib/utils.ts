import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const AR_CURRENCY: Record<string, string> = {
  SAR: 'ر.س', AED: 'د.إ', KWD: 'د.ك', QAR: 'ر.ق', BHD: 'د.ب', OMR: 'ر.ع',
  EGP: 'ج.م', USD: '$', EUR: '€', GBP: '£', JPY: '¥', TRY: '₺',
};

export function formatPrice(value: number, currency = 'SAR') {
  if (!Number.isFinite(value)) return '—';
  if (value === 0) return 'مجاناً';
  const symbol = AR_CURRENCY[currency] ?? currency;
  // ar-u-nu-latn: أرقام لاتينية. الافتراضي ar-SA يُخرج أرقاماً هندية (٦٬٤٠٠)
  // وهو ما يتعارض مع خط الأرقام اللاتيني في الواجهة.
  return `${new Intl.NumberFormat('ar-u-nu-latn', { maximumFractionDigits: 0 }).format(value)} ${symbol}`;
}

/**
 * تصريف العدد في العربية — القاعدة رباعية لا ثنائية كالإنجليزية:
 * 1 مفرد، 2 مثنى، 3–10 جمع تكسير، 11+ تمييز مفرد منصوب.
 * كتابة «1 أيام» أو «15 أيام» خطأ نحوي ظاهر للقارئ العربي.
 */
export function pluralAr(
  count: number,
  forms: { one: string; two: string; few: string; many: string },
) {
  const n = Math.abs(Math.round(count));
  if (n === 1) return forms.one;
  if (n === 2) return forms.two;
  if (n >= 3 && n <= 10) return `${n} ${forms.few}`;
  return `${n} ${forms.many}`;
}

export const daysAr = (n: number) =>
  pluralAr(n, { one: 'يوم واحد', two: 'يومان', few: 'أيام', many: 'يوماً' });

export const hoursAr = (n: number) =>
  pluralAr(n, { one: 'ساعة', two: 'ساعتان', few: 'ساعات', many: 'ساعة' });

export const nightsAr = (n: number) =>
  pluralAr(n, { one: 'ليلة واحدة', two: 'ليلتان', few: 'ليالٍ', many: 'ليلة' });

export const activitiesAr = (n: number) =>
  pluralAr(n, { one: 'نشاط واحد', two: 'نشاطان', few: 'أنشطة', many: 'نشاطاً' });

export function formatDuration(minutes: number) {
  if (!minutes) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} د`;
  return m ? `${h} س ${m} د` : hoursAr(h);
}

export function priceLevelLabel(level: number) {
  return '$'.repeat(Math.min(4, Math.max(1, Math.round(level))));
}

export function formatDateAr(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  // ca-gregory صراحةً: بعض المتصفحات تُرجع تقويماً هجرياً مع ar-SA
  return new Intl.DateTimeFormat('ar-u-nu-latn-ca-gregory', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(d);
}

/** تحويل بايت/أخطاء غير معروفة إلى رسالة عربية قابلة للعرض. */
export function toErrorMessage(err: unknown, fallback = 'حدث خطأ غير متوقع') {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string') return err;
  return fallback;
}
