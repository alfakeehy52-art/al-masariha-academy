-- =====================================================
-- المرحلة C — توسيع أدوار لوحة الإدارة في academy_staff
-- نفّذ في Supabase → SQL Editor (مرة واحدة)
-- =====================================================

alter table public.academy_staff add column if not exists role text not null default 'staff';

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
-- select distinct role from public.academy_staff order by 1;
