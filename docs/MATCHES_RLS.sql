-- =====================================================
-- جدول matches + RLS + قراءة عامة (C1)
-- نفّذ في Supabase SQL Editor (بعد COMMUNITY_ENTITIES_RLS.sql)
-- =====================================================

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  home_team text not null default 'أكاديمية المسارحة',
  away_team text not null,
  home_score integer,
  away_score integer,
  match_at timestamptz,
  venue text,
  competition text,
  status text not null default 'upcoming'
    check (status in ('draft', 'upcoming', 'live', 'finished', 'cancelled')),
  scorers_note text,
  player_of_match text,
  stats jsonb not null default '{}'::jsonb,
  video_url text,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.matches add column if not exists home_team text not null default 'أكاديمية المسارحة';
alter table public.matches add column if not exists away_team text;
alter table public.matches add column if not exists home_score integer;
alter table public.matches add column if not exists away_score integer;
alter table public.matches add column if not exists match_at timestamptz;
alter table public.matches add column if not exists venue text;
alter table public.matches add column if not exists competition text;
alter table public.matches add column if not exists status text not null default 'upcoming';
alter table public.matches add column if not exists scorers_note text;
alter table public.matches add column if not exists player_of_match text;
alter table public.matches add column if not exists stats jsonb not null default '{}'::jsonb;
alter table public.matches add column if not exists video_url text;
alter table public.matches add column if not exists is_featured boolean not null default false;
alter table public.matches add column if not exists created_at timestamptz not null default now();
alter table public.matches add column if not exists updated_at timestamptz not null default now();

create index if not exists matches_status_idx on public.matches (status);
create index if not exists matches_match_at_idx on public.matches (match_at desc nulls last);
create index if not exists matches_featured_idx on public.matches (is_featured) where is_featured = true;

create or replace function public.matches_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists matches_updated_at on public.matches;
create trigger matches_updated_at
  before update on public.matches
  for each row execute function public.matches_set_updated_at();

alter table public.matches enable row level security;

drop policy if exists "matches_all" on public.matches;
drop policy if exists matches_select on public.matches;
drop policy if exists matches_insert on public.matches;
drop policy if exists matches_update on public.matches;
drop policy if exists matches_delete on public.matches;
drop policy if exists "Allow all matches" on public.matches;
drop policy if exists academy_dev_matches_all on public.matches;
drop policy if exists admin_manage_matches on public.matches;
drop policy if exists matches_public_select on public.matches;

create policy admin_manage_matches on public.matches
  for all to authenticated
  using (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  )
  with check (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  );

create policy matches_public_select on public.matches
  for select to anon, authenticated
  using (status in ('upcoming', 'live', 'finished'));

create or replace function public.list_matches_public()
returns table (
  id uuid,
  home_team text,
  away_team text,
  home_score integer,
  away_score integer,
  match_at timestamptz,
  venue text,
  competition text,
  status text,
  is_featured boolean,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    m.id,
    m.home_team,
    m.away_team,
    m.home_score,
    m.away_score,
    m.match_at,
    m.venue,
    m.competition,
    m.status,
    m.is_featured,
    m.created_at
  from public.matches m
  where m.status in ('upcoming', 'live', 'finished')
  order by
    case m.status when 'live' then 0 when 'upcoming' then 1 else 2 end,
    m.match_at asc nulls last,
    m.created_at desc;
$$;

create or replace function public.get_match_public(p_id uuid)
returns table (
  id uuid,
  home_team text,
  away_team text,
  home_score integer,
  away_score integer,
  match_at timestamptz,
  venue text,
  competition text,
  status text,
  scorers_note text,
  player_of_match text,
  stats jsonb,
  video_url text,
  is_featured boolean,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    m.id,
    m.home_team,
    m.away_team,
    m.home_score,
    m.away_score,
    m.match_at,
    m.venue,
    m.competition,
    m.status,
    m.scorers_note,
    m.player_of_match,
    m.stats,
    m.video_url,
    m.is_featured,
    m.created_at
  from public.matches m
  where m.id = p_id
    and m.status in ('upcoming', 'live', 'finished');
$$;

revoke all on function public.list_matches_public() from public;
grant execute on function public.list_matches_public() to anon, authenticated;
revoke all on function public.get_match_public(uuid) from public;
grant execute on function public.get_match_public(uuid) to anon, authenticated;
