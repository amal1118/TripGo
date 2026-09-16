/**
 * POST /api/plan
 * التفضيلات ← OpenRouter ← JSON مُتحقَّق منه ← (اختياري) حفظ في Supabase.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { complete, extractJson, FREE_MODELS, OpenRouterError } from '@/lib/openrouter';
import { tripPlannerSystemPrompt, tripPlannerUserPrompt } from '@/lib/prompts';
import { itinerarySchema, preferencesSchema } from '@/lib/schemas';
import { getCoverImage } from '@/lib/images';

export const runtime = 'nodejs';
export const maxDuration = 120; // توليد الخطة قد يستغرق وقتاً على النماذج المجانية

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'يلزم تسجيل الدخول' }, { status: 401 });
  }

  // 1) التحقق من المدخلات
  const body = await request.json().catch(() => null);
  const parsedPrefs = preferencesSchema.safeParse(body?.preferences);
  if (!parsedPrefs.success) {
    return NextResponse.json(
      { error: 'تفضيلات غير صالحة', issues: parsedPrefs.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  const preferences = parsedPrefs.data;
  const shouldSave = body?.save !== false;

  // 2) حد معدل بسيط: 10 خطط في الساعة لكل مستخدم
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from('trips')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', since);

  if ((count ?? 0) >= 10) {
    return NextResponse.json(
      { error: 'تجاوزت الحد المسموح (10 خطط في الساعة). جرّب بعد قليل.' },
      { status: 429 },
    );
  }

  // 3) استدعاء النموذج
  try {
    const { content, model } = await complete({
      models: FREE_MODELS.planner,
      json: true,
      temperature: 0.65,
      maxTokens: 8000,
      // مقيسة: النموذج الناجح يستغرق ~70 ثانية لخطة من 8000 توكن، والفشل
      // السريع (429/502) يكلّف ثانية واحدة — فمهلة 85s تحمي من نموذج معلّق
      // دون أن تقطع نموذجاً يعمل، ويبقى متسع لمحاولة تالية داخل سقف 110s.
      perAttemptTimeoutMs: 85_000,
      messages: [
        { role: 'system', content: tripPlannerSystemPrompt() },
        { role: 'user', content: tripPlannerUserPrompt(preferences) },
      ],
      signal: AbortSignal.timeout(110_000),
    });

    // 4) تنظيف + تحقق
    const raw = extractJson(content);
    const result = itinerarySchema.safeParse(raw);
    if (!result.success) {
      console.error('[plan] schema mismatch', model, result.error.issues.slice(0, 5));
      return NextResponse.json(
        { error: 'أعاد النموذج بياناتٍ غير مكتملة. أعد المحاولة.' },
        { status: 502 },
      );
    }
    const itinerary = result.data;

    // 5) الحفظ
    let tripId: string | null = null;
    if (shouldSave) {
      const { data, error } = await supabase
        .from('trips')
        .insert({
          user_id: user.id,
          title: itinerary.meta.title || `رحلة إلى ${preferences.destination}`,
          destination: itinerary.meta.destination || preferences.destination,
          start_date: preferences.startDate || null,
          end_date: preferences.endDate || null,
          cover_image: getCoverImage(itinerary.meta.destinationEn || preferences.destination),
          preferences,
          itinerary,
          status: 'planned',
          model_used: model,
        })
        .select('id')
        .single();

      if (error) console.error('[plan] insert failed', error.message);
      else tripId = data.id;
    }

    return NextResponse.json({ tripId, itinerary, model });
  } catch (err) {
    const upstream = err instanceof OpenRouterError ? err.status : 500;
    console.error('[plan] failed', err);

    const busy = upstream === 429;
    const badKey = upstream === 401 || upstream === 403;
    // لا نُمرّر رمز المزوّد كما هو (404/400 من نموذج مسحوب تُربك الواجهة):
    // فشل المزوّد هو 502 من منظور عميلنا.
    const status = busy ? 429 : badKey ? 500 : 502;

    return NextResponse.json(
      {
        error: busy
          ? 'النماذج المجانية مزدحمة حالياً، أعد المحاولة بعد دقيقة.'
          : badKey
            ? 'مفتاح OpenRouter غير صالح أو منتهي الصلاحية.'
            : 'تعذّر توليد الخطة.',
        // التفصيل في بيئة التطوير فقط — يختصر تشخيص أعطال المزوّد
        ...(process.env.NODE_ENV !== 'production' && err instanceof Error
          ? { detail: err.message.slice(0, 300) }
          : {}),
      },
      { status },
    );
  }
}
