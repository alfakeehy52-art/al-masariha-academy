-- =====================================================
-- جداول academy_news + academy_media + RLS + قراءة عامة (C1b)
-- نفّذ في Supabase SQL Editor (بعد MATCHES_RLS.sql)
-- =====================================================

-- ---------- الأخبار ----------
create table if not exists public.academy_news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text,
  body text,
  category text,
  emoji text not null default '📰',
  image_url text,
  published_at timestamptz,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.academy_news add column if not exists title text;
alter table public.academy_news add column if not exists summary text;
alter table public.academy_news add column if not exists body text;
alter table public.academy_news add column if not exists category text;
alter table public.academy_news add column if not exists emoji text not null default '📰';
alter table public.academy_news add column if not exists image_url text;
alter table public.academy_news add column if not exists published_at timestamptz;
alter table public.academy_news add column if not exists status text not null default 'draft';
alter table public.academy_news add column if not exists is_featured boolean not null default false;
alter table public.academy_news add column if not exists created_at timestamptz not null default now();
alter table public.academy_news add column if not exists updated_at timestamptz not null default now();

create index if not exists academy_news_status_idx on public.academy_news (status);
create index if not exists academy_news_published_idx on public.academy_news (published_at desc nulls last);
create index if not exists academy_news_featured_idx on public.academy_news (is_featured) where is_featured = true;

-- ---------- الإعلام ----------
create table if not exists public.academy_media (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  media_type text not null default 'photo'
    check (media_type in ('photo', 'video')),
  emoji text not null default '📷',
  image_url text,
  video_url text,
  published_at timestamptz,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  sort_order integer not null default 0,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.academy_media add column if not exists title text;
alter table public.academy_media add column if not exists description text;
alter table public.academy_media add column if not exists media_type text not null default 'photo';
alter table public.academy_media add column if not exists emoji text not null default '📷';
alter table public.academy_media add column if not exists image_url text;
alter table public.academy_media add column if not exists video_url text;
alter table public.academy_media add column if not exists published_at timestamptz;
alter table public.academy_media add column if not exists status text not null default 'draft';
alter table public.academy_media add column if not exists sort_order integer not null default 0;
alter table public.academy_media add column if not exists is_featured boolean not null default false;
alter table public.academy_media add column if not exists created_at timestamptz not null default now();
alter table public.academy_media add column if not exists updated_at timestamptz not null default now();

create index if not exists academy_media_status_idx on public.academy_media (status);
create index if not exists academy_media_type_idx on public.academy_media (media_type);
create index if not exists academy_media_published_idx on public.academy_media (published_at desc nulls last);

create or replace function public.content_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists academy_news_updated_at on public.academy_news;
create trigger academy_news_updated_at
  before update on public.academy_news
  for each row execute function public.content_set_updated_at();

drop trigger if exists academy_media_updated_at on public.academy_media;
create trigger academy_media_updated_at
  before update on public.academy_media
  for each row execute function public.content_set_updated_at();

alter table public.academy_news enable row level security;
alter table public.academy_media enable row level security;

-- تنظيف سياسات قديمة محتملة
drop policy if exists "academy_news_all" on public.academy_news;
drop policy if exists "Allow all academy_news" on public.academy_news;
drop policy if exists academy_dev_news_all on public.academy_news;
drop policy if exists admin_manage_academy_news on public.academy_news;
drop policy if exists academy_news_public_select on public.academy_news;

drop policy if exists "academy_media_all" on public.academy_media;
drop policy if exists "Allow all academy_media" on public.academy_media;
drop policy if exists academy_dev_media_all on public.academy_media;
drop policy if exists admin_manage_academy_media on public.academy_media;
drop policy if exists academy_media_public_select on public.academy_media;

create policy admin_manage_academy_news on public.academy_news
  for all to authenticated
  using (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  )
  with check (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  );

create policy academy_news_public_select on public.academy_news
  for select to anon, authenticated
  using (status = 'published');

create policy admin_manage_academy_media on public.academy_media
  for all to authenticated
  using (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  )
  with check (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  );

create policy academy_media_public_select on public.academy_media
  for select to anon, authenticated
  using (status = 'published');

create or replace function public.list_news_public()
returns table (
  id uuid,
  title text,
  summary text,
  body text,
  category text,
  emoji text,
  image_url text,
  published_at timestamptz,
  is_featured boolean,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    n.id,
    n.title,
    n.summary,
    n.body,
    n.category,
    n.emoji,
    n.image_url,
    n.published_at,
    n.is_featured,
    n.created_at
  from public.academy_news n
  where n.status = 'published'
    and trim(coalesce(n.title, '')) <> 'اختبار'
  order by n.is_featured desc, n.published_at desc nulls last, n.created_at desc;
$$;

create or replace function public.get_news_public(p_id uuid)
returns table (
  id uuid,
  title text,
  summary text,
  body text,
  category text,
  emoji text,
  image_url text,
  published_at timestamptz,
  is_featured boolean,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    n.id,
    n.title,
    n.summary,
    n.body,
    n.category,
    n.emoji,
    n.image_url,
    n.published_at,
    n.is_featured,
    n.created_at
  from public.academy_news n
  where n.id = p_id
    and n.status = 'published'
    and trim(coalesce(n.title, '')) <> 'اختبار';
$$;

create or replace function public.list_media_public()
returns table (
  id uuid,
  title text,
  description text,
  media_type text,
  emoji text,
  image_url text,
  video_url text,
  published_at timestamptz,
  is_featured boolean,
  sort_order integer,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    m.id,
    m.title,
    m.description,
    m.media_type,
    m.emoji,
    m.image_url,
    m.video_url,
    m.published_at,
    m.is_featured,
    m.sort_order,
    m.created_at
  from public.academy_media m
  where m.status = 'published'
  order by m.is_featured desc, m.sort_order asc, m.published_at desc nulls last, m.created_at desc;
$$;

revoke all on function public.list_news_public() from public;
grant execute on function public.list_news_public() to anon, authenticated;
revoke all on function public.get_news_public(uuid) from public;
grant execute on function public.get_news_public(uuid) to anon, authenticated;
revoke all on function public.list_media_public() from public;
grant execute on function public.list_media_public() to anon, authenticated;
