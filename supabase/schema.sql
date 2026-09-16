-- ============================================================
-- TripGo — مخطط قاعدة البيانات (نفّذه في Supabase SQL Editor)
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- 1) ملفات المستخدمين ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  home_city   text,
  currency    text default 'SAR',
  -- التفضيلات الافتراضية المُلتقطة في Onboarding
  preferences jsonb default '{}'::jsonb,
  onboarded   boolean default false,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ---------- 2) الرحلات ----------
create table if not exists public.trips (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  destination text not null,
  start_date  date,
  end_date    date,
  cover_image text,
  preferences jsonb not null default '{}'::jsonb,
  itinerary   jsonb not null,           -- مخرجات LLM بعد التحقق
  status      text not null default 'planned'
              check (status in ('draft','planned','completed')),
  model_used  text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index if not exists trips_user_created_idx on public.trips (user_id, created_at desc);

-- ---------- 3) المحادثات ----------
create table if not exists public.conversations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  trip_id    uuid references public.trips(id) on delete set null,
  title      text default 'محادثة جديدة',
  created_at timestamptz default now()
);

create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role            text not null check (role in ('user','assistant')),
  content         text not null,
  created_at      timestamptz default now()
);

create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at);

-- ============================================================
-- Row Level Security — كل مستخدم يرى بياناته فقط
-- ============================================================
alter table public.profiles      enable row level security;
alter table public.trips         enable row level security;
alter table public.conversations enable row level security;
alter table public.messages      enable row level security;

drop policy if exists "profiles owner" on public.profiles;
create policy "profiles owner" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "trips owner" on public.trips;
create policy "trips owner" on public.trips
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "conversations owner" on public.conversations;
create policy "conversations owner" on public.conversations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "messages owner" on public.messages;
create policy "messages owner" on public.messages
  for all using (
    exists (select 1 from public.conversations c
            where c.id = conversation_id and c.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.conversations c
            where c.id = conversation_id and c.user_id = auth.uid())
  );

-- ============================================================
-- إنشاء ملف شخصي تلقائياً عند التسجيل عبر OAuth
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- تحديث updated_at تلقائياً
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists trips_touch on public.trips;
create trigger trips_touch before update on public.trips
  for each row execute function public.touch_updated_at();
