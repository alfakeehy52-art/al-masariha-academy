-- =====================================================
-- إصلاح رفع مرفقات استكمال الطلب (Storage + anon)
-- السبب: سياسة الرفع كانت تستعلم join_requests تحت RLS فلا يرى الزائر أي صف
-- نفّذ في Supabase SQL Editor بعد REQUEST_COMPLETIONS_RLS.sql
-- =====================================================

create or replace function public.join_request_allows_storage_upload(object_name text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.join_requests jr
    where nullif(trim(jr.reference_code), '') is not null
      and position(jr.reference_code in coalesce(object_name, '')) > 0
      and coalesce(lower(trim(jr.status)), '') not in (
        'approved', 'accepted', 'مقبول', 'معتمد'
      )
  );
$$;

revoke all on function public.join_request_allows_storage_upload(text) from public;
grant execute on function public.join_request_allows_storage_upload(text) to anon, authenticated;

drop policy if exists academy_files_anon_insert on storage.objects;

create policy academy_files_anon_insert on storage.objects
  for insert to anon, authenticated
  with check (
    bucket_id = 'academy_files'
    and public.join_request_allows_storage_upload(name)
  );

-- قراءة عامة للملفات المرفوعة (روابط publicUrl)
drop policy if exists academy_files_public_read on storage.objects;
create policy academy_files_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'academy_files');
