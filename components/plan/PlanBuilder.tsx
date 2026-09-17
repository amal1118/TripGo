'use client';

/**
 * PlanBuilder — معالج ثلاثي الخطوات لجمع تفضيلات الرحلة.
 *
 * ملاحظات أداء:
 * - useReducer بدل عدة useState: تحديث واحد لكل تفاعل، وdispatch مستقرة
 *   مرجعياً فلا تُبطل مذكّرات الأبناء (memo) عند كل رسم.
 * - كل خطوة مكوّن memo منفصل؛ تغيير حقل في الخطوة 1 لا يلمس الخطوة 3.
 * - AnimatePresence بـ mode="wait" يضمن عدم تركيب خطوتين معاً.
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  ArrowLeft, ArrowRight, Loader2, Sparkles,
  MapPin, PlaneTakeoff, CalendarDays, CalendarCheck, CalendarRange, Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { OptionGroup } from './OptionGroup';
import {
  TRIP_TYPES, BUDGET_LEVELS, PACES, STAY_STYLES,
  INTERESTS, FOOD_PREFERENCES, ACCESSIBILITY, CURRENCIES,
} from './options';
import type { TripPreferences } from '@/types/trip';
import { cn, toErrorMessage } from '@/lib/utils';

/* ---------- الحالة ---------- */

type State = TripPreferences;

type Action =
  | { type: 'set'; key: keyof State; value: State[keyof State] }
  | { type: 'toggle'; key: 'interests' | 'foodPreferences' | 'accessibility'; value: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'set':
      return { ...state, [action.key]: action.value };
    case 'toggle': {
      const list = state[action.key] ?? [];
      return {
        ...state,
        [action.key]: list.includes(action.value)
          ? list.filter((v) => v !== action.value)
          : [...list, action.value],
      };
    }
  }
}

const INITIAL: State = {
  destination: '', origin: '', startDate: '', endDate: '',
  durationDays: 5, travelers: 2, tripType: 'couple',
  budgetLevel: 'comfort', budgetAmount: null, currency: 'SAR',
  pace: 'balanced', stayStyle: 'hotel',
  interests: ['طعام', 'طبيعة'], foodPreferences: ['حلال'], accessibility: [], notes: '',
};

const STEPS = [
  { id: 0, title: 'الوجهة والتواريخ', sub: 'أين ومتى؟' },
  { id: 1, title: 'نمط الرحلة والميزانية', sub: 'كيف تحب أن تسافر؟' },
  { id: 2, title: 'اهتماماتك', sub: 'ما الذي يجعل الرحلة تستحق؟' },
];

export function PlanBuilder({ defaults }: { defaults?: Partial<TripPreferences> }) {
  const router = useRouter();
  const [state, dispatch] = React.useReducer(reducer, { ...INITIAL, ...defaults });
  const [step, setStep] = React.useState(0);
  const [loading, setLoading] = React.useState(false);

  /* callbacks مستقرة — تُمرَّر لأبناء memo */
  const setField = React.useCallback(
    <K extends keyof State>(key: K, value: State[K]) => dispatch({ type: 'set', key, value: value as State[keyof State] }),
    [],
  );
  const toggleInterest = React.useCallback((v: string) => dispatch({ type: 'toggle', key: 'interests', value: v }), []);
  const toggleFood = React.useCallback((v: string) => dispatch({ type: 'toggle', key: 'foodPreferences', value: v }), []);
  const toggleAccess = React.useCallback((v: string) => dispatch({ type: 'toggle', key: 'accessibility', value: v }), []);

  /* حساب المدة تلقائياً من التواريخ */
  React.useEffect(() => {
    if (!state.startDate || !state.endDate) return;
    const d = Math.round(
      (new Date(state.endDate).getTime() - new Date(state.startDate).getTime()) / 86_400_000,
    );
    if (d > 0 && d <= 30 && d !== state.durationDays) setField('durationDays', d);
  }, [state.startDate, state.endDate, state.durationDays, setField]);

  const canAdvance = React.useMemo(() => {
    if (step === 0) return state.destination.trim().length >= 2;
    if (step === 2) return state.interests.length > 0;
    return true;
  }, [step, state.destination, state.interests.length]);

  const submit = React.useCallback(async () => {
    setLoading(true);
    const toastId = toast.loading('نُجهّز خطتك… قد يستغرق هذا دقيقة');
    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: state }),
      });
      const data = await res.json();
      if (!res.ok) {
        // في التطوير يرسل الخادم detail بسبب العطل الحقيقي — نُظهره بدل
        // الرسالة العامة حتى لا يتطلب التشخيص قراءة سجل الخادم.
        if (data?.detail) console.error('[plan] %s — %s', data?.error, data.detail);
        throw new Error(data?.error ?? 'تعذّر توليد الخطة');
      }

      toast.success('جاهزة! ننقلك إلى خطتك', { id: toastId });
      if (data.tripId) router.push(`/trips/${data.tripId}`);
      else {
        sessionStorage.setItem('tripgo:preview', JSON.stringify(data.itinerary));
        router.push('/trips/preview');
      }
    } catch (err) {
      toast.error(toErrorMessage(err), { id: toastId });
      setLoading(false);
    }
  }, [state, router]);

  return (
    <div className="w-full">
      {/* شريط التقدّم */}
      <div className="mb-8 flex items-center gap-3">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.id}>
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              disabled={i > step}
              className={cn(
                'grid size-9 shrink-0 place-items-center rounded-full text-sm font-medium transition-all',
                i === step ? 'bg-primary text-primary-foreground shadow-glow' :
                i < step ? 'bg-primary/20 text-primary hover:bg-primary/30' :
                'bg-muted text-muted-foreground',
              )}
            >
              {i + 1}
            </button>
            {i < STEPS.length - 1 && (
              <div className="h-px flex-1 bg-border">
                <div className="h-full bg-primary transition-all duration-500" style={{ width: i < step ? '100%' : '0%' }} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="card-warm p-5 sm:p-8">
        <header className="mb-7">
          <p className="t-eyebrow text-primary">الخطوة {step + 1} من 3</p>
          <h2 className="mt-2 t-h1">{STEPS[step].title}</h2>
          <p className="mt-1 t-sm text-muted-foreground">{STEPS[step].sub}</p>
        </header>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-7"
          >
            {step === 0 && <StepDestination state={state} setField={setField} />}
            {step === 1 && (
              <StepStyle
                state={state}
                setField={setField}
                onTripType={(v) => setField('tripType', v)}
                onBudget={(v) => setField('budgetLevel', v)}
                onPace={(v) => setField('pace', v)}
                onStay={(v) => setField('stayStyle', v)}
              />
            )}
            {step === 2 && (
              <StepInterests
                state={state}
                setField={setField}
                onInterest={toggleInterest}
                onFood={toggleFood}
                onAccess={toggleAccess}
              />
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex items-center justify-between gap-3 border-t border-border/60 pt-5">
          <Button variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 0 || loading}>
            <ArrowRight className="size-4" />
            السابق
          </Button>

          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance}>
              التالي
              <ArrowLeft className="size-4" />
            </Button>
          ) : (
            <Button size="lg" onClick={submit} disabled={!canAdvance || loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {loading ? 'جارٍ التخطيط…' : 'أنشئ الخطة'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * الخطوات — مكوّنات memo مستقلة
 * ========================================================== */

type SetField = <K extends keyof State>(key: K, value: State[K]) => void;

const StepDestination = React.memo(function StepDestination({ state, setField }: { state: State; setField: SetField }) {
  return (
    /* شبكة واحدة لكل الحقول الستة: عمودان متساويان وفواصل موحّدة، فتتحاذى
       كل خانة مع مقابلها أفقياً بدل ثلاث شبكات منفصلة بمسافات مختلفة. */
    <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="destination">
          <MapPin className="size-3.5 shrink-0 text-primary" /> الوجهة
        </Label>
        <Input
          id="destination"
          placeholder="مثال: طوكيو، اليابان"
          value={state.destination}
          onChange={(e) => setField('destination', e.target.value)}
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="origin">
          <PlaneTakeoff className="size-3.5 shrink-0 text-primary" /> مدينة الانطلاق
        </Label>
        <Input
          id="origin"
          placeholder="مثال: الرياض"
          value={state.origin ?? ''}
          onChange={(e) => setField('origin', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="start">
          <CalendarDays className="size-3.5 shrink-0 text-primary" /> تاريخ المغادرة
        </Label>
        <Input id="start" type="date" value={state.startDate ?? ''} onChange={(e) => setField('startDate', e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="end">
          <CalendarCheck className="size-3.5 shrink-0 text-primary" /> تاريخ العودة
        </Label>
        <Input id="end" type="date" min={state.startDate} value={state.endDate ?? ''} onChange={(e) => setField('endDate', e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="days">
          <CalendarRange className="size-3.5 shrink-0 text-primary" /> عدد الأيام
        </Label>
        <Input id="days" type="number" min={1} max={30} value={state.durationDays}
               onChange={(e) => setField('durationDays', Number(e.target.value))} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="travelers">
          <Users className="size-3.5 shrink-0 text-primary" /> عدد المسافرين
        </Label>
        <Input id="travelers" type="number" min={1} max={20} value={state.travelers}
               onChange={(e) => setField('travelers', Number(e.target.value))} />
      </div>
    </div>
  );
});

const StepStyle = React.memo(function StepStyle({
  state, setField, onTripType, onBudget, onPace, onStay,
}: {
  state: State; setField: SetField;
  onTripType: (v: State['tripType']) => void;
  onBudget: (v: State['budgetLevel']) => void;
  onPace: (v: State['pace']) => void;
  onStay: (v: NonNullable<State['stayStyle']>) => void;
}) {
  return (
    <>
      <OptionGroup label="نوع الرحلة" options={TRIP_TYPES} value={state.tripType} onChange={onTripType} columns={3} />
      <OptionGroup label="مستوى الميزانية" description="للشخص الواحد يومياً، شاملة الإقامة والطعام والأنشطة"
                   options={BUDGET_LEVELS} value={state.budgetLevel} onChange={onBudget} columns={3} />

      <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
        <div className="space-y-2">
          <Label htmlFor="budget">سقف الميزانية للشخص (اختياري)</Label>
          <Input id="budget" type="number" min={0} placeholder="مثال: 6000"
                 value={state.budgetAmount ?? ''}
                 onChange={(e) => setField('budgetAmount', e.target.value ? Number(e.target.value) : null)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">العملة</Label>
          <select
            id="currency"
            value={state.currency}
            onChange={(e) => setField('currency', e.target.value)}
            className="h-11 w-full rounded-xl border border-border/70 bg-white/60 px-4 text-sm backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 dark:bg-white/5"
          >
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <OptionGroup label="وتيرة الرحلة" options={PACES} value={state.pace} onChange={onPace} columns={3} />
      <OptionGroup label="نمط الإقامة" options={STAY_STYLES} value={state.stayStyle ?? 'hotel'} onChange={onStay} columns={4} />
    </>
  );
});

const StepInterests = React.memo(function StepInterests({
  state, setField, onInterest, onFood, onAccess,
}: {
  state: State; setField: SetField;
  onInterest: (v: string) => void; onFood: (v: string) => void; onAccess: (v: string) => void;
}) {
  const interestOptions = React.useMemo(
    () => INTERESTS.map((i) => ({ value: i.value, label: i.value, emoji: i.emoji })),
    [],
  );
  const foodOptions = React.useMemo(() => FOOD_PREFERENCES.map((f) => ({ value: f, label: f })), []);
  const accessOptions = React.useMemo(() => ACCESSIBILITY.map((a) => ({ value: a, label: a })), []);

  return (
    <>
      <OptionGroup label="اهتماماتك" description="اختر ما لا يقل عن واحد — كلما زادت الدقة تحسّنت الخطة"
                   options={interestOptions} value={state.interests} onChange={onInterest} multiple columns={3} />
      <OptionGroup label="تفضيلات الطعام" options={foodOptions} value={state.foodPreferences ?? []} onChange={onFood} multiple columns={3} />
      <OptionGroup label="متطلبات خاصة" options={accessOptions} value={state.accessibility ?? []} onChange={onAccess} multiple columns={2} />

      <div className="space-y-2">
        <Label htmlFor="notes">أي شيء آخر نضعه في الحسبان؟</Label>
        <Textarea
          id="notes"
          maxLength={600}
          placeholder="مثال: نفضّل الابتعاد عن الأماكن المزدحمة، ولدينا طفل عمره سنتان…"
          value={state.notes ?? ''}
          onChange={(e) => setField('notes', e.target.value)}
        />
      </div>
    </>
  );
});
