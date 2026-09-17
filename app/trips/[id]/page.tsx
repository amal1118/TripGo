import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ItineraryView } from '@/components/itinerary/ItineraryView';
import { itinerarySchema } from '@/lib/schemas';
import type { Metadata } from 'next';

interface Props { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient();
  const { data } = await supabase
    .from('trips')
    .select('title, destination, cover_image')
    .eq('id', params.id)
    .maybeSingle();

  if (!data) return { title: 'خطة الرحلة' };

  const description = `خطة رحلة إلى ${data.destination}`;
  return {
    title: data.title,
    description,
    // بلا صورة كان رابط المشاركة يظهر في واتساب وتويتر كنصّ عارٍ،
    // رغم أن الغلاف مخزَّن مع السجل أصلاً.
    openGraph: {
      title: data.title,
      description,
      type: 'article',
      images: data.cover_image ? [{ url: data.cover_image, width: 1200, height: 700 }] : undefined,
    },
    twitter: {
      card: data.cover_image ? 'summary_large_image' : 'summary',
      title: data.title,
      description,
      images: data.cover_image ? [data.cover_image] : undefined,
    },
  };
}

/** Server Component: يجلب الخطة ويمرّرها جاهزة — بلا حالة تحميل على العميل. */
export default async function TripPage({ params }: Props) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('trips')
    .select('id, title, itinerary, cover_image')
    .eq('id', params.id)
    .maybeSingle();

  if (error || !data) notFound();

  // الخطط المحفوظة قبل تعديل المخطط قد تنقصها حقول — zod يُطبّعها
  const parsed = itinerarySchema.safeParse(data.itinerary);
  if (!parsed.success) notFound();

  return <ItineraryView itinerary={parsed.data} tripId={data.id} coverImage={data.cover_image} />;
}
