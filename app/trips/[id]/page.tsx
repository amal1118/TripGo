import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ItineraryView } from '@/components/itinerary/ItineraryView';
import { itinerarySchema } from '@/lib/schemas';
import type { Metadata } from 'next';

interface Props { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient();
  const { data } = await supabase.from('trips').select('title, destination').eq('id', params.id).maybeSingle();
  return { title: data?.title ?? 'خطة الرحلة', description: data ? `خطة رحلة إلى ${data.destination}` : undefined };
}

/** Server Component: يجلب الخطة ويمرّرها جاهزة — بلا حالة تحميل على العميل. */
export default async function TripPage({ params }: Props) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('trips')
    .select('id, title, itinerary')
    .eq('id', params.id)
    .maybeSingle();

  if (error || !data) notFound();

  // الخطط المحفوظة قبل تعديل المخطط قد تنقصها حقول — zod يُطبّعها
  const parsed = itinerarySchema.safeParse(data.itinerary);
  if (!parsed.success) notFound();

  return <ItineraryView itinerary={parsed.data} tripId={data.id} />;
}
