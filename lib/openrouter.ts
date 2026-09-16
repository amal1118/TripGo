/**
 * lib/openrouter.ts — عميل OpenRouter (خادم فقط).
 * يُستدعى حصراً من Route Handlers؛ مفتاح API لا يغادر الخادم أبداً.
 */
import 'server-only';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * نماذج مجانية مرتبة حسب الأفضلية — نجرّب التالي عند الفشل أو الحد.
 *
 * ⚠️ كتالوج OpenRouter المجاني يتغيّر باستمرار: أي slug ينتهي بـ ":free" قد
 * يُسحب فجأة ويردّ 404. لذلك (1) هذه القائمة مجرد بداية، (2) الدالة
 * complete/streamComplete تتجاوز 404 وتنتقل للتالي، و(3) عند فشل الجميع
 * نكتشف المتاح فعلياً من /api/v1/models تلقائياً (discoverFreeModels).
 */
export const FREE_MODELS = {
  // ملاحظة مقيسة: نماذج "التفكير" (nex-agi وشبيهاتها) تستهلك ميزانية التوكنز
  // كاملة في التفكير وتردّ finish_reason=length بمحتوى فارغ — غير صالحة
  // لمهمة JSON طويلة، لذا لا تتصدّر القائمة.
  planner: [
    process.env.OPENROUTER_MODEL_PLANNER || 'dots-studio/dots-3-note-preview:free',
    'nvidia/nemotron-3-super-120b-a12b:free',
    'google/gemma-4-31b-it:free',
    'google/gemma-4-26b-a4b-it:free',
  ],
  chat: [
    // مقيسة: nemotron يعطي عربية نظيفة (~15s)، بينما dots-3 يخلط لاتينية
    // داخل الجملة العربية فلا يتصدّر واجهة عربية.
    process.env.OPENROUTER_MODEL_CHAT || 'nvidia/nemotron-3-super-120b-a12b:free',
    'google/gemma-4-31b-it:free',
    'google/gemma-4-26b-a4b-it:free',
    'dots-studio/dots-3-note-preview:free',
  ],
} as const;

export interface LLMMessage { role: 'system' | 'user' | 'assistant'; content: string }

interface CompletionOptions {
  messages: LLMMessage[];
  models?: readonly string[];
  temperature?: number;
  maxTokens?: number;
  /** يفعّل response_format=json_object + تنظيف صارم للمخرجات. */
  json?: boolean;
  /** مهلة قصوى لكل نموذج على حدة — تمنع نموذجاً بطيئاً من ابتلاع الميزانية كلها. */
  perAttemptTimeoutMs?: number;
  signal?: AbortSignal;
}

export class OpenRouterError extends Error {
  constructor(message: string, readonly status: number = 502, readonly model?: string) {
    super(message);
    this.name = 'OpenRouterError';
  }
}

function headers() {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new OpenRouterError('OPENROUTER_API_KEY غير معرّف في متغيرات البيئة', 500);
  return {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    // مطلوبان من OpenRouter لظهور التطبيق في لوحة الاستخدام ولرفع حدود المعدل
    'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    'X-Title': 'TripGo',
  };
}

/** رموز HTTP تعني «جرّب النموذج التالي» بدل إيقاف السلسلة.
 *  404 مُدرج لأن OpenRouter يسحب النماذج المجانية دورياً ويردّ
 *  "This model is unavailable for free" — وهذا خطأ في السلاسل لا في المفتاح.
 *  400 مُدرج لأن كثيراً من النماذج لا تدعم response_format وترد 400.
 *  401/403 وحدهما يعنيان مشكلة مفتاح فلا فائدة من المتابعة. */
const RETRYABLE_STATUS = new Set([400, 402, 404, 408, 409, 429, 500, 502, 503, 504]);

const MODELS_URL = 'https://openrouter.ai/api/v1/models';
const DISCOVERY_TTL_MS = 30 * 60 * 1000;

let discoveryCache: { at: number; json: string[]; any: string[] } | null = null;

/**
 * يكتشف النماذج المجانية المتاحة فعلياً الآن من كتالوج OpenRouter.
 * شبكة أمان: تُستخدم فقط عندما تفشل كل النماذج المُعرَّفة يدوياً، فلا
 * تتعطّل الخدمة عند سحب slug من الكتالوج.
 */
export async function discoverFreeModels(needsJson = false): Promise<string[]> {
  if (discoveryCache && Date.now() - discoveryCache.at < DISCOVERY_TTL_MS) {
    return needsJson ? discoveryCache.json : discoveryCache.any;
  }
  try {
    const res = await fetch(MODELS_URL, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return [];
    const data = await res.json();
    const free = (data?.data ?? []).filter(
      (m: { id?: string }) => typeof m?.id === 'string' && m.id.endsWith(':free'),
    );
    const byContext = (a: { context_length?: number }, b: { context_length?: number }) =>
      (b.context_length ?? 0) - (a.context_length ?? 0);

    const any: string[] = [...free].sort(byContext).map((m: { id: string }) => m.id);
    const json: string[] = [...free]
      .filter((m: { supported_parameters?: string[] }) =>
        (m.supported_parameters ?? []).includes('response_format'))
      .sort(byContext)
      .map((m: { id: string }) => m.id);

    discoveryCache = { at: Date.now(), json, any };
    return needsJson ? json : any;
  } catch {
    return [];
  }
}

/** يدمج مهلة المحاولة مع إشارة المستدعي (مع بديل للبيئات بلا AbortSignal.any). */
function attemptSignal(outer: AbortSignal | undefined, ms: number): AbortSignal {
  const timeout = AbortSignal.timeout(ms);
  if (!outer) return timeout;
  const anyOf = (AbortSignal as unknown as { any?: (s: AbortSignal[]) => AbortSignal }).any;
  if (typeof anyOf === 'function') return anyOf([outer, timeout]);

  const ctrl = new AbortController();
  const abort = () => ctrl.abort();
  if (outer.aborted || timeout.aborted) abort();
  outer.addEventListener('abort', abort, { once: true });
  timeout.addEventListener('abort', abort, { once: true });
  return ctrl.signal;
}

/** استدعاء غير متدفق مع تجربة تلقائية للنماذج البديلة. */
export async function complete({
  messages,
  models = FREE_MODELS.chat,
  temperature = 0.7,
  maxTokens = 4096,
  json = false,
  perAttemptTimeoutMs = 60_000,
  signal,
}: CompletionOptions): Promise<{ content: string; model: string }> {
  let lastError: unknown;
  const tried = new Set<string>();

  const attempt = async (model: string): Promise<{ content: string; model: string } | null> => {
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: headers(),
      signal: attemptSignal(signal, perAttemptTimeoutMs),
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        ...(json ? { response_format: { type: 'json_object' } } : {}),
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      if (RETRYABLE_STATUS.has(res.status)) {
        lastError = new OpenRouterError(`فشل ${model}: ${res.status} ${detail.slice(0, 200)}`, res.status, model);
        console.warn('[openrouter] skip', model, res.status, detail.slice(0, 160));
        return null;
      }
      throw new OpenRouterError(`خطأ من OpenRouter (${res.status}): ${detail.slice(0, 300)}`, res.status, model);
    }

    const data = await res.json();
    // بعض الأخطاء تصل بحالة 200 وجسم يحمل error — نعاملها كفشل قابل للتجاوز
    if (data?.error) {
      lastError = new OpenRouterError(`فشل ${model}: ${String(data.error?.message ?? data.error).slice(0, 200)}`, 502, model);
      return null;
    }

    const choice = data?.choices?.[0];
    const content: string = choice?.message?.content ?? '';
    if (!content.trim()) {
      // finish_reason=length بمحتوى فارغ = نموذج تفكير التهم ميزانية التوكنز
      const why = choice?.finish_reason ?? choice?.native_finish_reason ?? 'unknown';
      lastError = new OpenRouterError(`رد فارغ من ${model} (finish_reason=${why})`, 502, model);
      console.warn('[openrouter] empty', model, 'finish_reason=', why);
      return null;
    }
    return { content, model };
  };

  const run = async (candidates: readonly string[]) => {
    for (const model of candidates) {
      if (!model || tried.has(model)) continue;
      tried.add(model);
      try {
        const ok = await attempt(model);
        if (ok) return ok;
      } catch (err) {
        // إجهاض المستدعي (انتهاء مهلة الطلب كله) نهائي؛ أما انتهاء مهلة
        // المحاولة الواحدة فيعني ببساطة: جرّب النموذج التالي.
        if (signal?.aborted) throw err;
        if (err instanceof OpenRouterError && (err.status === 401 || err.status === 403)) throw err;
        if (err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
          console.warn('[openrouter] timeout', model, `${perAttemptTimeoutMs}ms`);
        }
        lastError = err;
      }
    }
    return null;
  };

  const direct = await run(models);
  if (direct) return direct;

  // شبكة أمان: كل النماذج المُعرَّفة فشلت (غالباً سُحبت من الكتالوج) —
  // نجرّب ما هو متاح مجاناً الآن فعلياً.
  const discovered = await discoverFreeModels(json);
  if (discovered.length) {
    console.warn('[openrouter] falling back to discovered free models', discovered.slice(0, 4));
    const rescue = await run(discovered.slice(0, 4));
    if (rescue) return rescue;
  }

  throw lastError instanceof Error
    ? lastError
    : new OpenRouterError('تعذّر الوصول إلى أي نموذج متاح حالياً');
}

/** استدعاء متدفق (SSE) — يُعاد كـ ReadableStream نصي للواجهة. */
export async function streamComplete({
  messages,
  models = FREE_MODELS.chat,
  temperature = 0.7,
  maxTokens = 2048,
  signal,
}: CompletionOptions): Promise<ReadableStream<Uint8Array>> {
  const open = async (model: string) => {
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: headers(),
      signal,
      body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens, stream: true }),
    });
    if (res.ok && res.body) return res;
    const detail = await res.text().catch(() => '');
    if (RETRYABLE_STATUS.has(res.status)) {
      console.warn('[openrouter] stream skip', model, res.status, detail.slice(0, 160));
      return null;
    }
    throw new OpenRouterError(`فشل البث (${res.status}): ${detail.slice(0, 200)}`, res.status, model);
  };

  let res: Response | null = null;
  const tried = new Set<string>();

  for (const model of models) {
    if (!model || tried.has(model)) continue;
    tried.add(model);
    res = await open(model);
    if (res) break;
  }

  if (!res) {
    for (const model of (await discoverFreeModels(false)).slice(0, 3)) {
      if (tried.has(model)) continue;
      tried.add(model);
      res = await open(model);
      if (res) break;
    }
  }

  if (!res || !res.body) {
    throw new OpenRouterError('تعذّر الوصول إلى أي نموذج متاح للبث حالياً', 502);
  }

  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';

  return res.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === '[DONE]') return;
          try {
            const delta = JSON.parse(payload)?.choices?.[0]?.delta?.content;
            if (delta) controller.enqueue(encoder.encode(delta));
          } catch {
            /* أجزاء SSE غير مكتملة — تُتجاهل بأمان */
          }
        }
      },
    }),
  );
}

/**
 * استخراج كائن JSON من رد النموذج.
 * النماذج المجانية تتجاهل أحياناً تعليمة "JSON فقط"، لذلك نُنظّف:
 * أسوار الشيفرة، النص التمهيدي، والفواصل الزائدة.
 */
export function extractJson<T = unknown>(raw: string): T {
  let text = raw.trim();

  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();

  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new OpenRouterError('لم يُرجع النموذج JSON صالحاً', 502);
  }
  text = text.slice(start, end + 1);

  try {
    return JSON.parse(text) as T;
  } catch {
    // محاولة إنقاذ أخيرة: حذف الفواصل الزائدة قبل } أو ]
    const repaired = text.replace(/,(\s*[}\]])/g, '$1');
    try {
      return JSON.parse(repaired) as T;
    } catch {
      throw new OpenRouterError('تعذّر تحليل JSON القادم من النموذج', 502);
    }
  }
}
