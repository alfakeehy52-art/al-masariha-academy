-- =====================================================
-- سياسات RLS لجدول academy_staff (نفّذ في Supabase SQL Editor)
-- =====================================================
-- يقيّد الكادر لسجله فقط، ويُبقي وصول الإدارة (role=admin).

alter table public.academy_staff enable row level security;

-- إزالة سياسات مفتوحة شائعة (نفّذ ما ينطبق على مشروعك)
drop policy if exists "academy_staff_all" on public.academy_staff;
drop policy if exists "Enable read access for all users" on public.academy_staff;
drop policy if exists "Enable insert for authenticated users only" on public.academy_staff;
drop policy if exists "Enable update for users based on email" on public.academy_staff;
drop policy if exists "Public read academy_staff" on public.academy_staff;
drop policy if exists "allow_all_academy_staff" on public.academy_staff;

-- ─── الكادر: قراءة سجله بعد الربط ───
drop policy if exists staff_select_own on public.academy_staff;
create policy staff_select_own on public.academy_staff
  for select to authenticated
  using (auth.uid() = auth_user_id);

-- ─── الكادر: قبل الربط — قراءة السجل بنفس البريد (للتفعيل) ───
drop policy if exists staff_select_pending_email on public.academy_staff;
create policy staff_select_pending_email on public.academy_staff
  for select to authenticated
  using (
    auth_user_id is null
    and email is not null
    and lower(trim(email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
  );

-- ─── الكادر: ربط auth_user_id عند أول تفعيل ───
drop policy if exists staff_update_link_auth on public.academy_staff;
create policy staff_update_link_auth on public.academy_staff
  for update to authenticated
  using (
    auth_user_id is null
    and status = 'active'
    and email is not null
    and lower(trim(email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
  )
  with check (auth_user_id = auth.uid());

-- ─── الإدارة: إدارة كاملة لجدول الكوادر ───
drop policy if exists admin_manage_academy_staff on public.academy_staff;
create policy admin_manage_academy_staff on public.academy_staff
  for all to authenticated
  using (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  )
  with check (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  );

-- ملاحظة: إدراج طلبات الانضمام (join_requests) يبقى بسياساته الخاصة.
-- anon insert للطلبات العامة لا يزال منفصلاً عن هذا الملف.
