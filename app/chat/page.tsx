import { requireUser } from '@/lib/supabase/server';
import { AppScreen } from '@/components/shell/AppScreen';
import { ScreenHeader } from '@/components/shell/ScreenHeader';
import { ChatPanel } from '@/components/chat/ChatPanel';

export const metadata = { title: 'المساعد الذكي' };
export const dynamic = 'force-dynamic';

export default async function ChatPage() {
  const { supabase, user } = await requireUser('/chat');
  const { data: profile } = await supabase
    .from('profiles').select('full_name, avatar_url').eq('id', user.id).maybeSingle();

  return (
    <AppScreen className="flex min-h-dvh flex-col">
      <ScreenHeader
        name={profile?.full_name ?? user.user_metadata?.full_name ?? 'المساعد الذكي'}
        avatarUrl={profile?.avatar_url ?? user.user_metadata?.avatar_url ?? null}
        greeting="رفيقك في السفر"
      />
      <ChatPanel />
    </AppScreen>
  );
}
