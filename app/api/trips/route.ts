/** GET /api/trips — قائمة رحلات المستخدم (خفيفة، بدون itinerary الضخم). */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'يلزم تسجيل الدخول' }, { status: 401 });

  const { data, error } = await supabase
    .from('trips')
    .select('id, title, destination, start_date, end_date, cover_image, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ trips: data });
}
