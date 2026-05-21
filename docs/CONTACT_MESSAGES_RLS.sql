-- =====================================================
-- جدول contact_messages + RLS + إرسال عام (C2 — تواصل)
-- نفّذ في Supabase SQL Editor (بعد ACADEMY_STATS_RLS.sql)
-- =====================================================

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  reference_code text not null unique,
  full_name text not null,
  phone text,
  email text,
  subject text not null,
  message text not null,
  status text not null default 'new'
    check (status in ('new', 'read', 'replied', 'archived')),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.contact_messages add column if not exists reference_code text;
alter table public.contact_messages add column if not exists full_name text;
alter table public.contact_messages add column if not exists phone text;
alter table public.contact_messages add column if not exists email text;
alter table public.contact_messages add column if not exists subject text;
alter table public.contact_messages add column if not exists message text;
alter table public.contact_messages add column if not exists status text not null default 'new';
alter table public.contact_messages add column if not exists admin_note text;
alter table public.contact_messages add column if not exists created_at timestamptz not null default now();
alter table public.contact_messages add column if not exists updated_at timestamptz not null default now();

create index if not exists contact_messages_status_idx on public.contact_messages (status);
create index if not exists contact_messages_created_idx on public.contact_messages (created_at desc);

create or replace function public.contact_messages_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists contact_messages_updated_at on public.contact_messages;
create trigger contact_messages_updated_at
  before update on public.contact_messages
  for each row execute function public.contact_messages_set_updated_at();

alter table public.contact_messages enable row level security;

drop policy if exists "contact_messages_all" on public.contact_messages;
drop policy if exists "Allow all contact_messages" on public.contact_messages;
drop policy if exists academy_dev_contact_messages_all on public.contact_messages;
drop policy if exists admin_manage_contact_messages on public.contact_messages;
drop policy if exists contact_messages_public_insert on public.contact_messages;

create policy admin_manage_contact_messages on public.contact_messages
  for all to authenticated
  using (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  )
  with check (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  );

create or replace function public.submit_contact_message(
  p_full_name text,
  p_phone text,
  p_email text,
  p_subject text,
  p_message text
)
returns table (
  id uuid,
  reference_code text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ref text;
  v_row public.contact_messages%rowtype;
begin
  if nullif(trim(p_full_name), '') is null then
    raise exception 'full_name required';
  end if;
  if nullif(trim(p_subject), '') is null then
    raise exception 'subject required';
  end if;
  if nullif(trim(p_message), '') is null then
    raise exception 'message required';
  end if;
  if nullif(trim(coalesce(p_phone, '')), '') is null
     and nullif(trim(coalesce(p_email, '')), '') is null then
    raise exception 'phone or email required';
  end if;

  v_ref := 'MSG-' || to_char(now() at time zone 'utc', 'YYYYMMDD') || '-' ||
    upper(substr(md5(random()::text), 1, 4));

  insert into public.contact_messages (
    reference_code,
    full_name,
    phone,
    email,
    subject,
    message,
    status
  ) values (
    v_ref,
    trim(p_full_name),
    nullif(trim(coalesce(p_phone, '')), ''),
    nullif(trim(coalesce(p_email, '')), ''),
    trim(p_subject),
    trim(p_message),
    'new'
  )
  returning * into v_row;

  return query select v_row.id, v_row.reference_code;
end;
$$;

revoke all on function public.submit_contact_message(text, text, text, text, text) from public;
grant execute on function public.submit_contact_message(text, text, text, text, text) to anon, authenticated;
