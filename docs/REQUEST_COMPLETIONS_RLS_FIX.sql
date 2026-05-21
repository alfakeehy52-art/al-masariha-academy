-- =====================================================
-- إصلاح دالة upsert_request_completion
-- السبب: بعض الأعمدة (guardian_link / supporter / volunteer) غير موجودة في الجدول
-- نفّذ في Supabase SQL Editor بعد REQUEST_COMPLETIONS_RLS.sql
-- =====================================================

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
    request_id, request_type, full_name, phone, email, status, notes,
    id_document_url, id_document_status, id_document_note,
    personal_photo_url, personal_photo_status, personal_photo_note,
    contract_file_url, contract_file_status, contract_file_note,
    pledge_file_url, pledge_file_status, pledge_file_note,
    certificate_file_url, certificate_file_status, certificate_file_note,
    player_join_file_url, player_join_file_status, player_join_file_note,
    guardian_approval_file_url, guardian_approval_file_status, guardian_approval_file_note,
    player_commitment_file_url, player_commitment_file_status, player_commitment_file_note,
    medical_file_url, medical_file_status, medical_file_note
  )
  values (
    v_req.id,
    coalesce(v_payload->>'request_type', v_req.request_type),
    coalesce(v_payload->>'full_name', v_req.full_name),
    coalesce(v_payload->>'phone', v_req.phone),
    coalesce(v_payload->>'email', v_req.email),
    coalesce(v_payload->>'status', 'completed'),
    v_payload->>'notes',
    v_payload->>'id_document_url', v_payload->>'id_document_status', v_payload->>'id_document_note',
    v_payload->>'personal_photo_url', v_payload->>'personal_photo_status', v_payload->>'personal_photo_note',
    v_payload->>'contract_file_url', v_payload->>'contract_file_status', v_payload->>'contract_file_note',
    v_payload->>'pledge_file_url', v_payload->>'pledge_file_status', v_payload->>'pledge_file_note',
    v_payload->>'certificate_file_url', v_payload->>'certificate_file_status', v_payload->>'certificate_file_note',
    v_payload->>'player_join_file_url', v_payload->>'player_join_file_status', v_payload->>'player_join_file_note',
    v_payload->>'guardian_approval_file_url', v_payload->>'guardian_approval_file_status', v_payload->>'guardian_approval_file_note',
    v_payload->>'player_commitment_file_url', v_payload->>'player_commitment_file_status', v_payload->>'player_commitment_file_note',
    v_payload->>'medical_file_url', v_payload->>'medical_file_status', v_payload->>'medical_file_note'
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
    updated_at = now()
  returning * into v_row;

  return v_row;
end;
$$;
