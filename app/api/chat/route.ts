/**
 * POST /api/chat — محادثة حرة متدفقة (Edge) مع المساعد الذكي.
 */
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { streamComplete, FREE_MODELS, OpenRouterError, paidModelsFor } from '@/lib/openrouter';
import { assistantSystemPrompt } from '@/lib/prompts';
import { chatBodySchema } from '@/lib/schemas';

export const runtime = 'edge';

export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (n: string) => cookieStore.get(n)?.value, set: (_n: string, _v: string, _o: CookieOptions) => {}, remove: () => {} } },
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('يلزم تسجيل الدخول', { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = chatBodySchema.safeParse(body);
  if (!parsed.success) return new Response('طلب غير صالح', { status: 400 });

  // سياق المستخدم من ملفه الشخصي — يجعل الردود مخصّصة دون أن يكتبها كل مرة
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, preferences')
    .eq('id', user.id)
    .maybeSingle();

  const system = assistantSystemPrompt({
    userName: profile?.full_name ?? user.user_metadata?.full_name ?? null,
    prefs: profile?.preferences ?? null,
  });

  try {
    const stream = await streamComplete({
      models: FREE_MODELS.chat,
      // شبكة أمان مدفوعة — لا تُستدعى إلا بعد فشل كل النماذج المجانية.
      paidFallback: paidModelsFor('chat'),
      temperature: 0.8,
      maxTokens: 1500,
      messages: [{ role: 'system', content: system }, ...parsed.data.messages],
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err) {
    const status = err instanceof OpenRouterError ? err.status : 500;
    console.error('[chat] failed', err);
    // مفتاح مفقود: قُل ذلك بدل «حاول لاحقاً» التي تُخفي عطل إعداد دائم.
    if (err instanceof OpenRouterError && err.configError) {
      return new Response('المساعد غير مُهيّأ على الخادم (مفتاح OpenRouter مفقود).', { status: 500 });
    }
    return new Response('تعذّر الاتصال بالمساعد حالياً.', { status });
  }
}
