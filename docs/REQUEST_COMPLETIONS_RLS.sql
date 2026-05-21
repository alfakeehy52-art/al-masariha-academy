-- =====================================================
-- RLS: request_completions + Storage (academy_files)
-- نفّذ في Supabase SQL Editor بعد JOIN_REQUESTS_RLS.sql
-- =====================================================

-- ─── جدول request_completions ───
alter table public.request_completions enable row level security;

drop policy if exists "request_completions_all" on public.request_completions;
drop policy if exists "Enable read access for all users" on public.request_completions;
drop policy if exists "Allow all request_completions" on public.request_completions;
drop policy if exists "allow_all_request_completions" on public.request_completions;
drop policy if exists academy_dev_request_completions_all on public.request_completions;

-- الإدارة فقط — الوصول المباشر للجدول
drop policy if exists admin_manage_request_completions on public.request_completions;
create policy admin_manage_request_completions on public.request_completions
  for all to authenticated
  using (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  )
  with check (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  );

-- ─── قراءة آمنة للعامة (متابعة الطلب) ───
create or replace function public.lookup_request_completion(p_ref text, p_phone text)
returns setof public.request_completions
language sql
security definer
set search_path = public
stable
as $$
  select rc.*
  from public.request_completions rc
  inner join public.join_requests jr on jr.id = rc.request_id
  where jr.reference_code = nullif(trim(p_ref), '')
    and jr.phone = nullif(trim(p_phone), '')
  limit 1;
$$;

-- ─── حفظ / تحديث استكمال المرفقات (صفحة request_completion) ───
create or replace function public.upsert_request_completion(
  p_ref text,
  p_phone text,
  p_payload jsonb
)
returns public.request_completions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req public.join_requests;
  v_row public.request_completions;
  v_payload jsonb;
begin
  select * into v_req
  from public.join_requests
  where reference_code = nullif(trim(p_ref), '')
    and phone = nullif(trim(p_phone), '')
  limit 1;

  if not found then
    raise exception 'request not found';
  end if;

  if coalesce(lower(v_req.status), '') in ('approved', 'accepted', 'مقبول', 'معتمد') then
    raise exception 'request already approved';
  end if;

  v_payload := coalesce(p_payload, '{}'::jsonb)
    || jsonb_build_object(
      'request_id', v_req.id,
      'request_type', coalesce(p_payload->>'request_type', v_req.request_type),
      'full_name', coalesce(p_payload->>'full_name', v_req.full_name),
      'phone', coalesce(p_payload->>'phone', v_req.phone),
      'email', coalesce(p_payload->>'email', v_req.email)
    );

  insert into public.request_completions as rc (
    request_id,
    request_type,
    full_name,
    phone,
    email,
    status,
    notes,
    id_document_url,
    id_document_status,
    id_document_note,
    personal_photo_url,
    personal_photo_status,
    personal_photo_note,
    contract_file_url,
    contract_file_status,
    contract_file_note,
    pledge_file_url,
    pledge_file_status,
    pledge_file_note,
    certificate_file_url,
    certificate_file_status,
    certificate_file_note,
    player_join_file_url,
    player_join_file_status,
    player_join_file_note,
    guardian_approval_file_url,
    guardian_approval_file_status,
    guardian_approval_file_note,
    player_commitment_file_url,
    player_commitment_file_status,
    player_commitment_file_note,
    medical_file_url,
    medical_file_status,
    medical_file_note,
    guardian_link_file_url,
    guardian_link_file_status,
    guardian_link_file_note,
    guardian_pledge_file_url,
    guardian_pledge_file_status,
    guardian_pledge_file_note,
    supporter_logo_url,
    supporter_logo_status,
    supporter_logo_note,
    supporter_contract_file_url,
    supporter_contract_file_status,
    supporter_contract_file_note,
    volunteer_agreement_file_url,
    volunteer_agreement_file_status,
    volunteer_agreement_file_note
  )
  values (
    v_req.id,
    coalesce(v_payload->>'request_type', v_req.request_type),
    coalesce(v_payload->>'full_name', v_req.full_name),
    coalesce(v_payload->>'phone', v_req.phone),
    coalesce(v_payload->>'email', v_req.email),
    coalesce(v_payload->>'status', 'completed'),
    v_payload->>'notes',
    v_payload->>'id_document_url',
    v_payload->>'id_document_status',
    v_payload->>'id_document_note',
    v_payload->>'personal_photo_url',
    v_payload->>'personal_photo_status',
    v_payload->>'personal_photo_note',
    v_payload->>'contract_file_url',
    v_payload->>'contract_file_status',
    v_payload->>'contract_file_note',
    v_payload->>'pledge_file_url',
    v_payload->>'pledge_file_status',
    v_payload->>'pledge_file_note',
    v_payload->>'certificate_file_url',
    v_payload->>'certificate_file_status',
    v_payload->>'certificate_file_note',
    v_payload->>'player_join_file_url',
    v_payload->>'player_join_file_status',
    v_payload->>'player_join_file_note',
    v_payload->>'guardian_approval_file_url',
    v_payload->>'guardian_approval_file_status',
    v_payload->>'guardian_approval_file_note',
    v_payload->>'player_commitment_file_url',
    v_payload->>'player_commitment_file_status',
    v_payload->>'player_commitment_file_note',
    v_payload->>'medical_file_url',
    v_payload->>'medical_file_status',
    v_payload->>'medical_file_note',
    v_payload->>'guardian_link_file_url',
    v_payload->>'guardian_link_file_status',
    v_payload->>'guardian_link_file_note',
    v_payload->>'guardian_pledge_file_url',
    v_payload->>'guardian_pledge_file_status',
    v_payload->>'guardian_pledge_file_note',
    v_payload->>'supporter_logo_url',
    v_payload->>'supporter_logo_status',
    v_payload->>'supporter_logo_note',
    v_payload->>'supporter_contract_file_url',
    v_payload->>'supporter_contract_file_status',
    v_payload->>'supporter_contract_file_note',
    v_payload->>'volunteer_agreement_file_url',
    v_payload->>'volunteer_agreement_file_status',
    v_payload->>'volunteer_agreement_file_note'
  )
  on conflict (request_id) do update set
    request_type = coalesce(excluded.request_type, rc.request_type),
    full_name = coalesce(excluded.full_name, rc.full_name),
    phone = coalesce(excluded.phone, rc.phone),
    email = coalesce(excluded.email, rc.email),
    status = coalesce(excluded.status, rc.status),
    notes = case when v_payload ? 'notes' then excluded.notes else rc.notes end,
    id_document_url = coalesce(excluded.id_document_url, rc.id_document_url),
    id_document_status = coalesce(excluded.id_document_status, rc.id_document_status),
    id_document_note = case when v_payload ? 'id_document_note' then excluded.id_document_note else rc.id_document_note end,
    personal_photo_url = coalesce(excluded.personal_photo_url, rc.personal_photo_url),
    personal_photo_status = coalesce(excluded.personal_photo_status, rc.personal_photo_status),
    personal_photo_note = case when v_payload ? 'personal_photo_note' then excluded.personal_photo_note else rc.personal_photo_note end,
    contract_file_url = coalesce(excluded.contract_file_url, rc.contract_file_url),
    contract_file_status = coalesce(excluded.contract_file_status, rc.contract_file_status),
    contract_file_note = case when v_payload ? 'contract_file_note' then excluded.contract_file_note else rc.contract_file_note end,
    pledge_file_url = coalesce(excluded.pledge_file_url, rc.pledge_file_url),
    pledge_file_status = coalesce(excluded.pledge_file_status, rc.pledge_file_status),
    pledge_file_note = case when v_payload ? 'pledge_file_note' then excluded.pledge_file_note else rc.pledge_file_note end,
    certificate_file_url = coalesce(excluded.certificate_file_url, rc.certificate_file_url),
    certificate_file_status = coalesce(excluded.certificate_file_status, rc.certificate_file_status),
    certificate_file_note = case when v_payload ? 'certificate_file_note' then excluded.certificate_file_note else rc.certificate_file_note end,
    player_join_file_url = coalesce(excluded.player_join_file_url, rc.player_join_file_url),
    player_join_file_status = coalesce(excluded.player_join_file_status, rc.player_join_file_status),
    player_join_file_note = case when v_payload ? 'player_join_file_note' then excluded.player_join_file_note else rc.player_join_file_note end,
    guardian_approval_file_url = coalesce(excluded.guardian_approval_file_url, rc.guardian_approval_file_url),
    guardian_approval_file_status = coalesce(excluded.guardian_approval_file_status, rc.guardian_approval_file_status),
    guardian_approval_file_note = case when v_payload ? 'guardian_approval_file_note' then excluded.guardian_approval_file_note else rc.guardian_approval_file_note end,
    player_commitment_file_url = coalesce(excluded.player_commitment_file_url, rc.player_commitment_file_url),
    player_commitment_file_status = coalesce(excluded.player_commitment_file_status, rc.player_commitment_file_status),
    player_commitment_file_note = case when v_payload ? 'player_commitment_file_note' then excluded.player_commitment_file_note else rc.player_commitment_file_note end,
    medical_file_url = coalesce(excluded.medical_file_url, rc.medical_file_url),
    medical_file_status = coalesce(excluded.medical_file_status, rc.medical_file_status),
    medical_file_note = case when v_payload ? 'medical_file_note' then excluded.medical_file_note else rc.medical_file_note end,
    guardian_link_file_url = coalesce(excluded.guardian_link_file_url, rc.guardian_link_file_url),
    guardian_link_file_status = coalesce(excluded.guardian_link_file_status, rc.guardian_link_file_status),
    guardian_link_file_note = case when v_payload ? 'guardian_link_file_note' then excluded.guardian_link_file_note else rc.guardian_link_file_note end,
    guardian_pledge_file_url = coalesce(excluded.guardian_pledge_file_url, rc.guardian_pledge_file_url),
    guardian_pledge_file_status = coalesce(excluded.guardian_pledge_file_status, rc.guardian_pledge_file_status),
    guardian_pledge_file_note = case when v_payload ? 'guardian_pledge_file_note' then excluded.guardian_pledge_file_note else rc.guardian_pledge_file_note end,
    supporter_logo_url = coalesce(excluded.supporter_logo_url, rc.supporter_logo_url),
    supporter_logo_status = coalesce(excluded.supporter_logo_status, rc.supporter_logo_status),
    supporter_logo_note = case when v_payload ? 'supporter_logo_note' then excluded.supporter_logo_note else rc.supporter_logo_note end,
    supporter_contract_file_url = coalesce(excluded.supporter_contract_file_url, rc.supporter_contract_file_url),
    supporter_contract_file_status = coalesce(excluded.supporter_contract_file_status, rc.supporter_contract_file_status),
    supporter_contract_file_note = case when v_payload ? 'supporter_contract_file_note' then excluded.supporter_contract_file_note else rc.supporter_contract_file_note end,
    volunteer_agreement_file_url = coalesce(excluded.volunteer_agreement_file_url, rc.volunteer_agreement_file_url),
    volunteer_agreement_file_status = coalesce(excluded.volunteer_agreement_file_status, rc.volunteer_agreement_file_status),
    volunteer_agreement_file_note = case when v_payload ? 'volunteer_agreement_file_note' then excluded.volunteer_agreement_file_note else rc.volunteer_agreement_file_note end,
    updated_at = now()
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.lookup_request_completion(text, text) from public;
revoke all on function public.upsert_request_completion(text, text, jsonb) from public;
grant execute on function public.lookup_request_completion(text, text) to anon, authenticated;
grant execute on function public.upsert_request_completion(text, text, jsonb) to anon, authenticated;

-- ─── Storage: bucket academy_files ───
-- تأكد أن الـ bucket موجود (Public للقراءة إن كانت الروابط publicUrl)

drop policy if exists academy_files_anon_insert on storage.objects;
drop policy if exists academy_files_admin_all on storage.objects;
drop policy if exists "Public upload academy_files" on storage.objects;
drop policy if exists "Allow public uploads" on storage.objects;

create policy academy_files_anon_insert on storage.objects
  for insert to anon, authenticated
  with check (
    bucket_id = 'academy_files'
    and exists (
      select 1
      from public.join_requests jr
      where name like '%' || jr.reference_code || '%'
        and coalesce(lower(jr.status), '') not in ('approved', 'accepted', 'مقبول', 'معتمد')
    )
  );

create policy academy_files_admin_all on storage.objects
  for all to authenticated
  using (
    bucket_id = 'academy_files'
    and (
      coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
      or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    )
  )
  with check (
    bucket_id = 'academy_files'
    and (
      coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
      or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    )
  );
