-- =====================================================
-- RBAC-3 — جدول support_tickets + RLS
-- نفّذ في Supabase → SQL Editor (بعد AUDIT_LOG_SCHEMA.sql)
-- =====================================================

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  reference_code text not null unique,
  title text not null,
  description text not null,
  category text not null default 'general'
    check (category in ('technical', 'account', 'website', 'access', 'general')),
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'urgent')),
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'waiting', 'resolved', 'closed')),
  reporter_name text,
  reporter_email text,
  reporter_phone text,
  created_by_user_id uuid,
  created_by_email text,
  assigned_to_email text,
  admin_note text,
  resolution_note text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_tickets_status_idx on public.support_tickets (status);
create index if not exists support_tickets_priority_idx on public.support_tickets (priority, created_at desc);
create index if not exists support_tickets_created_idx on public.support_tickets (created_at desc);
create index if not exists support_tickets_category_idx on public.support_tickets (category);

comment on table public.support_tickets is 'تذاكر الدعم الفني — مشاكل تقنية / حساب / موقع';
comment on column public.support_tickets.category is 'technical | account | website | access | general';

create or replace function public.support_tickets_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  if new.status in ('resolved', 'closed') and new.resolved_at is null then
    new.resolved_at = now();
  end if;
  if new.status not in ('resolved', 'closed') then
    new.resolved_at = null;
  end if;
  return new;
end;
$$;

drop trigger if exists support_tickets_updated_at on public.support_tickets;
create trigger support_tickets_updated_at
  before update on public.support_tickets
  for each row execute function public.support_tickets_set_updated_at();

-- ─── مساعد: هل للموظف نطاق support في لوحة الإدارة؟ ───
create or replace function public.panel_staff_has_domain(p_domain text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    or exists (
      select 1
      from public.academy_staff s
      where s.auth_user_id = auth.uid()
        and s.status = 'active'
        and (
          s.panel_level = 'L1'
          or s.panel_domains @> '["*"]'::jsonb
          or s.panel_domains @> to_jsonb(array[p_domain])
        )
    );
$$;

create or replace function public.panel_staff_support_can_delete()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    or exists (
      select 1
      from public.academy_staff s
      where s.auth_user_id = auth.uid()
        and s.status = 'active'
        and s.panel_level in ('L1', 'L2')
        and (
          s.panel_domains @> '["*"]'::jsonb
          or s.panel_domains @> '["support"]'::jsonb
        )
    );
$$;

alter table public.support_tickets enable row level security;

drop policy if exists support_tickets_staff_select on public.support_tickets;
create policy support_tickets_staff_select on public.support_tickets
  for select to authenticated
  using (public.panel_staff_has_domain('support'));

drop policy if exists support_tickets_staff_insert on public.support_tickets;
create policy support_tickets_staff_insert on public.support_tickets
  for insert to authenticated
  with check (public.panel_staff_has_domain('support'));

drop policy if exists support_tickets_staff_update on public.support_tickets;
create policy support_tickets_staff_update on public.support_tickets
  for update to authenticated
  using (public.panel_staff_has_domain('support'))
  with check (public.panel_staff_has_domain('support'));

drop policy if exists support_tickets_staff_delete on public.support_tickets;
create policy support_tickets_staff_delete on public.support_tickets
  for delete to authenticated
  using (public.panel_staff_support_can_delete());

revoke all on function public.panel_staff_has_domain(text) from public;
grant execute on function public.panel_staff_has_domain(text) to authenticated;

revoke all on function public.panel_staff_support_can_delete() from public;
grant execute on function public.panel_staff_support_can_delete() to authenticated;
