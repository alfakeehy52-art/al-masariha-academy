-- =====================================================
-- جدول store_products + سياسات RLS + قراءة عامة للمتجر
-- نفّذ في Supabase SQL Editor (بعد COACHES_RLS.sql)
-- =====================================================

-- تحقق سريع بعد التنفيذ:
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'store_products' ORDER BY ordinal_position;

create table if not exists public.store_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10, 2) default 0,
  product_type text default 'منتج عام',
  category text default 'ملابس',
  status text not null default 'coming_soon'
    check (status in ('draft', 'coming_soon', 'published', 'hidden')),
  image text,
  emoji text default '📦',
  description text,
  is_featured boolean not null default false,
  is_customizable boolean not null default false,
  player_id uuid references public.players (id) on delete set null,
  player_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists store_products_status_idx on public.store_products (status);
create index if not exists store_products_featured_idx on public.store_products (is_featured)
  where is_featured = true;

alter table public.store_products enable row level security;

-- إزالة سياسات قديمة إن وُجدت
drop policy if exists "store_products_all" on public.store_products;
drop policy if exists store_products_select on public.store_products;
drop policy if exists store_products_insert on public.store_products;
drop policy if exists store_products_update on public.store_products;
drop policy if exists store_products_delete on public.store_products;
drop policy if exists admin_manage_store_products on public.store_products;
drop policy if exists store_products_public_select on public.store_products;

-- ─── الإدارة: إدارة كاملة ───
create policy admin_manage_store_products on public.store_products
  for all to authenticated
  using (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  )
  with check (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  );

-- ─── عامة: منتجات منشورة أو «قريبًا» فقط ───
create policy store_products_public_select on public.store_products
  for select to anon, authenticated
  using (status in ('coming_soon', 'published'));

-- ─── قائمة المتجر للواجهة العامة (RPC احتياطي) ───
create or replace function public.list_store_products_public()
returns table (
  id uuid,
  name text,
  price numeric,
  product_type text,
  category text,
  status text,
  image text,
  emoji text,
  description text,
  is_featured boolean,
  is_customizable boolean,
  player_id uuid,
  player_name text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.id,
    p.name,
    p.price,
    p.product_type,
    p.category,
    p.status,
    p.image,
    p.emoji,
    p.description,
    p.is_featured,
    p.is_customizable,
    p.player_id,
    p.player_name,
    p.created_at
  from public.store_products p
  where p.status in ('coming_soon', 'published')
  order by p.is_featured desc, p.created_at desc nulls last;
$$;

revoke all on function public.list_store_products_public() from public;
grant execute on function public.list_store_products_public() to anon, authenticated;

-- ─── منتجات مميزة للصفحة الرئيسية ───
create or replace function public.list_store_products_featured(p_limit integer default 4)
returns table (
  id uuid,
  name text,
  price numeric,
  product_type text,
  category text,
  status text,
  image text,
  emoji text,
  description text,
  is_featured boolean,
  is_customizable boolean,
  player_id uuid,
  player_name text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.id,
    p.name,
    p.price,
    p.product_type,
    p.category,
    p.status,
    p.image,
    p.emoji,
    p.description,
    p.is_featured,
    p.is_customizable,
    p.player_id,
    p.player_name,
    p.created_at
  from public.store_products p
  where p.status in ('coming_soon', 'published')
    and p.is_featured = true
  order by p.created_at desc nulls last
  limit greatest(coalesce(p_limit, 4), 1);
$$;

revoke all on function public.list_store_products_featured(integer) from public;
grant execute on function public.list_store_products_featured(integer) to anon, authenticated;
