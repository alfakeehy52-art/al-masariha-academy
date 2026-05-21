-- =====================================================
-- تنظيف سياسات academy_members القديمة (بعد ACADEMY_MEMBERS_RLS.sql)
-- المطلوب: سياسة واحدة فقط — admin_manage_academy_members
-- =====================================================

drop policy if exists "Allow admin read academy members" on public.academy_members;
drop policy if exists "Allow admin update academy members" on public.academy_members;
drop policy if exists "Allow anon read academy members for admin dashboard" on public.academy_members;
drop policy if exists "Allow anon update academy members for admin dashboard" on public.academy_members;
drop policy if exists "Allow public academy member registration" on public.academy_members;

-- سياسات أسماء بديلة محتملة
drop policy if exists academy_members_select on public.academy_members;
drop policy if exists academy_members_insert on public.academy_members;
drop policy if exists academy_members_update on public.academy_members;
drop policy if exists academy_members_delete on public.academy_members;
drop policy if exists "academy_members_all" on public.academy_members;
drop policy if exists "Enable read access for all users" on public.academy_members;
drop policy if exists "Public read academy_members" on public.academy_members;
drop policy if exists "allow_all_academy_members" on public.academy_members;

-- تأكيد السياسة الصحيحة
drop policy if exists admin_manage_academy_members on public.academy_members;
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
