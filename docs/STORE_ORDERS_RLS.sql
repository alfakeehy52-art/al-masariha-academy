-- =====================================================
-- جدول store_orders + RLS + إرسال طلب (C3 — متجر)
-- نفّذ في Supabase SQL Editor (بعد STORE_PRODUCTS_RLS.sql)
-- =====================================================

create table if not exists public.store_orders (
  id uuid primary key default gen_random_uuid(),
  reference_code text not null unique,
  product_id uuid references public.store_products (id) on delete set null,
  product_name text not null,
  product_price numeric(10, 2) not null default 0,
  quantity integer not null default 1 check (quantity > 0),
  customer_name text not null,
  phone text not null,
  email text,
  notes text,
  status text not null default 'new'
    check (status in ('new', 'confirmed', 'preparing', 'shipped', 'cancelled', 'done')),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.store_orders add column if not exists reference_code text;
alter table public.store_orders add column if not exists product_id uuid;
alter table public.store_orders add column if not exists product_name text;
alter table public.store_orders add column if not exists product_price numeric(10, 2) not null default 0;
alter table public.store_orders add column if not exists quantity integer not null default 1;
alter table public.store_orders add column if not exists customer_name text;
alter table public.store_orders add column if not exists phone text;
alter table public.store_orders add column if not exists email text;
alter table public.store_orders add column if not exists notes text;
alter table public.store_orders add column if not exists status text not null default 'new';
alter table public.store_orders add column if not exists admin_note text;
alter table public.store_orders add column if not exists created_at timestamptz not null default now();
alter table public.store_orders add column if not exists updated_at timestamptz not null default now();

create index if not exists store_orders_status_idx on public.store_orders (status);
create index if not exists store_orders_created_idx on public.store_orders (created_at desc);
create index if not exists store_orders_product_idx on public.store_orders (product_id);

create or replace function public.store_orders_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists store_orders_updated_at on public.store_orders;
create trigger store_orders_updated_at
  before update on public.store_orders
  for each row execute function public.store_orders_set_updated_at();

alter table public.store_orders enable row level security;

drop policy if exists "store_orders_all" on public.store_orders;
drop policy if exists admin_manage_store_orders on public.store_orders;

create policy admin_manage_store_orders on public.store_orders
  for all to authenticated
  using (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  )
  with check (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  );

create or replace function public.submit_store_order(
  p_product_id uuid,
  p_customer_name text,
  p_phone text,
  p_email text,
  p_quantity integer,
  p_notes text
)
returns table (
  id uuid,
  reference_code text,
  product_name text,
  product_price numeric,
  quantity integer,
  line_total numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ref text;
  v_prod public.store_products%rowtype;
  v_row public.store_orders%rowtype;
  v_qty integer;
begin
  if nullif(trim(p_customer_name), '') is null then
    raise exception 'customer_name required';
  end if;
  if nullif(trim(p_phone), '') is null then
    raise exception 'phone required';
  end if;
  if p_product_id is null then
    raise exception 'product_id required';
  end if;

  v_qty := greatest(1, coalesce(p_quantity, 1));

  select * into v_prod
  from public.store_products p
  where p.id = p_product_id
    and p.status = 'published';

  if not found then
    raise exception 'product not available';
  end if;

  v_ref := 'ORD-' || to_char(now() at time zone 'utc', 'YYYYMMDD') || '-' ||
    upper(substr(md5(random()::text), 1, 4));

  insert into public.store_orders (
    reference_code,
    product_id,
    product_name,
    product_price,
    quantity,
    customer_name,
    phone,
    email,
    notes,
    status
  ) values (
    v_ref,
    v_prod.id,
    v_prod.name,
    coalesce(v_prod.price, 0),
    v_qty,
    trim(p_customer_name),
    trim(p_phone),
    nullif(trim(coalesce(p_email, '')), ''),
    nullif(trim(coalesce(p_notes, '')), ''),
    'new'
  )
  returning * into v_row;

  return query
  select
    v_row.id,
    v_row.reference_code,
    v_row.product_name,
    v_row.product_price,
    v_row.quantity,
    (v_row.product_price * v_row.quantity)::numeric as line_total;
end;
$$;

create or replace function public.lookup_store_order_public(p_ref text, p_phone text)
returns table (
  id uuid,
  reference_code text,
  product_name text,
  product_price numeric,
  quantity integer,
  line_total numeric,
  customer_name text,
  phone text,
  status text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    o.id,
    o.reference_code,
    o.product_name,
    o.product_price,
    o.quantity,
    (o.product_price * o.quantity)::numeric as line_total,
    o.customer_name,
    o.phone,
    o.status,
    o.created_at
  from public.store_orders o
  where o.reference_code = nullif(trim(p_ref), '')
    and o.phone = nullif(trim(p_phone), '')
  limit 1;
$$;

revoke all on function public.submit_store_order(uuid, text, text, text, integer, text) from public;
grant execute on function public.submit_store_order(uuid, text, text, text, integer, text) to anon, authenticated;
revoke all on function public.lookup_store_order_public(text, text) from public;
grant execute on function public.lookup_store_order_public(text, text) to anon, authenticated;
