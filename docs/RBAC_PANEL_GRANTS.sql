-- =====================================================
-- RBAC v1 — صلاحيات لوحة الإدارة (Level × Domain)
-- نفّذ في Supabase → SQL Editor (مرة واحدة)
-- =====================================================

alter table public.academy_staff add column if not exists job_title text;
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

-- المدير العام — نفّذ مرة واحدة (عدّل البريد/الجوال إن لزم):
insert into public.academy_staff (
  full_name, email, phone, staff_type, staff_category, status, role,
  panel_level, panel_domains, job_title_ar
)
values (
  'حسين سلمان فقيهي', 'alfakeehy52@gmail.com', '0500000000', 'general_manager', 'admin',
  'active', 'admin', 'L1', '["*"]'::jsonb, 'المدير العام'
)
on conflict (email) do update set
  full_name = excluded.full_name,
  panel_level = excluded.panel_level,
  panel_domains = excluded.panel_domains,
  job_title_ar = excluded.job_title_ar,
  role = excluded.role,
  status = excluded.status,
  updated_at = now();

-- ─── سياسات RLS إضافية (مرة واحدة) ───
-- نفّذ أيضاً إن لم تكن موجودة من docs/STAFF_AUTH_RLS.sql

drop policy if exists staff_insert_bootstrap_own on public.academy_staff;
create policy staff_insert_bootstrap_own on public.academy_staff
  for insert to authenticated
  with check (
    auth_user_id = auth.uid()
    and email is not null
    and lower(trim(email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
  );

drop policy if exists staff_update_own_profile on public.academy_staff;
create policy staff_update_own_profile on public.academy_staff
  for update to authenticated
  using (auth.uid() = auth_user_id)
  with check (auth.uid() = auth_user_id);

drop policy if exists gm_manage_academy_staff on public.academy_staff;
create policy gm_manage_academy_staff on public.academy_staff
  for all to authenticated
  using (
    exists (
      select 1 from public.academy_staff s
      where s.auth_user_id = auth.uid()
        and s.panel_level = 'L1'
        and s.status = 'active'
    )
  )
  with check (
    exists (
      select 1 from public.academy_staff s
      where s.auth_user_id = auth.uid()
        and s.panel_level = 'L1'
        and s.status = 'active'
    )
  );
