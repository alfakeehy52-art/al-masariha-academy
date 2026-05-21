-- =====================================================
-- جدول academy_members + سياسات RLS (إدارة فقط — بيانات خاصة)
-- نفّذ في Supabase SQL Editor (بعد TEAMS_RLS.sql)
-- =====================================================
--
-- تحقق سريع بعد التنفيذ:
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'academy_members'
-- ORDER BY ordinal_position;
--
-- SELECT tablename, policyname, cmd FROM pg_policies
-- WHERE tablename = 'academy_members';

create table if not exists public.academy_members (
  id uuid primary key default gen_random_uuid(),
  source_request_id uuid references public.join_requests (id) on delete set null,
  member_code text,
  full_name text,
  phone text,
  email text,
  city text,
  national_id text,
  interests jsonb not null default '[]'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'suspended')),
  email_verified boolean not null default false,
  notes text,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.academy_members add column if not exists source_request_id uuid;
alter table public.academy_members add column if not exists member_code text;
alter table public.academy_members add column if not exists full_name text;
alter table public.academy_members add column if not exists phone text;
alter table public.academy_members add column if not exists email text;
alter table public.academy_members add column if not exists city text;
alter table public.academy_members add column if not exists national_id text;
alter table public.academy_members add column if not exists interests jsonb not null default '[]'::jsonb;
alter table public.academy_members add column if not exists status text not null default 'pending';
alter table public.academy_members add column if not exists email_verified boolean not null default false;
alter table public.academy_members add column if not exists notes text;
alter table public.academy_members add column if not exists approved_at timestamptz;
alter table public.academy_members add column if not exists created_at timestamptz not null default now();
alter table public.academy_members add column if not exists updated_at timestamptz not null default now();

create unique index if not exists academy_members_source_request_uidx
  on public.academy_members (source_request_id)
  where source_request_id is not null;

create unique index if not exists academy_members_member_code_uidx
  on public.academy_members (member_code)
  where member_code is not null and member_code <> '';

create index if not exists academy_members_status_idx on public.academy_members (status);
create index if not exists academy_members_created_idx on public.academy_members (created_at desc);

-- FK اختياري إن لم تكن موجودة
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'academy_members_source_request_id_fkey'
      and conrelid = 'public.academy_members'::regclass
  ) then
    alter table public.academy_members
      add constraint academy_members_source_request_id_fkey
      foreign key (source_request_id) references public.join_requests (id) on delete set null;
  end if;
exception
  when others then null;
end $$;

create or replace function public.academy_members_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists academy_members_updated_at on public.academy_members;
create trigger academy_members_updated_at
  before update on public.academy_members
  for each row execute function public.academy_members_set_updated_at();

create or replace function public.academy_members_set_code()
returns trigger
language plpgsql
as $$
begin
  if new.member_code is null or btrim(new.member_code) = '' then
    new.member_code := 'MEM-' || upper(substr(replace(new.id::text, '-', ''), 1, 6));
  end if;
  return new;
end;
$$;

drop trigger if exists academy_members_set_code on public.academy_members;
create trigger academy_members_set_code
  before insert on public.academy_members
  for each row execute function public.academy_members_set_code();

alter table public.academy_members enable row level security;

-- إزالة سياسات مفتوحة / قديمة
drop policy if exists "academy_members_all" on public.academy_members;
drop policy if exists "Enable read access for all users" on public.academy_members;
drop policy if exists "Public read academy_members" on public.academy_members;
drop policy if exists "allow_all_academy_members" on public.academy_members;
drop policy if exists academy_members_select on public.academy_members;
drop policy if exists academy_members_insert on public.academy_members;
drop policy if exists academy_members_update on public.academy_members;
drop policy if exists academy_members_delete on public.academy_members;
drop policy if exists admin_manage_academy_members on public.academy_members;
drop policy if exists "Allow admin read academy members" on public.academy_members;
drop policy if exists "Allow admin update academy members" on public.academy_members;
drop policy if exists "Allow anon read academy members for admin dashboard" on public.academy_members;
drop policy if exists "Allow anon update academy members for admin dashboard" on public.academy_members;
drop policy if exists "Allow public academy member registration" on public.academy_members;

-- ─── الإدارة فقط: لا قراءة عامة (بيانات شخصية) ───
create policy admin_manage_academy_members on public.academy_members
  for all to authenticated
  using (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  )
  with check (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  );
