'use client';

/**
 * /trips/preview — شبكة أمان.
 * إذا تعذّر حفظ الخطة في Supabase (خلل RLS أو انقطاع)، يحتفظ المعالج بها
 * في sessionStorage ويوجّه هنا، فلا يضيع ناتج دقيقة كاملة من التوليد.
 * الخطة هنا غير محفوظة، وItineraryView يعرض شريط حفظ صريحاً يستدعي
 * POST /api/trips — قبل ذلك كانت تضيع بمجرد إغلاق التبويب.
 * ملاحظة: المسار الثابت له أولوية على [id] في Next، فلا تعارض بينهما.
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { ItineraryView } from '@/components/itinerary/ItineraryView';
import { ItinerarySkeleton } from '@/components/itinerary/ItinerarySkeleton';
import { itinerarySchema } from '@/lib/schemas';
import type { Itinerary } from '@/types/trip';

export default function PreviewPage() {
  const router = useRouter();
  const [itinerary, setItinerary] = React.useState<Itinerary | null>(null);
  const [missing, setMissing] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem('tripgo:preview');
      if (!raw) return setMissing(true);
      const parsed = itinerarySchema.safeParse(JSON.parse(raw));
      if (parsed.success) setItinerary(parsed.data as Itinerary);
      else setMissing(true);
    } catch {
      setMissing(true);
    }
  }, []);

  if (missing) {
    return (
      <div className="canvas grid min-h-dvh place-items-center px-6 pb-28 text-center">
        <div className="max-w-sm">
          <span className="mx-auto mb-5 grid size-16 place-items-center rounded-3xl bg-primary/10">
            <AlertTriangle className="size-8 text-primary" />
          </span>
          <h1 className="t-h2">لا توجد خطة للمعاينة</h1>
          <p className="mt-2 t-sm text-muted-foreground">انتهت الجلسة أو فُتح الرابط مباشرة.</p>
          <button
            onClick={() => router.push('/plan/new')}
            className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform active:scale-95"
          >
            أنشئ خطة جديدة
          </button>
        </div>
      </div>
    );
  }

  if (!itinerary) return <ItinerarySkeleton />;

  return <ItineraryView itinerary={itinerary} />;
}
