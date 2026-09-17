/**
 * GET  /api/trips — قائمة رحلات المستخدم (خفيفة، بدون itinerary الضخم).
 * POST /api/trips — حفظ خطة وُلِّدت ولم تُحفظ (شاشة /trips/preview).
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { itinerarySchema } from '@/lib/schemas';
import { getCoverImage, tripDestinationKey } from '@/lib/images';

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

/**
 * يحفظ خطة جاهزة قادمة من شاشة المعاينة.
 * لا يستدعي النموذج ولا يُحتسب على حدّ التوليد — هو إنقاذ لناتج موجود
 * أصلاً فشل حفظه أول مرة.
 */
export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'يلزم تسجيل الدخول' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = itinerarySchema.safeParse(body?.itinerary);
  if (!parsed.success) {
    return NextResponse.json({ error: 'الخطة غير صالحة' }, { status: 400 });
  }
  const itinerary = parsed.data;
  const destination = itinerary.meta.destination || itinerary.meta.destinationEn;

  const { data, error } = await supabase
    .from('trips')
    .insert({
      user_id: user.id,
      title: itinerary.meta.title || `رحلة إلى ${destination}`,
      destination,
      cover_image: getCoverImage(tripDestinationKey(itinerary.meta)),
      // التفضيلات غير متاحة هنا (المعاينة تحمل الناتج وحده)
      preferences: body?.preferences ?? {},
      itinerary,
      status: 'planned',
    })
    .select('id')
    .single();

  if (error) {
    console.error('[trips] insert failed', error.message);
    return NextResponse.json({ error: 'تعذّر الحفظ. تحقّق من اتصالك ثم أعد المحاولة.' }, { status: 500 });
  }

  return NextResponse.json({ tripId: data.id });
}
