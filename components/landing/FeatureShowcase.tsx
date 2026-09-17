import Link from 'next/link';
import Image from 'next/image';
import { Hotel, Plane, Utensils, Ticket, Landmark, ShoppingBag, ArrowLeft } from 'lucide-react';
import { unsplash } from '@/lib/destinations';

const CATEGORIES = [
  { icon: Hotel, title: 'أفضل الفنادق', body: 'إقامات مرتبة حسب ميزانيتك وموقعك المفضل، مع سبب واضح لكل اختيار.' },
  { icon: Plane, title: 'أرخص الرحلات', body: 'مقارنة أسعار ومدد الطيران مع ملاحظة عن سبب كون كل خيار الأوفر.' },
  { icon: Utensils, title: 'مطاعم وكافيهات', body: 'أطباق تستحق التجربة، مستوى الأسعار، وإشارة واضحة للخيارات الحلال.' },
  { icon: Ticket, title: 'أفضل التجارب', body: 'أنشطة مختارة حسب اهتماماتك، مع أفضل وقت لها ورابط حجز مباشر.' },
  { icon: Landmark, title: 'المعالم السياحية', body: 'نصيحة عملية لكل معلم: تفادي الزحام، وأفضل زاوية للتصوير.' },
  { icon: ShoppingBag, title: 'التسوق والمولات', body: 'من الأسواق الشعبية إلى الأوتلت — ما يشتهر به كل مكان ومستوى أسعاره.' },
];

const STEPS = [
  { n: '01', t: 'حدّد تفضيلاتك', d: 'الميزانية، نوع الرحلة، الاهتمامات، والوتيرة — في نموذج واحد مقسّم.' },
  { n: '02', t: 'نُشغّل المخطط الذكي', d: 'تُرسل تفضيلاتك إلى نموذج لغوي يُعيد خطة مهيكلة بصيغة صارمة.' },
  { n: '03', t: 'استعرض بطاقاتك', d: 'تتحول الخطة فوراً إلى بطاقات تفاعلية مقسّمة بالأيام والفئات.' },
];

/** أقسام ثابتة — Server Component بالكامل، صفر JS على العميل. */
export function FeatureShowcase() {
  return (
    <div className="canvas relative pb-36">
      {/* ---------- الفئات ---------- */}
      <section id="features" className="mx-auto max-w-[1500px] px-5 pb-16 sm:px-8 lg:px-14">
        <header className="mx-auto mb-12 max-w-2xl text-center">
          <p className="t-eyebrow mb-3 text-primary">ما الذي ستحصل عليه</p>
          <h2 className="t-h1 text-balance">كل ما تحتاجه لتجربة سفر ممتعة</h2>
        </header>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map(({ icon: Icon, title, body }) => (
            <article key={title} className="card-warm card-warm-hover p-6">
              <div className="mb-5 grid size-12 place-items-center rounded-2xl bg-primary/10">
                <Icon className="size-5 text-primary" />
              </div>
              <h3 className="t-h3 mb-2">{title}</h3>
              <p className="t-sm text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ---------- كيف يعمل ---------- */}
      <section id="how" className="mx-auto max-w-[1500px] px-5 pb-8 sm:px-8 lg:px-14">
        <div className="card-warm grid overflow-hidden lg:grid-cols-2">
          {/* صورة */}
          <div className="relative min-h-[320px] lg:min-h-[520px]">
            <Image
              src={unsplash('photo-1476514525535-07fb3b4ae5f1', 1000, 1100)}
              alt="قارب خشبي على بحيرة جبلية"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/60 to-transparent lg:bg-gradient-to-l" />
            <div className="absolute inset-x-8 bottom-8 text-white lg:inset-x-10">
              <p className="t-eyebrow mb-2 text-sand-300">TripGo</p>
              <p className="font-display text-2xl leading-snug lg:text-3xl">خطّط أقل، عِش أكثر.</p>
            </div>
          </div>

          {/* الخطوات */}
          <div className="flex flex-col justify-center gap-8 p-8 lg:p-14">
            <div>
              <p className="t-eyebrow mb-3 text-primary">كيف يعمل</p>
              <h2 className="t-h1 text-balance">من فكرة غامضة إلى خطة قابلة للتنفيذ في أقل من دقيقة</h2>
              <p className="mt-4 t-body text-muted-foreground">
                لا نطلب منك ملء عشرين حقلاً. أخبرنا بالوجهة والميزانية وما يهمّك، والباقي علينا.
              </p>
            </div>

            <ol className="space-y-3">
              {STEPS.map((s) => (
                <li key={s.n} className="flex gap-5 rounded-2xl bg-secondary/60 p-5">
                  <span className="num text-xl font-light text-primary/70">{s.n}</span>
                  <div>
                    <h3 className="font-semibold">{s.t}</h3>
                    <p className="mt-1 t-sm text-muted-foreground">{s.d}</p>
                  </div>
                </li>
              ))}
            </ol>

            <Link
              href="/plan/new"
              className="inline-flex w-fit items-center gap-2.5 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:-translate-y-0.5 hover:brightness-110"
            >
              أنشئ خطتي الأولى
              <ArrowLeft className="size-4" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
