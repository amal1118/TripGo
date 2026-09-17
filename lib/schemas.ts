/**
 * lib/schemas.ts — التحقق من مخرجات النموذج بـ zod.
 * النماذج المجانية تُخطئ أحياناً في الأنواع، لذلك نستخدم coerce + defaults
 * حتى ننقذ الاستجابة بدل رفضها، ونرفض فقط عند غياب البنية الأساسية.
 */
import { z } from 'zod';

const num = z.coerce.number().default(0);
const str = z.coerce.string().default('');
const url = z.coerce.string().default('');

/**
 * النماذج تُعيد القيم المنطقية كنصوص أحياناً، و z.coerce.boolean() يستخدم
 * Boolean() فيحوّل "false" إلى true. هذا المحلّل يقرأ النص الفعلي.
 */
const bool = z.preprocess((v) => {
  if (typeof v === 'string') {
    const t = v.trim().toLowerCase();
    if (['false', 'no', '0', 'لا', ''].includes(t)) return false;
    if (['true', 'yes', '1', 'نعم'].includes(t)) return true;
  }
  if (typeof v === 'number') return v !== 0;
  return v;
}, z.boolean().catch(false));

export const flightSchema = z.object({
  id: str, airline: str, from: str, to: str,
  departTime: str, arriveTime: str,
  durationMinutes: num, stops: num,
  cabin: z.enum(['economy', 'premium', 'business']).catch('economy'),
  price: num, currency: str, priceNote: str,
  bookingUrl: url, imageQuery: str, imageUrl: url,
});

export const hotelSchema = z.object({
  id: str, name: str, area: str,
  rating: z.coerce.number().min(0).max(5).catch(4.2),
  pricePerNight: num, currency: str,
  highlights: z.array(z.coerce.string()).default([]),
  whyItFits: str, mapUrl: url, bookingUrl: url, imageQuery: str, imageUrl: url,
});

export const restaurantSchema = z.object({
  id: str, name: str,
  type: z.enum(['restaurant', 'cafe', 'street-food', 'dessert']).catch('restaurant'),
  cuisine: str, priceLevel: z.coerce.number().min(1).max(4).catch(2),
  mustTry: str, area: str,
  isHalalFriendly: bool,
  mapUrl: url, imageQuery: str, imageUrl: url,
});

export const experienceSchema = z.object({
  id: str, title: str,
  category: z.enum(['adventure', 'culture', 'nature', 'nightlife', 'wellness', 'family']).catch('culture'),
  durationHours: num, price: num, currency: str,
  description: str, bestTime: str, bookingUrl: url, imageQuery: str, imageUrl: url,
});

export const landmarkSchema = z.object({
  id: str, name: str,
  type: z.enum(['historic', 'religious', 'modern', 'viewpoint', 'museum']).catch('historic'),
  entryFee: num, currency: str, suggestedDuration: str,
  tip: str, mapUrl: url, imageQuery: str, imageUrl: url,
});

export const shoppingSchema = z.object({
  id: str, name: str,
  type: z.enum(['mall', 'souq', 'boutique-street', 'outlet']).catch('mall'),
  knownFor: str, priceLevel: z.coerce.number().min(1).max(4).catch(2),
  area: str, mapUrl: url, imageQuery: str, imageUrl: url,
});

export const dayBlockSchema = z.object({
  time: str,
  period: z.enum(['morning', 'afternoon', 'evening', 'night']).catch('morning'),
  title: str, description: str,
  refType: z.enum(['hotel', 'flight', 'restaurant', 'experience', 'landmark', 'shopping', 'free']).catch('free'),
  refId: str, estimatedCost: num, transitNote: str,
});

export const itinerarySchema = z.object({
  meta: z.object({
    title: str, destination: str, destinationEn: str, summary: str,
    durationDays: num, currency: z.coerce.string().default('SAR'),
    estimatedTotalCost: num, bestTimeNote: str,
    tags: z.array(z.coerce.string()).default([]),
  }),
  flights: z.array(flightSchema).default([]),
  hotels: z.array(hotelSchema).default([]),
  restaurants: z.array(restaurantSchema).default([]),
  experiences: z.array(experienceSchema).default([]),
  landmarks: z.array(landmarkSchema).default([]),
  shopping: z.array(shoppingSchema).default([]),
  days: z.array(z.object({
    day: num, title: str, theme: str,
    blocks: z.array(dayBlockSchema).default([]),
  })).default([]),
  budgetBreakdown: z.object({
    flights: num, stay: num, food: num,
    activities: num, shopping: num, transport: num,
  }).default({ flights: 0, stay: 0, food: 0, activities: 0, shopping: 0, transport: 0 }),
  practicalTips: z.array(z.coerce.string()).default([]),
});

export const preferencesSchema = z.object({
  destination: z.string().min(2, 'اكتب اسم الوجهة'),
  origin: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  durationDays: z.coerce.number().min(1).max(30).default(5),
  travelers: z.coerce.number().min(1).max(20).default(2),
  tripType: z.enum(['solo', 'couple', 'family', 'friends', 'business']).default('couple'),
  // 'premium' مستوى قديم أُدمج في 'luxury' — نحوّله كي لا تنكسر التفضيلات المحفوظة.
  budgetLevel: z.preprocess(
    (v) => (v === 'premium' ? 'luxury' : v),
    z.enum(['budget', 'comfort', 'luxury']),
  ).default('comfort'),
  budgetAmount: z.coerce.number().nullable().optional(),
  currency: z.string().default('SAR'),
  pace: z.enum(['relaxed', 'balanced', 'packed']).default('balanced'),
  stayStyle: z.enum(['hotel', 'apartment', 'resort', 'boutique', 'hostel']).optional(),
  interests: z.array(z.string()).default([]),
  foodPreferences: z.array(z.string()).default([]),
  accessibility: z.array(z.string()).default([]),
  notes: z.string().max(600).optional(),
});

export const chatBodySchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().min(1).max(4000),
  })).min(1).max(30),
  tripId: z.string().uuid().optional(),
});

export type ItineraryParsed = z.infer<typeof itinerarySchema>;
