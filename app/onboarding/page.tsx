import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { OnboardingFlow } from '@/components/plan/OnboardingFlow';

export const metadata = { title: 'إعداد ملفك' };

export default async function OnboardingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles').select('onboarded, full_name').eq('id', user!.id).maybeSingle();

  if (profile?.onboarded) redirect('/dashboard');

  return (
    <main className="relative min-h-dvh px-6 py-12">
      <div aria-hidden className="aurora pointer-events-none fixed inset-0" />
      <div className="relative mx-auto max-w-2xl">
        <OnboardingFlow name={profile?.full_name ?? user?.user_metadata?.full_name ?? null} />
      </div>
    </main>
  );
}
