-- =====================================================
-- RLS: guardians + supporters + volunteers + player_guardians
-- إدارة فقط (بيانات شخصية) — بعد ACADEMY_MEMBERS_RLS.sql
-- =====================================================
--
-- تحقق بعد التنفيذ:
-- SELECT tablename, policyname, cmd FROM pg_policies
-- WHERE tablename IN ('guardians','supporters','volunteers','player_guardians')
-- ORDER BY tablename, policyname;
-- المتوقع: 4 سياسات (واحدة لكل جدول)

-- ─────────────────────────────────────────
-- 1) guardians
-- ─────────────────────────────────────────
create table if not exists public.guardians (
  id uuid primary key default gen_random_uuid(),
  source_request_id uuid references public.join_requests (id) on delete set null,
  reference_code text,
  full_name text,
  phone text,
  email text,
  city text,
  relationship text,
  status text not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.guardians add column if not exists source_request_id uuid;
alter table public.guardians add column if not exists reference_code text;
alter table public.guardians add column if not exists full_name text;
alter table public.guardians add column if not exists phone text;
alter table public.guardians add column if not exists email text;
alter table public.guardians add column if not exists city text;
alter table public.guardians add column if not exists relationship text;
alter table public.guardians add column if not exists status text not null default 'active';
alter table public.guardians add column if not exists notes text;
alter table public.guardians add column if not exists created_at timestamptz not null default now();
alter table public.guardians add column if not exists updated_at timestamptz not null default now();

create unique index if not exists guardians_source_request_uidx
  on public.guardians (source_request_id) where source_request_id is not null;
create index if not exists guardians_phone_idx on public.guardians (phone);
create index if not exists guardians_status_idx on public.guardians (status);

-- ─────────────────────────────────────────
-- 2) supporters
-- ─────────────────────────────────────────
create table if not exists public.supporters (
  id uuid primary key default gen_random_uuid(),
  source_request_id uuid references public.join_requests (id) on delete set null,
  reference_code text,
  full_name text,
  phone text,
  email text,
  city text,
  support_type text,
  support_level text,
  entity_name text,
  support_method text,
  status text not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.supporters add column if not exists source_request_id uuid;
alter table public.supporters add column if not exists reference_code text;
alter table public.supporters add column if not exists full_name text;
alter table public.supporters add column if not exists phone text;
alter table public.supporters add column if not exists email text;
alter table public.supporters add column if not exists city text;
alter table public.supporters add column if not exists support_type text;
alter table public.supporters add column if not exists support_level text;
alter table public.supporters add column if not exists entity_name text;
alter table public.supporters add column if not exists support_method text;
alter table public.supporters add column if not exists status text not null default 'active';
alter table public.supporters add column if not exists notes text;
alter table public.supporters add column if not exists created_at timestamptz not null default now();
alter table public.supporters add column if not exists updated_at timestamptz not null default now();

create unique index if not exists supporters_source_request_uidx
  on public.supporters (source_request_id) where source_request_id is not null;
create index if not exists supporters_status_idx on public.supporters (status);

-- ─────────────────────────────────────────
-- 3) volunteers
-- ─────────────────────────────────────────
create table if not exists public.volunteers (
  id uuid primary key default gen_random_uuid(),
  source_request_id uuid references public.join_requests (id) on delete set null,
  reference_code text,
  full_name text,
  phone text,
  email text,
  city text,
  volunteer_field text,
  availability text,
  status text not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.volunteers add column if not exists source_request_id uuid;
alter table public.volunteers add column if not exists reference_code text;
alter table public.volunteers add column if not exists full_name text;
alter table public.volunteers add column if not exists phone text;
alter table public.volunteers add column if not exists email text;
alter table public.volunteers add column if not exists city text;
alter table public.volunteers add column if not exists volunteer_field text;
alter table public.volunteers add column if not exists availability text;
alter table public.volunteers add column if not exists status text not null default 'active';
alter table public.volunteers add column if not exists notes text;
alter table public.volunteers add column if not exists created_at timestamptz not null default now();
alter table public.volunteers add column if not exists updated_at timestamptz not null default now();

create unique index if not exists volunteers_source_request_uidx
  on public.volunteers (source_request_id) where source_request_id is not null;
create index if not exists volunteers_status_idx on public.volunteers (status);

-- ─────────────────────────────────────────
-- 4) player_guardians (ربط لاعب ↔ ولي أمر)
-- ─────────────────────────────────────────
create table if not exists public.player_guardians (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players (id) on delete cascade,
  guardian_id uuid not null references public.guardians (id) on delete cascade,
  relationship text,
  is_primary boolean not null default true,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.player_guardians add column if not exists player_id uuid;
alter table public.player_guardians add column if not exists guardian_id uuid;
alter table public.player_guardians add column if not exists relationship text;
alter table public.player_guardians add column if not exists is_primary boolean not null default true;
alter table public.player_guardians add column if not exists status text not null default 'active';
alter table public.player_guardians add column if not exists created_at timestamptz not null default now();
alter table public.player_guardians add column if not exists updated_at timestamptz not null default now();

create unique index if not exists player_guardians_player_guardian_uidx
  on public.player_guardians (player_id, guardian_id);

-- أعمدة اختيارية على players لربط ولي الأمر (إن لم تكن موجودة)
alter table public.players add column if not exists guardian_id uuid;
alter table public.players add column if not exists guardian_name text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'players_guardian_id_fkey'
      and conrelid = 'public.players'::regclass
  ) then
    alter table public.players
      add constraint players_guardian_id_fkey
      foreign key (guardian_id) references public.guardians (id) on delete set null;
  end if;
exception when others then null;
end $$;

-- ─────────────────────────────────────────
-- triggers: updated_at
-- ─────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists guardians_updated_at on public.guardians;
create trigger guardians_updated_at before update on public.guardians
  for each row execute function public.set_updated_at();

drop trigger if exists supporters_updated_at on public.supporters;
create trigger supporters_updated_at before update on public.supporters
  for each row execute function public.set_updated_at();

drop trigger if exists volunteers_updated_at on public.volunteers;
create trigger volunteers_updated_at before update on public.volunteers
  for each row execute function public.set_updated_at();

drop trigger if exists player_guardians_updated_at on public.player_guardians;
create trigger player_guardians_updated_at before update on public.player_guardians
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────
-- RLS: guardians
-- ─────────────────────────────────────────
alter table public.guardians enable row level security;

drop policy if exists "guardians_all" on public.guardians;
drop policy if exists guardians_select on public.guardians;
drop policy if exists guardians_insert on public.guardians;
drop policy if exists guardians_update on public.guardians;
drop policy if exists guardians_delete on public.guardians;
drop policy if exists "Enable read access for all users" on public.guardians;
drop policy if exists "Public read guardians" on public.guardians;
drop policy if exists "allow_all_guardians" on public.guardians;
drop policy if exists "Allow admin read guardians" on public.guardians;
drop policy if exists "Allow anon read guardians" on public.guardians;
drop policy if exists "Allow all guardians" on public.guardians;
drop policy if exists academy_dev_guardians_all on public.guardians;
drop policy if exists admin_manage_guardians on public.guardians;

create policy admin_manage_guardians on public.guardians
  for all to authenticated
  using (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  )
  with check (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  );

-- ─────────────────────────────────────────
-- RLS: supporters
-- ─────────────────────────────────────────
alter table public.supporters enable row level security;

drop policy if exists "supporters_all" on public.supporters;
drop policy if exists supporters_select on public.supporters;
drop policy if exists supporters_insert on public.supporters;
drop policy if exists supporters_update on public.supporters;
drop policy if exists supporters_delete on public.supporters;
drop policy if exists "Enable read access for all users" on public.supporters;
drop policy if exists "Public read supporters" on public.supporters;
drop policy if exists "allow_all_supporters" on public.supporters;
drop policy if exists "Allow all supporters" on public.supporters;
drop policy if exists academy_dev_supporters_all on public.supporters;
drop policy if exists admin_manage_supporters on public.supporters;

create policy admin_manage_supporters on public.supporters
  for all to authenticated
  using (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  )
  with check (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  );

-- ─────────────────────────────────────────
-- RLS: volunteers
-- ─────────────────────────────────────────
alter table public.volunteers enable row level security;

drop policy if exists "volunteers_all" on public.volunteers;
drop policy if exists volunteers_select on public.volunteers;
drop policy if exists volunteers_insert on public.volunteers;
drop policy if exists volunteers_update on public.volunteers;
drop policy if exists volunteers_delete on public.volunteers;
drop policy if exists "Enable read access for all users" on public.volunteers;
drop policy if exists "Public read volunteers" on public.volunteers;
drop policy if exists "allow_all_volunteers" on public.volunteers;
drop policy if exists "Allow all volunteers" on public.volunteers;
drop policy if exists academy_dev_volunteers_all on public.volunteers;
drop policy if exists admin_manage_volunteers on public.volunteers;

create policy admin_manage_volunteers on public.volunteers
  for all to authenticated
  using (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  )
  with check (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  );

-- ─────────────────────────────────────────
-- RLS: player_guardians
-- ─────────────────────────────────────────
alter table public.player_guardians enable row level security;

drop policy if exists "player_guardians_all" on public.player_guardians;
drop policy if exists player_guardians_select on public.player_guardians;
drop policy if exists player_guardians_insert on public.player_guardians;
drop policy if exists player_guardians_update on public.player_guardians;
drop policy if exists player_guardians_delete on public.player_guardians;
drop policy if exists "Allow all player_guardians" on public.player_guardians;
drop policy if exists academy_dev_player_guardians_all on public.player_guardians;
drop policy if exists admin_manage_player_guardians on public.player_guardians;

create policy admin_manage_player_guardians on public.player_guardians
  for all to authenticated
  using (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  )
  with check (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  );
