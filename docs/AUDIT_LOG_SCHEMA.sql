-- =====================================================
-- RBAC-3 — سجل تدقيق لوحة الإدارة (audit_log)
-- نفّذ في Supabase → SQL Editor (مرة واحدة)
-- =====================================================

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  domain text not null,
  action text not null,
  entity_type text,
  entity_id text,
  actor_user_id uuid not null,
  actor_email text,
  actor_level text,
  actor_job_title text,
  summary_ar text,
  meta_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_log_created_at_idx on public.audit_log (created_at desc);
create index if not exists audit_log_domain_idx on public.audit_log (domain, created_at desc);
create index if not exists audit_log_entity_idx on public.audit_log (entity_type, entity_id);
create index if not exists audit_log_actor_idx on public.audit_log (actor_user_id, created_at desc);

comment on table public.audit_log is 'سجل تدقيق العمليات الحساسة في لوحة الإدارة';
comment on column public.audit_log.domain is 'requests | store | media | system | auth | support | members | ops';
comment on column public.audit_log.action is 'request_approve | staff_suspend | auth.login | …';
comment on column public.audit_log.summary_ar is 'وصف مختصر بالعربية للعرض في لوحة التدقيق لاحقاً';

alter table public.audit_log enable row level security;

-- الكادر النشط: إدراج سجل باسمه فقط
drop policy if exists audit_log_insert_own on public.audit_log;
create policy audit_log_insert_own on public.audit_log
  for insert to authenticated
  with check (
    actor_user_id = auth.uid()
    and (
      exists (
        select 1 from public.academy_staff s
        where s.auth_user_id = auth.uid()
          and s.status = 'active'
      )
      or coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
      or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    )
  );

-- المدير العام L1: قراءة كاملة (لوحة تدقيق لاحقة)
drop policy if exists audit_log_select_l1 on public.audit_log;
create policy audit_log_select_l1 on public.audit_log
  for select to authenticated
  using (
    exists (
      select 1 from public.academy_staff s
      where s.auth_user_id = auth.uid()
        and s.panel_level = 'L1'
        and s.status = 'active'
    )
    or coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  );

-- لا تحديث ولا حذف من الواجهة — السجل append-only
