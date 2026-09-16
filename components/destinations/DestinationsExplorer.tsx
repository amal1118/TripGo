'use client';

/**
 * DestinationsExplorer — محرّك التصفية في صفحة كل الوجهات.
 *
 * التصفية كلها على العميل: عشرون وجهة لا تستحق طلب شبكة لكل ضغطة شريحة،
 * والنتيجة فورية بلا حالة تحميل. منطق التصفية نفسه المستخدم في صفحة
 * الهبوط (filterDestinations) فلا يتفرّع سلوك البحث بين الشاشتين.
 */

import * as React from 'react';
import { Search, X, SlidersHorizontal, Mountain, Waves, Landmark, Users, Leaf, Compass } from 'lucide-react';
import {
  DESTINATIONS, ALL_REGIONS, EXPLORE_CATEGORIES, filterDestinations,
} from '@/lib/destinations';
import { DestinationCard } from '@/components/destinations/DestinationCard';
import { cn } from '@/lib/utils';

const ICONS = {
  compass: Compass, mountain: Mountain, waves: Waves,
  landmark: Landmark, users: Users, leaf: Leaf,
} as const;

type SortKey = 'popular' | 'price-asc' | 'price-desc';

const SORTS: { id: SortKey; label: string }[] = [
  { id: 'popular', label: 'الأعلى تقييماً' },
  { id: 'price-asc', label: 'الأقل سعراً' },
  { id: 'price-desc', label: 'الأعلى سعراً' },
];

export function DestinationsExplorer() {
  const [query, setQuery] = React.useState('');
  const [region, setRegion] = React.useState('الكل');
  const [category, setCategory] = React.useState<string>('all');
  const [sort, setSort] = React.useState<SortKey>('popular');

  const results = React.useMemo(() => {
    const list = filterDestinations(DESTINATIONS, { category, region, query });
    return list.slice().sort((a, b) => {
      if (sort === 'price-asc') return a.priceFrom - b.priceFrom;
      if (sort === 'price-desc') return b.priceFrom - a.priceFrom;
      return b.rating - a.rating;
    });
  }, [category, region, query, sort]);

  const dirty = query !== '' || region !== 'الكل' || category !== 'all';
  const reset = React.useCallback(() => {
    setQuery(''); setRegion('الكل'); setCategory('all'); setSort('popular');
  }, []);

  return (
    <>
      {/* ---------- أدوات التصفية ---------- */}
      <div className="card-warm mb-8 p-5 shadow-card sm:p-6">
        {/* البحث */}
        <div className="flex items-center gap-3 rounded-full border border-border/70 bg-secondary/60 px-4 py-3">
          <Search className="size-5 shrink-0 text-primary" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث باسم الوجهة أو البلد…"
            aria-label="ابحث في الوجهات"
            className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="مسح البحث"
              className="grid size-7 shrink-0 place-items-center rounded-full bg-background text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* الفئات */}
        <div className="scrollbar-none -mx-1 mt-5 flex items-center gap-2 overflow-x-auto px-1 pb-1">
          {EXPLORE_CATEGORIES.map((c) => {
            const Icon = ICONS[c.icon];
            const on = category === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                aria-pressed={on}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2.5 text-[13px] font-semibold transition-all active:scale-95',
                  on
                    ? 'bg-primary text-primary-foreground shadow-glow'
                    : 'bg-secondary text-secondary-foreground hover:bg-accent',
                )}
              >
                <Icon className="size-4" />
                {c.label}
              </button>
            );
          })}
        </div>

        {/* المناطق */}
        <div className="scrollbar-none -mx-1 mt-3 flex items-center gap-2 overflow-x-auto px-1 pb-1">
          {ALL_REGIONS.map((r) => {
            const on = region === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setRegion(r)}
                aria-pressed={on}
                className={cn(
                  'shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-[13px] font-medium transition-all active:scale-95',
                  on
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:bg-secondary',
                )}
              >
                {r}
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------- شريط النتائج ---------- */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="t-sm text-muted-foreground">
          <span className="num font-bold text-foreground">{results.length}</span>
          {' '}
          من أصل <span className="num">{DESTINATIONS.length}</span> وجهة
          {dirty && (
            <button type="button" onClick={reset} className="ms-3 font-semibold text-primary hover:underline">
              إعادة التعيين
            </button>
          )}
        </p>

        <label className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 t-sm">
          <SlidersHorizontal className="size-4 text-muted-foreground" />
          <span className="sr-only">ترتيب النتائج</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="bg-transparent pe-1 text-[13px] font-medium outline-none"
          >
            {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
      </div>

      {/* ---------- الشبكة ---------- */}
      {results.length ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((d, i) => (
            <DestinationCard key={d.id} destination={d} priority={i < 3} />
          ))}
        </div>
      ) : (
        <div className="card-warm grid place-items-center gap-3 p-14 text-center">
          <div className="grid size-14 place-items-center rounded-2xl bg-primary/10">
            <Compass className="size-6 text-primary" />
          </div>
          <p className="t-h3">لا وجهة تطابق هذا البحث</p>
          <p className="t-sm text-muted-foreground">جرّب كلمة أعمّ، أو أعد ضبط التصفية لعرض الوجهات العشرين.</p>
          <button
            type="button"
            onClick={reset}
            className="mt-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:brightness-110"
          >
            إعادة التعيين
          </button>
        </div>
      )}
    </>
  );
}
