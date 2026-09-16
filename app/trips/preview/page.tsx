'use client';

/**
 * /trips/preview — شبكة أمان.
 * إذا تعذّر حفظ الخطة في Supabase (خلل RLS أو انقطاع)، يحتفظ المعالج بها
 * في sessionStorage ويوجّه هنا، فلا يضيع ناتج دقيقة كاملة من التوليد.
 * ملاحظة: المسار الثابت له أولوية على [id] في Next، فلا تعارض بينهما.
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { ItineraryView } from '@/components/itinerary/ItineraryView';
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
      <div className="grid min-h-dvh place-items-center px-6 text-center">
        <div className="max-w-sm">
          <AlertTriangle className="mx-auto mb-4 size-10 text-primary" />
          <h1 className="t-h2">لا توجد خطة للمعاينة</h1>
          <p className="mt-2 t-sm text-muted-foreground">انتهت الجلسة أو فُتح الرابط مباشرة.</p>
          <button
            onClick={() => router.push('/plan/new')}
            className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            أنشئ خطة جديدة
          </button>
        </div>
      </div>
    );
  }

  if (!itinerary) return <div className="grid min-h-dvh place-items-center t-sm text-muted-foreground">جارٍ التحميل…</div>;

  return <ItineraryView itinerary={itinerary} unsaved />;
}
