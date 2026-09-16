/**
 * components/plan/options.ts
 * خيارات التفضيلات مصنّفة ومفصولة — مصدر واحد للحقيقة تستخدمه
 * صفحة Onboarding وصفحة بناء الخطة معاً.
 */
import type { BudgetLevel, Pace, StayStyle, TripType } from '@/types/trip';

export const TRIP_TYPES: { value: TripType; label: string; hint: string; emoji: string }[] = [
  { value: 'solo', label: 'فردية', hint: 'أسافر وحدي', emoji: '🧍' },
  { value: 'couple', label: 'ثنائية', hint: 'شهر عسل أو إجازة رومانسية', emoji: '💞' },
  { value: 'family', label: 'عائلية', hint: 'مع الأطفال أو الوالدين', emoji: '👨‍👩‍👧' },
  { value: 'friends', label: 'أصدقاء', hint: 'مجموعة تبحث عن المتعة', emoji: '🎉' },
  { value: 'business', label: 'عمل', hint: 'مهام مع وقت حر محدود', emoji: '💼' },
];

export const BUDGET_LEVELS: { value: BudgetLevel; label: string; hint: string; range: string }[] = [
  { value: 'budget', label: 'اقتصادية', hint: 'أوفر الخيارات دون تنازل عن الجودة', range: '< 300 / يوم' },
  { value: 'comfort', label: 'متوسطة', hint: 'توازن بين السعر والراحة', range: '300–800 / يوم' },
  { value: 'luxury', label: 'فاخرة', hint: 'فنادق راقية وتجارب مختارة', range: '> 800 / يوم' },
];

export const PACES: { value: Pace; label: string; hint: string }[] = [
  { value: 'relaxed', label: 'هادئة', hint: 'نشاطان في اليوم مع وقت فراغ' },
  { value: 'balanced', label: 'متوازنة', hint: 'ثلاثة إلى أربعة أنشطة' },
  { value: 'packed', label: 'مكثّفة', hint: 'أقصى استفادة من كل ساعة' },
];

export const STAY_STYLES: { value: StayStyle; label: string }[] = [
  { value: 'hotel', label: 'فندق' },
  { value: 'apartment', label: 'شقة مفروشة' },
  { value: 'resort', label: 'منتجع' },
  { value: 'boutique', label: 'بوتيك' },
  { value: 'hostel', label: 'نزل اقتصادي' },
];

/** الاهتمامات — يجب أن تطابق القائمة في preferenceExtractionPrompt. */
export const INTERESTS = [
  { value: 'طبيعة', emoji: '🏔️' },
  { value: 'تاريخ', emoji: '🏛️' },
  { value: 'طعام', emoji: '🍽️' },
  { value: 'تسوق', emoji: '🛍️' },
  { value: 'مغامرة', emoji: '🪂' },
  { value: 'فن وثقافة', emoji: '🎨' },
  { value: 'حياة ليلية', emoji: '🌃' },
  { value: 'استرخاء', emoji: '🧖' },
  { value: 'تصوير', emoji: '📸' },
  { value: 'رياضة', emoji: '⚽' },
] as const;

export const FOOD_PREFERENCES = ['حلال', 'نباتي', 'مأكولات بحرية', 'مطبخ محلي', 'خالٍ من الجلوتين', 'وجبات سريعة'] as const;

export const ACCESSIBILITY = ['مناسب لكراسي متحركة', 'مناسب للأطفال الصغار', 'مشي قليل', 'قريب من المسجد'] as const;

export const CURRENCIES = ['SAR', 'AED', 'KWD', 'QAR', 'USD', 'EUR'] as const;
