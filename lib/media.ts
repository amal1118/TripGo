/**
 * lib/media.ts — مصادر الوسائط الخارجية.
 *
 * فيديو الهيرو من Pexels (ترخيص مجاني بلا إسناد إلزامي): طيران فوق بحر
 * من الغيوم — حركة حقيقية للأمام تناسب تطبيق سفر.
 *
 * المشهد أزرق بارد في أصله، فيُدفَّأ عبر CSS (انظر HERO_VIDEO_FILTER) لا
 * عبر ملف معدَّل، حتى يبقى المصدر أصلياً وقابلاً للاستبدال.
 *
 * أربع دقات يختار المتصفح أنسبها عبر <source media="…">.
 */

const PEXELS = 'https://videos.pexels.com/video-files/3129752/3129752';

export const HERO_VIDEO = {
  /** ~1.1MB — الجوال */
  sd: `${PEXELS}-sd_640_360_30fps.mp4`,
  /** ~2MB — اللوحي */
  md: `${PEXELS}-sd_960_540_30fps.mp4`,
  /** ~3MB — سطح المكتب */
  hd: `${PEXELS}-hd_1280_720_30fps.mp4`,
  /** ~6.5MB — الشاشات الكبيرة */
  fhd: `${PEXELS}-hd_1920_1080_30fps.mp4`,
  poster: '/hero-poster.jpg',
  alt: 'طيران فوق بحر من الغيوم',
} as const;

/**
 * تدفئة لونية تحوّل الغيوم الزرقاء إلى ذهبية تطابق هوية TripGo.
 * تُطبَّق على الفيديو وصورة الغلاف معاً حتى لا يقفز اللون عند بدء التشغيل.
 * filter مُسرَّع على GPU فلا يكلّف شيئاً أثناء التشغيل.
 */
export const HERO_VIDEO_FILTER = 'sepia(0.42) saturate(1.35) hue-rotate(-14deg) contrast(1.04) brightness(1.02)';
