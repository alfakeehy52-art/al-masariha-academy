-- =====================================================
-- سياسات RLS لجدول join_requests + دوال استعلام آمنة للعامة
-- نفّذ في Supabase SQL Editor بعد حذف السياسات المفتوحة
-- =====================================================

alter table public.join_requests enable row level security;

-- إزالة سياسات مفتوحة شائعة
drop policy if exists "join_requests_all" on public.join_requests;
drop policy if exists "Enable read access for all users" on public.join_requests;
drop policy if exists "Enable insert for authenticated users only" on public.join_requests;
drop policy if exists "Enable insert for anon" on public.join_requests;
drop policy if exists "Public read join_requests" on public.join_requests;
drop policy if exists "allow_all_join_requests" on public.join_requests;
drop policy if exists join_requests_select on public.join_requests;
drop policy if exists join_requests_insert on public.join_requests;
drop policy if exists join_requests_update on public.join_requests;
drop policy if exists join_requests_delete on public.join_requests;

-- ─── عامة: إرسال طلب انضمام (صفحة Join) ───
drop policy if exists join_requests_public_insert on public.join_requests;
create policy join_requests_public_insert on public.join_requests
  for insert to anon, authenticated
  with check (
    reference_code is not null
    and phone is not null
    and full_name is not null
    and request_type is not null
  );

-- ─── الإدارة: إدارة كاملة ───
drop policy if exists admin_manage_join_requests on public.join_requests;
create policy admin_manage_join_requests on public.join_requests
  for all to authenticated
  using (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  )
  with check (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  );

-- ─── استعلام آمن: متابعة الطلب برقم المرجع + الجوال ───
create or replace function public.lookup_join_request_by_ref_phone(p_ref text, p_phone text)
returns setof public.join_requests
language sql
security definer
set search_path = public
as $$
  select *
  from public.join_requests
  where reference_code = nullif(trim(p_ref), '')
    and phone = nullif(trim(p_phone), '')
  limit 1;
$$;

-- ─── استعلام آمن: استرجاع طلبات بنفس الجوال والبريد ───
create or replace function public.lookup_join_requests_by_contact(p_phone text, p_email text)
returns setof public.join_requests
language sql
security definer
set search_path = public
as $$
  select *
  from public.join_requests
  where phone = nullif(trim(p_phone), '')
    and lower(trim(coalesce(email, ''))) = lower(trim(coalesce(p_email, '')))
  order by created_at desc
  limit 20;
$$;

-- ─── تحديث آمن: إرسال استكمال المرفقات (تغيير الحالة إلى reviewing) ───
create or replace function public.submit_join_request_review(
  p_request_id uuid,
  p_ref text,
  p_phone text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.join_requests
  set status = 'reviewing',
      updated_at = now()
  where id = p_request_id
    and reference_code = nullif(trim(p_ref), '')
    and phone = nullif(trim(p_phone), '')
    and coalesce(lower(status), '') not in ('approved', 'accepted', 'مقبول', 'معتمد');
  return found;
end;
$$;

revoke all on function public.lookup_join_request_by_ref_phone(text, text) from public;
revoke all on function public.lookup_join_requests_by_contact(text, text) from public;
revoke all on function public.submit_join_request_review(uuid, text, text) from public;

grant execute on function public.lookup_join_request_by_ref_phone(text, text) to anon, authenticated;
grant execute on function public.lookup_join_requests_by_contact(text, text) to anon, authenticated;
grant execute on function public.submit_join_request_review(uuid, text, text) to anon, authenticated;
