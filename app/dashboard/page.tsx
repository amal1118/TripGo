import Link from 'next/link';
import Image from 'next/image';
import { Plus, Sparkles, MapPin, CalendarRange, ArrowLeft } from 'lucide-react';
import { requireUser } from '@/lib/supabase/server';
import { AppScreen } from '@/components/shell/AppScreen';
import { ScreenHeader } from '@/components/shell/ScreenHeader';
import { Badge } from '@/components/ui/badge';
import { formatDateAr } from '@/lib/utils';

export const metadata = { title: 'رحلاتي' };
export const dynamic = 'force-dynamic';

const STATUS_AR = { draft: 'مسودة', planned: 'مُخططة', completed: 'منتهية' } as const;

export default async function DashboardPage() {
  const { supabase, user } = await requireUser('/dashboard');

  const [{ data: trips }, { data: profile }] = await Promise.all([
    supabase
      .from('trips')
      .select('id, title, destination, start_date, cover_image, status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(24),
    supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).maybeSingle(),
  ]);

  const name = profile?.full_name ?? user.user_metadata?.full_name ?? 'مسافر';
  const avatar = profile?.avatar_url ?? user.user_metadata?.avatar_url ?? null;

  return (
    <AppScreen>
      <ScreenHeader name={name} avatarUrl={avatar} />

      {/* بطاقة البدء */}
      <Link
        href="/plan/new"
        className="group mb-6 flex items-center justify-between gap-4 rounded-3xl bg-primary p-5 text-primary-foreground shadow-glow transition-transform active:scale-[0.99]"
      >
        <div className="min-w-0">
          <p className="t-eyebrow opacity-80">إلى أين تريد أن تذهب؟</p>
          <p className="mt-1.5 text-lg font-bold leading-tight">ابدأ خطة رحلة جديدة</p>
        </div>
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white/20 transition-transform group-hover:-translate-x-1">
          <Plus className="size-5" />
        </span>
      </Link>

      {/* المساعد */}
      <Link href="/chat" className="card-warm card-warm-hover mb-8 flex items-center gap-4 p-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10">
          <Sparkles className="size-5 text-primary" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">اسأل رفيق TripGo</p>
          <p className="t-sm text-muted-foreground">تأشيرات، طقس، أسعار، أو مقارنة بين وجهتين</p>
        </div>
        <ArrowLeft className="size-4 shrink-0 text-muted-foreground" />
      </Link>

      {/* الرحلات */}
      <section>
        <h2 className="mb-4 t-h2">رحلاتي</h2>

        {!trips?.length ? (
          <div className="card-warm grid place-items-center gap-4 p-12 text-center">
            <MapPin className="size-10 text-primary/50" />
            <div>
              <p className="font-semibold">لا توجد رحلات بعد</p>
              <p className="mt-1 t-sm text-muted-foreground">أنشئ خطتك الأولى وستظهر هنا محفوظة.</p>
            </div>
            <Link href="/plan/new" className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">
              ابدأ الآن
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {trips.map((trip) => (
              <Link key={trip.id} href={`/trips/${trip.id}`} className="group">
                <article className="card-warm card-warm-hover h-full overflow-hidden">
                  <div className="relative h-44 overflow-hidden">
                    {trip.cover_image && (
                      <Image
                        src={trip.cover_image}
                        alt={trip.destination}
                        fill
                        sizes="(max-width: 640px) 100vw, 330px"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    )}
                    <div className="absolute inset-0 img-scrim" />
                    <Badge variant="glass" className="absolute end-3 top-3 border-white/30 text-white">
                      {STATUS_AR[trip.status as keyof typeof STATUS_AR]}
                    </Badge>

                    <div className="absolute inset-x-4 bottom-3 text-white">
                      <h3 className="line-clamp-1 font-display text-lg font-semibold">{trip.title}</h3>
                      <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-white/80">
                        <MapPin className="size-3.5" />
                        {trip.destination}
                      </p>
                    </div>
                  </div>

                  {trip.start_date && (
                    <p className="flex items-center gap-1.5 px-4 py-3 t-sm text-muted-foreground">
                      <CalendarRange className="size-3.5" />
                      {formatDateAr(trip.start_date)}
                    </p>
                  )}
                </article>
              </Link>
            ))}
          </div>
        )}
      </section>
    </AppScreen>
  );
}
