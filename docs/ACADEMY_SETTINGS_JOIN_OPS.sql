-- حقول إضافية لإعدادات الأكاديمية: إيقاف التقديم + أدوار كادر مخصصة
-- نفّذ في Supabase SQL Editor بعد ACADEMY_SETTINGS_RLS.sql

alter table public.academy_settings add column if not exists join_closed_all boolean not null default false;
alter table public.academy_settings add column if not exists join_closed_types text not null default '[]';
alter table public.academy_settings add column if not exists join_closed_message_ar text not null default 'التقديم متوقف مؤقتاً. تواصل مع إدارة الأكاديمية.';
alter table public.academy_settings add column if not exists custom_staff_roles_json text not null default '[]';

-- تحقق:
-- select join_closed_all, join_closed_types, custom_staff_roles_json from public.academy_settings where id = 'default';
