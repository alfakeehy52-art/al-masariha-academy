-- =====================================================
-- توسيع صلاحية النظام في academy_staff (مرحلة R2)
-- نفّذ في Supabase → SQL Editor
-- =====================================================

alter table public.academy_staff drop constraint if exists academy_staff_role_check;

alter table public.academy_staff
  add constraint academy_staff_role_check
  check (role in (
    'staff',
    'manager',
    'admin',
    'supervisor',
    'viewer',
    'coach'
  ));

-- تحقق:
-- select distinct role from public.academy_staff;
