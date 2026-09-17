trip-go/
├── app/
│   ├── layout.tsx                  # RTL + ThemeProvider + Toaster
│   ├── page.tsx                    # صفحة الهبوط: هيرو + استكشاف + مزايا
│   ├── globals.css                 # رموز الهوية + أصناف الزجاج
│   ├── login/page.tsx              # OAuth 2.0
│   ├── onboarding/page.tsx         # التقاط التفضيلات الافتراضية
│   ├── dashboard/page.tsx          # الرحلات المحفوظة + مدخل المساعد
│   ├── plan/new/page.tsx           # معالج بناء الخطة
│   ├── chat/page.tsx               # المساعد الذكي
│   ├── destinations/page.tsx       # كل الوجهات المقترحة (٢٠) + تصفية وبحث وترتيب
│   ├── destinations/[slug]/page.tsx# صفحة الوجهة الواحدة (SSG لكل وجهة)
│   ├── trips/[id]/page.tsx         # شاشة تفاصيل الرحلة (+ صورة OG للمشاركة)
│   ├── trips/[id]/loading.tsx      # هيكل انتظار أثناء جلب الخطة
│   ├── trips/preview/page.tsx      # معاينة خطة تعذّر حفظها (شبكة أمان) + حفظ يدوي
│   ├── not-found.tsx               # 404 بالعربية
│   ├── error.tsx                   # حدّ الأخطاء العام
│   ├── auth/callback/route.ts      # تبديل كود OAuth بجلسة
│   └── api/
│       ├── plan/route.ts           # POST: تفضيلات → LLM → JSON → Supabase
│       ├── chat/route.ts           # POST: محادثة متدفقة (Edge)
│       └── trips/
│           ├── route.ts            # GET: قائمة الرحلات | POST: حفظ خطة معاينة
│           └── [id]/route.ts       # DELETE: حذف رحلة
│
├── components/
│   ├── shell/
│   │   ├── BottomNav.tsx           # شريط التنقل السفلي العائم (يحل محل العلوي والتذييل)
│   │   ├── AppScreen.tsx           # غلاف Mobile-First لصفحات التطبيق
│   │   └── ScreenHeader.tsx        # ترويسة داخل الصفحة (صورة + تحية + إشعارات)
│   ├── landing/
│   │   ├── HeroSection.tsx         # هيرو بخلفية فيديو + كاروسيل قابل للسحب (بطاقاته روابط)
│   │   ├── ExploreSection.tsx      # بحث ذكي + فئات تُصفّي فعلياً + ٤ وجهات مقترحة + بطاقة تفصيلية
│   │   ├── LandingNav.tsx          # شريط علوي + قائمة جوال بملء الشاشة
│   │   └── FeatureShowcase.tsx     # الفئات + كيف يعمل + التذييل (Server)
│   ├── destinations/
│   │   ├── DestinationCard.tsx     # البطاقة الموحّدة (الهبوط + صفحة الوجهات)
│   │   └── DestinationsExplorer.tsx# تصفية وبحث وترتيب على العميل
│   ├── glass/
│   │   ├── GlassCard.tsx           # الحاوية الزجاجية (motion + tilt)
│   │   ├── CardImage.tsx           # صورة + تدرّج + مصدر احتياطي
│   │   └── CardActions.tsx         # أزرار CTA خارجية
│   ├── itinerary/
│   │   ├── ItineraryView.tsx       # JSON → تبويبات وبطاقات
│   │   ├── DaysTimeline.tsx        # خط سير الأيام (شريط لاصق + مراقب ظهور)
│   │   ├── ItinerarySkeleton.tsx   # هيكل الانتظار (مشترك مع المعاينة)
│   │   └── cards.tsx               # 6 بطاقات متخصصة + TimelineBlock
│   ├── plan/
│   │   ├── PlanBuilder.tsx         # معالج 3 خطوات (useReducer)
│   │   ├── OnboardingFlow.tsx      # نموذج التفضيلات الأولي
│   │   ├── OptionGroup.tsx         # مجموعة خيارات زجاجية
│   │   └── options.ts              # تصنيف الخيارات (مصدر واحد)
│   ├── chat/ChatPanel.tsx          # بث + تجميع rAF
│   ├── shared/                     # UserMenu, LoginCard, ThemeProvider/Toggle
│   └── ui/                         # shadcn: button, card, badge, input…
│
├── lib/
│   ├── prompts.ts                  # ★ مكتبة أنماط التوجيه
│   ├── openrouter.ts               # عميل LLM + extractJson
│   ├── schemas.ts                  # تحقق zod من مخرجات النموذج
│   ├── images.ts                   # مصادر صور البطاقات + روابط الخرائط
│   ├── unsplash.ts                 # بحث imageQuery → صورة المكان (اختياري بمفتاح)
│   ├── media.ts                    # فيديو الهيرو بثلاث دقات + صورة الغلاف
│   ├── hooks/useDragScroll.ts      # سحب أفقي بزخم + اتجاه RTL صحيح
│   ├── hooks/usePointerTilt.ts     # ميلان ووهج يتبعان المؤشر
│   ├── destinations.ts             # ★ كتالوج ٢٠ وجهة: مصدر واحد للهيرو والاكتشاف
│   │                               #   وصفحة الوجهات وصفحة الوجهة (صور متحقَّق منها)
│   ├── utils.ts                    # cn + تنسيق عربي للأسعار والتواريخ
│   └── supabase/{client,server,middleware}.ts
│
├── public/hero-poster.jpg          # غلاف الفيديو (يظهر فوراً)
├── types/trip.ts
├── supabase/schema.sql             # الجداول + RLS + triggers
└── middleware.ts                   # تحديث الجلسة + حماية المسارات
