## 👥 Project Information
# 👥 Group
# Group 5

## 👩‍💻 Team Members
1. Shahad Khalid
2. Amal Al-Zahrani
3. Bashayer Al-Sheibani
4. Asayil Al-qahtani
5. Abdulaziz Al-Shahrani
6. Raghad Al-Otaibi
7. Raghad Al-Anazi
   
## 🎓 Training Program
Vibe Coding Training Program

#  Organization
SDAIA Academy

# 🔗 GitHub
SDAIA Academy on GitHub
https://github.com/SDAIAAcademy


# TripGo — مخطط رحلات ذكي

تطبيق Next.js موحّد (واجهة + API في مشروع واحد) لتخطيط الرحلات عبر نماذج LLM مجانية.

## التشغيل

```bash
npm install
cp .env.example .env.local   # ثم املأ القيم
npm run dev
```

## 1) إعداد Supabase

1. أنشئ مشروعاً على [supabase.com](https://supabase.com).
2. **SQL Editor** ← الصق محتوى `supabase/schema.sql` ونفّذه.
   ينشئ الجداول (`profiles`, `trips`, `conversations`, `messages`)، يفعّل RLS،
   ويضيف trigger ينشئ ملفاً شخصياً تلقائياً عند أول تسجيل دخول.
3. **Authentication → Providers** ← فعّل Google و/أو GitHub وأدخل
   `Client ID` و`Client Secret` من لوحة المزوّد.
4. **Authentication → URL Configuration** — أهم خطوة، وسببُ أغلب أعطال الدخول:
   - **Site URL**: رابط الإنتاج (`https://<نطاقك>`)، لا `localhost`.
     هذا هو المكان الذي يرمي إليه Supabase المستخدمَ عند أي خطأ أو عند
     `redirect_to` غير مُدرج — واتركه `localhost` يعني صفحة ميتة على الجوال.
   - **Redirect URLs** (أضف كل سطر):
     ```
     https://<نطاقك>/auth/callback
     http://localhost:3000/auth/callback
     ```
   - في **Google Cloud Console** → OAuth client → Authorized redirect URIs
     يجب أن يوجد `https://<project-ref>.supabase.co/auth/v1/callback`
     (نطاق Supabase نفسه، لا نطاق التطبيق).
5. انسخ `Project URL` و`anon public key` إلى `.env.local`.
6. اضبط `NEXT_PUBLIC_SITE_URL` على رابط الإنتاج في متغيّرات بيئة Vercel.

> **لماذا `NEXT_PUBLIC_SITE_URL` ضروري؟** `lib/site-url.ts` يبني منه وجهة
> `redirect_to`. لو اعتمدنا على `window.location.origin` لتغيّرت الوجهة مع كل
> نطاق معاينة من Vercel (ومع كل إعادة ربط للمشروع)، ولوجب إدراج كل نطاق جديد
> في Supabase يدوياً — وأي نطاق غير مُدرج يُسقط المستخدم على Site URL بخطأ
> `Unable to exchange external code`. محلياً وعلى شبكة الـ LAN يبقى العنوان
> الحالي مُستخدَماً حتى لا ينكسر اختبار الجوال على خادم التطوير.

**مسار المصادقة:** `LoginCard` → `signInWithOAuth` → مزوّد OAuth →
`/auth/callback` → `exchangeCodeForSession` → `/onboarding` أو `/dashboard`.
الجلسة تُحدَّث على كل طلب في `middleware.ts` عبر `lib/supabase/middleware.ts`.
أخطاء المصادقة التي يُسقطها Supabase على أي صفحة يلتقطها `AuthErrorRelay`
ويحوّلها إلى رسالة مقروءة على `/login`.

## 2) إعداد OpenRouter

1. أنشئ مفتاحاً من [openrouter.ai/keys](https://openrouter.ai/keys).
2. ضعه في `OPENROUTER_API_KEY` (خادم فقط — بلا `NEXT_PUBLIC_`).
3. النماذج المجانية معرّفة في `lib/openrouter.ts` ضمن `FREE_MODELS`،
   مع تجربة تلقائية للنموذج التالي عند 429/402/503.

## 3) بنية الذكاء الاصطناعي

| الملف | الدور |
|---|---|
| `lib/prompts.ts` | مكتبة أنماط التوجيه — لكل مهمة نمط منفصل |
| `lib/schemas.ts` | تحقق zod من مخرجات النموذج قبل العرض أو الحفظ |
| `lib/openrouter.ts` | العميل: `complete`، `streamComplete`، `extractJson` |
| `app/api/plan/route.ts` | المخطط: تفضيلات → JSON → تحقق → حفظ |
| `app/api/chat/route.ts` | المحادثة الحرة المتدفقة (Edge) |

عند تعديل `ITINERARY_JSON_SCHEMA` في `prompts.ts`، عدّل `itinerarySchema`
في `schemas.ts` و`types/trip.ts` معاً — الثلاثة يجب أن تبقى متطابقة.

## 4) الهوية البصرية

- الوضع الفاتح: أبيض سكري `hsl(30 45% 98%)` + برتقالي ناعم مطفي `hsl(24 70% 62%)`.
- الوضع الداكن: أسود `hsl(24 8% 5%)` + نفس البرتقالي.
- الزجاج: الأصناف `.glass` / `.glass-strong` / `.glass-subtle` في `app/globals.css`.

## 5) الخطوط ونظام الأحجام

ثلاثة خطوط تُحمَّل عبر `next/font/google` في `app/layout.tsx`:

| الخط | الاستخدام | متغيّر CSS |
|---|---|---|
| Alexandria | كل النص العربي — واجهة وعناوين | `--font-ar` |
| Plus Jakarta Sans | الأرقام والنصوص اللاتينية (`.num`) | `--font-latin` |
| Playfair Display | العناوين اللاتينية الكبيرة فقط (`.font-display`) | `--font-serif` |

الأحجام موحّدة عبر سلّم نصي في `app/globals.css`:
`.t-display` · `.t-h1` · `.t-h2` · `.t-h3` · `.t-body` · `.t-sm` · `.t-eyebrow`.
استخدم هذه الأصناف بدل كتابة `text-3xl` أو `clamp()` يدوياً — هكذا تبقى
النِسَب متناسقة بين الصفحات.

## 6) تجربة الجوال أولاً (Mobile-First)

لا يوجد شريط علوي ولا تذييل. التنقل عبر `components/shell/BottomNav.tsx` —
كبسولة عائمة أسفل الشاشة، العنصر النشط دائرة برتقالية، وتظهر التسمية النصية
من مقاس `sm` فأعلى. يُخفي نفسه في `/login` و`/onboarding`.

صفحات التطبيق تُغلَّف بـ `AppScreen` الذي يحدّ العرض بـ 680px في المنتصف
على الشاشات الكبيرة، ويترك حشواً سفلياً للشريط العائم، ويحترم `safe-area`.

شاشة تفاصيل الرحلة (`ItineraryView`) تتبع نمط الجوال: صورة بملء العرض مع
أزرار عائمة، ثم ورقة بيضاء منزلقة بحواف مستديرة، وزر إجراء ثابت أسفل الشاشة.

### ملاحظة تقنية مهمة
عناصر شبكة CSS لها `min-width: auto` افتراضياً، فيتمدد المسار ليسع أوسع
محتوى فيه. صف البطاقات الأفقي (1340px) كان يكسر تخطيط الجوال حتى أُضيف
`min-w-0` على أعمدة الشبكة. احتفظ به عند إضافة أي حاوية تمرير أفقي داخل شبكة.

## 7) فيديو الهيرو وكاروسيل المروحة

`lib/media.ts` يضم أربع دقات من Pexels (طيران فوق بحر من الغيوم، ترخيص مجاني):
1.1MB للجوال · 2MB للّوحي · 3MB لسطح المكتب · 6.5MB للشاشات الكبيرة، يختارها
المتصفح عبر `<source media="…">`.

المشهد أزرق بارد في أصله، ويُدفَّأ إلى ذهبي عبر `HERO_VIDEO_FILTER` (فلتر CSS
مُسرَّع على GPU) بدل تعديل الملف — فيبقى المصدر أصلياً وقابلاً للاستبدال بسطر
واحد. الفلتر نفسه يُطبَّق على `public/hero-poster.jpg` حتى لا يقفز اللون لحظة
بدء التشغيل. الفيديو يتوقف خارج الشاشة عبر IntersectionObserver ولا يُحمَّل
إطلاقاً عند تفضيل تقليل الحركة.

**البطاقات** مروحة ثلاثية الأبعاد عبر `lib/hooks/useCoverflow.ts` فوق حاوية
تمرير أصلية، فيبقى اللمس وscroll-snap ولوحة المفاتيح تعمل كما هي.

### ثلاثة مزالق مثبّتة في الكود
1. **التحويل يُطبَّق على الابن الأول لا على عنصر الالتقاط.** scroll-snap يحسب
   مواضع الالتقاط من الصندوق بعد التحويل، فلو حرّكنا عنصر الالتقاط لانزاحت
   النقاط ولما عاد سهم "السابق" إلى الموضع نفسه.
2. **تصفير `raf.current` في دالة التنظيف.** StrictMode يُركّب التأثير مرتين
   في التطوير؛ لو بقي المرجع غير صفري بعد `cancelAnimationFrame` لحُجبت
   الجدولة التالية للأبد ولما رُسمت المروحة إطلاقاً.
3. **توسيط البطاقة المميّزة يُعاد مرتين.** إطار واحد قد يسبق استقرار التخطيط
   (الخطوط والصور) فيعيد المتصفح التمرير للصفر؛ والمحاولات تتوقف فور أن
   يمرّر المستخدم بنفسه حتى لا نخطف تمريره.

### إن بدت الأنماط مفقودة فجأة أثناء التطوير
خادم التطوير قد يُنتج CSS مبتوراً (7KB بدل 100KB) بعد تعديلات متزامنة كثيرة.
العلاج: إيقاف الخادم، `rm -rf .next`، ثم `npm run dev`.

## 8) صور الواجهة

`lib/destinations.ts` يضم وجهات صفحة الهبوط، وكل معرّف صورة فيه تم التحقق
من توفّره على Unsplash CDN. الدالة `unsplash(id, w, h, q)` توحّد الاقتصاص
والجودة. لإضافة وجهة جديدة: أضف عنصراً إلى `HERO_DESTINATIONS` أو `TRENDING`.
