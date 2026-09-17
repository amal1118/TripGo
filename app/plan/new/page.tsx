import { requireUser } from '@/lib/supabase/server';
import { PlanBuilder } from '@/components/plan/PlanBuilder';
import { AppScreen } from '@/components/shell/AppScreen';
import type { TripPreferences } from '@/types/trip';

export const metadata = { title: 'خطة جديدة' };

/** Server Component: يقرأ التفضيلات الافتراضية فيبدأ المعالج مملوءاً. */
export default async function NewPlanPage({ searchParams }: { searchParams: { q?: string; destination?: string } }) {
  const { supabase, user } = await requireUser('/plan/new');

  const { data: profile } = await supabase
    .from('profiles')
    .select('preferences, home_city, currency')
    .eq('id', user.id)
    .maybeSingle();

  // مستوى 'premium' أُدمج في 'luxury'؛ نُطبّع التفضيلات المحفوظة قبل تمريرها.
  const saved = { ...(profile?.preferences ?? {}) } as Record<string, unknown>;
  if (saved.budgetLevel === 'premium') saved.budgetLevel = 'luxury';

  const defaults: Partial<TripPreferences> = {
    ...(saved as Partial<TripPreferences>),
    origin: profile?.home_city ?? undefined,
    currency: profile?.currency ?? 'SAR',
    // الوجهة القادمة من بطاقة وجهة تملأ الحقل الأول مباشرة
    destination: searchParams.destination?.slice(0, 80) || undefined,
    // نص البحث القادم من صفحة الهبوط يبدأ كملاحظة، فلا يُعيد المستخدم كتابته
    notes: searchParams.q?.slice(0, 600) || undefined,
  };

  return (
    <AppScreen>
      <header className="mb-7 pt-2 text-center">
        <p className="t-eyebrow mb-2 text-primary">مخطط الرحلات</p>
        <h1 className="t-h1 text-balance">لنبنِ رحلتك</h1>
        <p className="mt-2 t-sm text-muted-foreground">ثلاث خطوات قصيرة، ثم خطة كاملة قابلة للحفظ.</p>
      </header>
      <PlanBuilder defaults={defaults} />
    </AppScreen>
  );
}
