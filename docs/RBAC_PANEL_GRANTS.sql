-- =====================================================
-- RBAC v1 — صلاحيات لوحة الإدارة (Level × Domain)
-- نفّذ في Supabase → SQL Editor (مرة واحدة)
-- =====================================================

alter table public.academy_staff add column if not exists panel_level text not null default 'L4';
alter table public.academy_staff add column if not exists panel_domains jsonb not null default '["requests"]'::jsonb;
alter table public.academy_staff add column if not exists job_title_ar text;
alter table public.academy_staff add column if not exists panel_template text;

alter table public.academy_staff drop constraint if exists academy_staff_panel_level_check;
alter table public.academy_staff
  add constraint academy_staff_panel_level_check
  check (panel_level in ('L1', 'L2', 'L3', 'L4', 'L5'));

comment on column public.academy_staff.panel_level is 'L1=تنفيذي … L5=مشاهدة';
comment on column public.academy_staff.panel_domains is 'مصفوفة JSON: requests, members, store, media, support, ops, system أو *';
comment on column public.academy_staff.job_title_ar is 'المسمى المعروض: مدير الطلبات، موظف دعم…';
comment on column public.academy_staff.panel_template is 'مفتاح قالب من panel-rbac.js';

-- المدير العام الحالي (عدّل البريد إن لزم):
-- update public.academy_staff
-- set panel_level = 'L1', panel_domains = '["*"]'::jsonb, job_title_ar = 'المدير العام', role = 'admin'
-- where lower(email) = lower('alfakeehy52@gmail.com');
