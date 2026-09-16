'use client';

/**
 * OnboardingFlow — يلتقط التفضيلات الافتراضية مرة واحدة عند إنشاء الحساب،
 * فتبدأ كل خطة لاحقة مملوءة مسبقاً بدل سؤال المستخدم في كل مرة.
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Loader2, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OptionGroup } from './OptionGroup';
import { TRIP_TYPES, BUDGET_LEVELS, PACES, INTERESTS, CURRENCIES } from './options';
import type { BudgetLevel, Pace, TripType } from '@/types/trip';
import { toErrorMessage } from '@/lib/utils';

export function OnboardingFlow({ name }: { name: string | null }) {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);
  const [homeCity, setHomeCity] = React.useState('');
  const [currency, setCurrency] = React.useState('SAR');
  const [tripType, setTripType] = React.useState<TripType>('couple');
  const [budgetLevel, setBudgetLevel] = React.useState<BudgetLevel>('comfort');
  const [pace, setPace] = React.useState<Pace>('balanced');
  const [interests, setInterests] = React.useState<string[]>([]);

  const toggleInterest = React.useCallback((v: string) => {
    setInterests((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  }, []);

  const interestOptions = React.useMemo(
    () => INTERESTS.map((i) => ({ value: i.value, label: i.value, emoji: i.emoji })),
    [],
  );

  const save = React.useCallback(async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('انتهت الجلسة، أعد تسجيل الدخول');

      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: name,
        home_city: homeCity || null,
        currency,
        preferences: { tripType, budgetLevel, pace, interests },
        onboarded: true,
      });
      if (error) throw error;

      toast.success('تم حفظ تفضيلاتك');
      router.push('/plan/new');
      router.refresh();
    } catch (err) {
      toast.error(toErrorMessage(err));
      setSaving(false);
    }
  }, [name, homeCity, currency, tripType, budgetLevel, pace, interests, router]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
      <header className="mb-8 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-primary">خطوة أخيرة</p>
        <h1 className="mt-3 text-3xl font-light">
          {name ? `أهلاً ${name.split(' ')[0]}` : 'أهلاً بك'}، عرّفنا على ذوقك
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          نستخدم هذه التفضيلات كنقطة بداية لكل خطة — ويمكنك تعديلها في أي رحلة.
        </p>
      </header>

      <div className="card-warm space-y-7 p-5 sm:p-8">
        <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
          <div className="space-y-2">
            <Label htmlFor="home">مدينتك</Label>
            <Input id="home" placeholder="مثال: جدة" value={homeCity} onChange={(e) => setHomeCity(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cur">العملة</Label>
            <select
              id="cur"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="h-11 w-full rounded-xl border border-border/70 bg-white/60 px-4 text-sm backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 dark:bg-white/5"
            >
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <OptionGroup label="غالباً تسافر…" options={TRIP_TYPES} value={tripType} onChange={setTripType} columns={3} />
        <OptionGroup label="ميزانيتك المعتادة" options={BUDGET_LEVELS} value={budgetLevel} onChange={setBudgetLevel} columns={3} />
        <OptionGroup label="وتيرتك المفضّلة" options={PACES} value={pace} onChange={setPace} columns={3} />
        <OptionGroup label="ما الذي يهمّك في السفر؟" options={interestOptions} value={interests} onChange={toggleInterest} multiple columns={3} />

        <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-6">
          <Button variant="ghost" onClick={() => router.push('/dashboard')} disabled={saving}>تخطّي</Button>
          <Button size="lg" onClick={save} disabled={saving || interests.length === 0}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <ArrowLeft className="size-4" />}
            {saving ? 'جارٍ الحفظ…' : 'احفظ وابدأ'}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
