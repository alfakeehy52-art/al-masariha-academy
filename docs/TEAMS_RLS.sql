-- =====================================================
-- جدول teams + سياسات RLS + قراءة عامة لصفحة الفرق
-- نفّذ في Supabase SQL Editor (بعد STORE_PRODUCTS_RLS.sql)
-- =====================================================

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  status text not null default 'نشط',
  code text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists teams_status_idx on public.teams (status);
create index if not exists teams_category_idx on public.teams (category);

alter table public.teams enable row level security;

drop policy if exists "teams_all" on public.teams;
drop policy if exists teams_select on public.teams;
drop policy if exists teams_insert on public.teams;
drop policy if exists teams_update on public.teams;
drop policy if exists teams_delete on public.teams;
drop policy if exists admin_manage_teams on public.teams;
drop policy if exists teams_public_select on public.teams;

create policy admin_manage_teams on public.teams
  for all to authenticated
  using (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  )
  with check (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  );

-- عامة: فرق نشطة فقط (لا تظهر «مراجعة» أو «موقوف» للزوار)
create policy teams_public_select on public.teams
  for select to anon, authenticated
  using (
    coalesce(status, 'نشط') in ('نشط', 'active', 'مكتمل')
  );

create or replace function public.list_teams_public()
returns table (
  id uuid,
  name text,
  category text,
  status text,
  code text,
  notes text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    t.id,
    t.name,
    t.category,
    t.status,
    t.code,
    t.notes,
    t.created_at
  from public.teams t
  where coalesce(t.status, 'نشط') in ('نشط', 'active', 'مكتمل')
  order by t.category nulls last, t.name nulls last;
$$;

revoke all on function public.list_teams_public() from public;
grant execute on function public.list_teams_public() to anon, authenticated;
