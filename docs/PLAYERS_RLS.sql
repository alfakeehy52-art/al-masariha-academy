-- =====================================================
-- سياسات RLS لجدول players + بحث محدود للعامة (ولي الأمر)
-- نفّذ في Supabase SQL Editor
-- =====================================================

alter table public.players enable row level security;

drop policy if exists "players_all" on public.players;
drop policy if exists "Enable read access for all users" on public.players;
drop policy if exists "Public read players" on public.players;
drop policy if exists "allow_all_players" on public.players;
drop policy if exists players_select on public.players;
drop policy if exists players_insert on public.players;
drop policy if exists players_update on public.players;
drop policy if exists players_delete on public.players;

-- ─── الإدارة: إدارة كاملة ───
drop policy if exists admin_manage_players on public.players;
create policy admin_manage_players on public.players
  for all to authenticated
  using (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  )
  with check (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  );

-- ─── عامة: قراءة اللاعبين النشطين (صفحة اللاعبين + الرئيسية) ───
drop policy if exists players_public_select on public.players;
create policy players_public_select on public.players
  for select to anon, authenticated
  using (
    coalesce(status, '') in ('active', 'نشط', 'مكتمل')
    or coalesce(player_status, '') in ('active', 'نشط', 'معتمد', 'مكتمل')
  );

-- ─── بحث محدود للعامة (ربط ولي أمر بلاعب في صفحة الانضمام) ───
create or replace function public.search_players_public(p_term text)
returns table (
  id uuid,
  full_name text,
  code text,
  phone text,
  category text,
  "position" text,
  team text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.id,
    p.full_name,
    p.code,
    p.phone,
    p.category,
    p."position",
    p.team
  from public.players p
  where nullif(trim(p_term), '') is not null
    and length(trim(p_term)) >= 1
    and (
      p.full_name ilike '%' || trim(p_term) || '%'
      or p.code ilike '%' || trim(p_term) || '%'
      or p.phone ilike '%' || trim(p_term) || '%'
    )
  order by p.full_name nulls last
  limit 8;
$$;

revoke all on function public.search_players_public(text) from public;
grant execute on function public.search_players_public(text) to anon, authenticated;
