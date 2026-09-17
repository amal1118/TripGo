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
  /**
   * ترتيب مقيس (سبتمبر 2026): nex-n2.5-mini وحده يُنهي خطة كاملة بثبات
   * (finish_reason=stop خلال ثوانٍ)، لكنه يردّ أحياناً محتوى فارغاً بلا
   * سبب — وهو عطل عابر. لذلك يتكرّر مرّتين قبل الهبوط إلى غيره:
   * إعادة المحاولة عليه أنجح من نموذج أضعف.
   */
  planner: [
    process.env.OPENROUTER_MODEL_PLANNER || 'nex-agi/nex-n2.5-mini:free',
    process.env.OPENROUTER_MODEL_PLANNER || 'nex-agi/nex-n2.5-mini:free',
    process.env.OPENROUTER_MODEL_PLANNER || 'nex-agi/nex-n2.5-mini:free',
    'dots-studio/dots-3-note-preview:free',
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

/**
 * شبكة الأمان المدفوعة — تُستدعى فقط بعد فشل كل النماذج المجانية.
 *
 * لماذا وُجدت: النماذج المجانية تفشل عشوائياً (رد فارغ، JSON مبتور، تعليق
 * عند المزوّد) وتخضع لحصة يومية. بلا بديل مدفوع كان المستخدم يرى
 * «النماذج المجانية غير مستقرة — أعد المحاولة» بلا مخرج. ولأن الاستدعاء
 * لا يحدث إلا عند الفشل، التكلفة الفعلية تبقى قريبة من الصفر.
 *
 * ⚠️ الاختيار مقيس (سبتمبر 2026) لا مأخوذ من جدول الأسعار: الأرخص على
 * الورق (qwen3.7-flash، deepseek-v4-flash، ling-3.0-flash، mistral-nemo)
 * يعلّق حتى انتهاء المهلة على توجيه الخطة الطويل، فلا يصلح شبكةَ أمان مهما
 * رخص. gemini-2.5-flash-lite أنهى 5/5 محاولات في أقل من 1.2s بـ JSON يجتاز
 * المخطط، بتكلفة ~0.0022$ للخطة الواحدة.
 */
export const PAID_MODELS = {
  /**
   * مكرّر عمداً — لنفس سبب تكرار النموذج المجاني: الفشل المتبقي عابر
   * (خطة لا تحقّق الحد الأدنى مرة كل ~8 محاولات)، وإعادة المحاولة على
   * النموذج نفسه ترفع النجاح إلى 8/8 بتكلفة ~0.002$ تُدفع عند الفشل فقط.
   */
  planner: [
    process.env.OPENROUTER_MODEL_PLANNER_PAID || 'google/gemini-2.5-flash-lite',
    process.env.OPENROUTER_MODEL_PLANNER_PAID || 'google/gemini-2.5-flash-lite',
  ],
  chat: [
    process.env.OPENROUTER_MODEL_CHAT_PAID || 'google/gemini-2.5-flash-lite',
  ],
} as const;

/**
 * البديل المدفوع مُفعّل افتراضياً ويُوقَف بـ OPENROUTER_PAID_FALLBACK=off.
 * الإيقاف مفيد في بيئة بلا رصيد: بدونه تُستهلك محاولة إضافية ترد 402.
 */
export function paidFallbackEnabled(): boolean {
  return process.env.OPENROUTER_PAID_FALLBACK?.trim().toLowerCase() !== 'off';
}

/** قائمة البدائل المدفوعة الفعلية لمهمة ما (فارغة عند الإيقاف). */
export function paidModelsFor(task: keyof typeof PAID_MODELS): readonly string[] {
  return paidFallbackEnabled() ? PAID_MODELS[task].filter(Boolean) : [];
}

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
  /**
   * مهلة خاصة بالمحاولة المدفوعة.
   *
   * لا ترث مهلة النماذج المجانية عمداً: تلك مضبوطة على ~15s لأن المجاني إما
   * يردّ خلال ثوانٍ أو لا يعود أبداً، فقطعُه سريعاً يوفّر محاولة أخرى. أما
   * المدفوع فهو المحاولة الأخيرة — لا شيء بعده — وقياسه يتراوح بين ثانية
   * و~15s، فقطعُه عند 15s يُسقط الإنقاذ في اللحظة التي كاد ينجح فيها.
   */
  paidTimeoutMs?: number;
  /**
   * سقف عدد الطلبات المرسلة فعلاً إلى OpenRouter.
   *
   * مهم على الحساب المجاني: الحدّ 50 طلباً للنماذج المجانية يومياً لكل
   * الحساب. بلا سقف، محاولةُ خطةٍ واحدة تفشل قد تستهلك 8 طلبات (4 نماذج
   * معرّفة + 4 مكتشفة) فتلتهم حصة اليوم في ست محاولات.
   */
  maxAttempts?: number;
  /** تعطيل شبكة أمان الاكتشاف — تُضاعف استهلاك الحصة اليومية. */
  discover?: boolean;
  /**
   * نماذج مدفوعة تُجرَّب بعد فشل كل ما في `models`.
   *
   * لا تخضع لـ `maxAttempts` (وهو سقف موضوع لحماية الحصة اليومية المجانية،
   * ولا معنى له لطلب مدفوع)، ولا للحصة اليومية أصلاً — لذلك تُجرَّب أيضاً
   * عند نفاد الحصة، وهي الحالة الوحيدة التي كان المستخدم يعلق فيها بلا مخرج.
   */
  paidFallback?: readonly string[];
  /**
   * تحقّق من صلاحية المحتوى قبل قبوله.
   *
   * بدونه كان «النجاح» يعني «JSON قابل للتحليل» فقط، بينما الخطة تمرّ بعد
   * ذلك على مخطط zod في الـ route. القياس (سبتمبر 2026) أن النموذج المجاني
   * يردّ JSON سليم الشكل لكنه ناقص الحقول في معظم المحاولات — فتنتهي سلسلة
   * البدائل بنجاحٍ ظاهري، ثم يفشل zod بلا أي نموذج بديل يُجرَّب.
   * تمرير `validate` يجعل فشل المخطط محاولةً فاشلة تُكمل السلسلة.
   */
  validate?: (content: string) => boolean;
  /**
   * إيقاف «التفكير» الداخلي للنموذج.
   *
   * مقيس ومهم: نماذج التفكير المجانية تُنفق ميزانية الإخراج كاملة على
   * تفكير خفي ثم تردّ محتوى فارغاً (finish_reason=length مع
   * completion_tokens = max_tokens بالضبط وchars=0)، والسلوك عشوائي —
   * الطلب نفسه ينجح مرة ويفشل أخرى. إيقاف التفكير يجعل المخرجات مستقرة.
   */
  noReasoning?: boolean;
  signal?: AbortSignal;
}

export class OpenRouterError extends Error {
  constructor(
    message: string,
    readonly status: number = 502,
    readonly model?: string,
    /** صحيح عندما يكون السبب نفاد حصة الطلبات المجانية اليومية لا ازدحاماً. */
    readonly quotaExhausted = false,
    /**
     * عطل في إعدادات الخادم (مفتاح مفقود) لا في المزوّد.
     * بلا هذا التمييز كان غياب المفتاح يسقط في فرع «المزوّد فشل» فيُعرض
     * للمستخدم «النماذج المجانية غير مستقرة — أعد المحاولة»: نصيحة تدفعه
     * لإعادة محاولة لن تنجح أبداً، وتُخفي العطل الحقيقي عن المطوّر.
     */
    readonly configError = false,
  ) {
    super(message);
    this.name = 'OpenRouterError';
  }
}

/**
 * الحساب المجاني في OpenRouter محدود بـ 50 طلباً للنماذج المجانية يومياً.
 * عند النفاد يردّ 429 برسالة مختلفة عن ازدحام المزوّد — والتفريق مهم لأن
 * «أعد المحاولة بعد دقيقة» نصيحة خاطئة تماماً في حالة نفاد الحصة.
 */
function isDailyQuotaError(status: number, detail: string): boolean {
  if (status !== 429) return false;
  return /free-model|free model|daily limit|per day|add credits/i.test(detail);
}

/** حصة الطلبات المجانية المتبقية اليوم — للتشخيص ورسائل الخطأ. */
export async function freeQuota(): Promise<{ used: number; limit: number; remaining: number } | null> {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/key', {
      headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY ?? ''}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const d = await res.json();
    return d?.data?.free_model_daily_requests ?? null;
  } catch {
    return null;
  }
}

function headers() {
  const key = process.env.OPENROUTER_API_KEY?.trim();
  if (!key) {
    throw new OpenRouterError(
      'OPENROUTER_API_KEY غير معرّف في متغيرات البيئة',
      500, undefined, false, true,
    );
  }
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
  perAttemptTimeoutMs = 45_000,
  maxAttempts = Number.POSITIVE_INFINITY,
  discover = true,
  noReasoning = false,
  paidFallback = [],
  paidTimeoutMs = 45_000,
  validate,
  signal,
}: CompletionOptions): Promise<{ content: string; model: string }> {
  let lastError: unknown;
  const tried = new Set<string>();
  /** يصبح صحيحاً عند نفاد الحصة المجانية: لا فائدة من نموذج مجاني آخر. */
  let freeQuotaGone = false;

  const attempt = async (model: string, timeoutMs: number): Promise<{ content: string; model: string } | null> => {
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: headers(),
      signal: attemptSignal(signal, timeoutMs),
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        ...(json ? { response_format: { type: 'json_object' } } : {}),
        ...(noReasoning ? { reasoning: { enabled: false } } : {}),
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      if (RETRYABLE_STATUS.has(res.status)) {
        const quota = isDailyQuotaError(res.status, detail);
        lastError = new OpenRouterError(
          `فشل ${model}: ${res.status} ${detail.slice(0, 200)}`, res.status, model, quota,
        );
        console.warn('[openrouter] skip', model, res.status, detail.slice(0, 160));
        // نفاد الحصة اليومية يخصّ الحساب كله لا النموذج — لا فائدة من التالي
        if (quota) throw lastError;
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
    const why = choice?.finish_reason ?? choice?.native_finish_reason ?? 'unknown';

    if (!content.trim()) {
      // finish_reason=length بمحتوى فارغ = نموذج تفكير التهم ميزانية التوكنز
      lastError = new OpenRouterError(`رد فارغ من ${model} (finish_reason=${why})`, 502, model);
      console.warn('[openrouter] empty', model, 'finish_reason=', why);
      return null;
    }

    /**
     * finish_reason=length يعني أن النموذج قُطع في منتصف الكلام. مع json=true
     * تكون النتيجة JSON مبتوراً لا يمكن تحليله — وكان يُعاد كنجاح فيفشل
     * التحليل لاحقاً ويردّ 502 بلا محاولة نموذج آخر. نعامله كفشل قابل للتجاوز.
     */
    if (json && why === 'length') {
      lastError = new OpenRouterError(`رد مبتور من ${model} (تجاوز max_tokens)`, 502, model);
      console.warn('[openrouter] truncated', model, `${content.length} chars`);
      return null;
    }

    /**
     * فشل التحقق ليس خطأ شبكة: النموذج ردّ، لكن ردّه غير صالح للعرض.
     * نعامله كفشل قابل للتجاوز حتى يأخذ النموذج التالي (أو المدفوع) فرصته.
     */
    if (validate && !validate(content)) {
      lastError = new OpenRouterError(`رد غير مطابق للمخطط من ${model}`, 502, model);
      console.warn('[openrouter] invalid', model, `${content.length} chars`);
      return null;
    }

    return { content, model };
  };

  /**
   * @param allowRepeat القائمة الصريحة قد تُكرّر النموذج الأفضل عمداً: أعطال
   *   النماذج المجانية عابرة في الغالب (رد فارغ عشوائي بلا سبب)، فإعادة
   *   المحاولة على النموذج الأقوى أجدى من الهبوط إلى نموذج أضعف.
   * @param budget سقف محاولات خاص بهذه القائمة. القوائم المجانية تتقاسم
   *   `maxAttempts` حمايةً للحصة اليومية؛ أما القائمة المدفوعة فلها سقفها
   *   الخاص لأنها لا تمسّ تلك الحصة.
   */
  const run = async (
    candidates: readonly string[],
    { allowRepeat = false, budget = Number.POSITIVE_INFINITY, timeoutMs = perAttemptTimeoutMs } = {},
  ) => {
    let used = 0;
    for (const model of candidates) {
      if (!model) continue;
      if (!allowRepeat && tried.has(model)) continue;
      if (used >= budget) break;
      tried.add(model);
      used++;
      try {
        const ok = await attempt(model, timeoutMs);
        if (ok) return ok;
      } catch (err) {
        // إجهاض المستدعي (انتهاء مهلة الطلب كله) نهائي؛ أما انتهاء مهلة
        // المحاولة الواحدة فيعني ببساطة: جرّب النموذج التالي.
        if (signal?.aborted) throw err;
        // عطل إعداد أو مفتاح مرفوض: النموذج التالي سيفشل بالضبط كما فشل هذا.
        if (err instanceof OpenRouterError && (err.configError || err.status === 401 || err.status === 403)) throw err;
        /**
         * نفاد الحصة اليومية يخصّ الحساب كله لا النموذج: كل نموذج مجاني تالٍ
         * سيردّ 429 نفسه. نتوقف عن المجاني ونترك البديل المدفوع يكمل — فهو
         * لا يخضع لتلك الحصة.
         */
        if (err instanceof OpenRouterError && err.quotaExhausted) {
          freeQuotaGone = true;
          lastError = err;
          break;
        }
        if (err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
          console.warn('[openrouter] timeout', model, `${timeoutMs}ms`);
        }
        lastError = err;
      }
    }
    return null;
  };

  const usablePaid = paidFallback.filter(Boolean);

  const direct = await run(models, { allowRepeat: true, budget: maxAttempts });
  if (direct) return direct;

  // شبكة أمان أولى (مجانية): النماذج المُعرَّفة قد تكون سُحبت من الكتالوج —
  // نجرّب ما هو متاح مجاناً الآن فعلياً. تُتخطّى عند نفاد الحصة لأن كل
  // نموذج مجاني سيردّ 429 نفسه.
  if (discover && !freeQuotaGone) {
    const discovered = await discoverFreeModels(json);
    if (discovered.length) {
      console.warn('[openrouter] falling back to discovered free models', discovered.slice(0, 4));
      const rescue = await run(discovered.slice(0, 4), { budget: Math.max(0, maxAttempts - tried.size) });
      if (rescue) return rescue;
    }
  }

  // شبكة أمان أخيرة (مدفوعة): كل المجاني فشل أو نفدت الحصة. هنا فقط تُصرف
  // نقود — وهي الحالة التي كان المستخدم يرى فيها رسالة فشل بلا مخرج.
  if (usablePaid.length) {
    console.warn('[openrouter] falling back to paid models', usablePaid, freeQuotaGone ? '(free quota exhausted)' : '(free models failed)');
    const paid = await run(usablePaid, { allowRepeat: true, budget: usablePaid.length, timeoutMs: paidTimeoutMs });
    if (paid) return paid;
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
  paidFallback = [],
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

  // شبكة أمان مدفوعة — كما في complete()، تُستدعى فقط بعد فشل كل المجاني.
  if (!res) {
    for (const model of paidFallback.filter(Boolean)) {
      console.warn('[openrouter] stream falling back to paid model', model);
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
  if (start === -1) {
    throw new OpenRouterError('لم يُرجع النموذج JSON صالحاً', 502);
  }

  /**
   * نهاية الكائن الجذر تُحسب بموازنة الأقواس لا بـ lastIndexOf('}').
   *
   * مقيس: gemini-2.5-flash-lite يُنهي الخطة أحياناً بقوس إغلاق زائد
   * (`...]}\n}`)، وlastIndexOf كان يلتقط الزائد فيفشل JSON.parse على ردٍّ
   * سليم تماماً. الموازنة تقصّ عند الإغلاق الحقيقي وتتجاهل ما بعده — وهي
   * تُصلح أيضاً أي ثرثرة يكتبها النموذج بعد الكائن.
   */
  const end = balancedEnd(text, start);
  if (end === -1) {
    // لم يُغلق الكائن أصلاً (رد مبتور) — نترك الأمر لمنقذ البتر أدناه.
    const closed = closeTruncatedJson(text);
    if (closed) {
      try { return JSON.parse(closed) as T; } catch { /* نُكمل للخطأ الموحّد */ }
    }
    throw new OpenRouterError('لم يُرجع النموذج JSON صالحاً', 502);
  }
  text = text.slice(start, end);

  try {
    return JSON.parse(text) as T;
  } catch {
    // محاولة إنقاذ أولى: حذف الفواصل الزائدة قبل } أو ]
    const repaired = text.replace(/,(\s*[}\]])/g, '$1');
    try {
      return JSON.parse(repaired) as T;
    } catch {
      // ملاذ أخير: JSON مبتور (انقطع الرد في منتصف عنصر). نقصّه عند آخر
      // عنصر مكتمل ثم نُغلق ما بقي مفتوحاً — خطة ناقصة أفضل من صفحة خطأ،
      // وzod يملأ ما ينقص بقيم افتراضية.
      const closed = closeTruncatedJson(raw);
      if (closed) {
        try { return JSON.parse(closed) as T; } catch { /* لا شيء نفعله */ }
      }
      throw new OpenRouterError('تعذّر تحليل JSON القادم من النموذج', 502);
    }
  }
}

/**
 * يُرجع موضع نهاية الكائن الجذر (بعد قوس الإغلاق المقابل) أو -1 إن لم يُغلق.
 * يحترم النصوص وعلامات الهروب حتى لا يُحسب قوس داخل نصٍّ كقوس بنيوي.
 */
function balancedEnd(text: string, start: number): number {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;

    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return i + 1;
    }
  }
  return -1;
}

/**
 * يُغلق كائن JSON انقطع في منتصفه.
 * يمشي على النص حرفاً حرفاً (مع احترام النصوص وعلامات الهروب) ليعرف ما
 * تبقّى مفتوحاً، ثم يتراجع إلى آخر حدّ آمن ويُغلق الأقواس بالترتيب العكسي.
 */
function closeTruncatedJson(raw: string): string | null {
  const start = raw.indexOf('{');
  if (start === -1) return null;

  const stack: string[] = [];
  let inString = false;
  let escaped = false;
  /** آخر موضع كان فيه الهيكل «نظيفاً»: بعد قيمة مكتملة مباشرة. */
  let safeEnd = -1;

  for (let i = start; i < raw.length; i++) {
    const ch = raw[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }
    if (ch === '"') { inString = !inString; if (!inString) safeEnd = i + 1; continue; }
    if (inString) continue;

    if (ch === '{' || ch === '[') stack.push(ch);
    else if (ch === '}' || ch === ']') { stack.pop(); safeEnd = i + 1; }
    else if (ch === ',') safeEnd = i;           // نقطع قبل الفاصلة لا بعدها
    else if (/[\d]/.test(ch)) safeEnd = i + 1;
  }

  if (!stack.length || safeEnd <= start) return null;

  let body = raw.slice(start, safeEnd).replace(/,\s*$/, '');
  // أغلق ما تبقّى مفتوحاً بترتيب عكسي
  for (let i = stack.length - 1; i >= 0; i--) body += stack[i] === '{' ? '}' : ']';
  return body;
}
