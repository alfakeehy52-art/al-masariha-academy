-- =====================================================
-- سياسات RLS لجدول coaches + قراءة عامة للواجهة العامة
-- نفّذ في Supabase SQL Editor (بعد PLAYERS_RLS.sql)
-- =====================================================

-- تحقق سريع: يجب أن يظهر جدول coaches
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'coaches' ORDER BY ordinal_position;

alter table public.coaches enable row level security;

-- إزالة سياسات مفتوحة / قديمة
drop policy if exists "coaches_all" on public.coaches;
drop policy if exists "Enable read access for all users" on public.coaches;
drop policy if exists "Public read coaches" on public.coaches;
drop policy if exists "allow_all_coaches" on public.coaches;
drop policy if exists coaches_select on public.coaches;
drop policy if exists coaches_insert on public.coaches;
drop policy if exists coaches_update on public.coaches;
drop policy if exists coaches_delete on public.coaches;
drop policy if exists academy_dev_coaches_all on public.coaches;

-- ─── الإدارة: إدارة كاملة ───
drop policy if exists admin_manage_coaches on public.coaches;
create policy admin_manage_coaches on public.coaches
  for all to authenticated
  using (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  )
  with check (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  );

-- ─── عامة: قراءة المدربين النشطين فقط (صفحة المدربين + الرئيسية) ───
drop policy if exists coaches_public_select on public.coaches;
create policy coaches_public_select on public.coaches
  for select to anon, authenticated
  using (
    coalesce(status, 'نشط') in ('نشط', 'مكتمل', 'active')
  );

-- ─── قائمة المدربين للواجهة العامة (نسخة احتياطية عبر RPC) ───
create or replace function public.list_coaches_public()
returns table (
  id uuid,
  full_name text,
  job_title text,
  specialty text,
  category text,
  experience_years integer,
  certification text,
  phone text,
  status text,
  bio text,
  image text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    c.id,
    c.full_name,
    c.job_title,
    c.specialty,
    c.category,
    c.experience_years,
    c.certification,
    c.phone,
    c.status,
    c.bio,
    c.image,
    c.created_at
  from public.coaches c
  where coalesce(c.status, 'نشط') in ('نشط', 'مكتمل', 'active')
  order by c.created_at desc nulls last;
$$;

revoke all on function public.list_coaches_public() from public;
grant execute on function public.list_coaches_public() to anon, authenticated;

-- ─── ملف مدرب واحد بالمعرّف (صفحة الملف العام) ───
create or replace function public.get_coach_public(p_id uuid)
returns table (
  id uuid,
  full_name text,
  job_title text,
  specialty text,
  category text,
  experience_years integer,
  certification text,
  phone text,
  status text,
  bio text,
  image text,
  notes text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    c.id,
    c.full_name,
    c.job_title,
    c.specialty,
    c.category,
    c.experience_years,
    c.certification,
    c.phone,
    c.status,
    c.bio,
    c.image,
    c.notes,
    c.created_at
  from public.coaches c
  where c.id = p_id
    and coalesce(c.status, 'نشط') in ('نشط', 'مكتمل', 'active')
  limit 1;
$$;

revoke all on function public.get_coach_public(uuid) from public;
grant execute on function public.get_coach_public(uuid) to anon, authenticated;
