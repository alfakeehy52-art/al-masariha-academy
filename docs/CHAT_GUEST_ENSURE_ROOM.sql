-- يفتح الزائر محادثة طلبه مباشرة بعد التسجيل (بدون انتظار ضغط «تواصل» من الإدارة)
-- نفّذ في Supabase SQL Editor بعد CHAT_MVP_RLS.sql

create or replace function public.chat_guest_open_join_room(p_ref text, p_phone text)
returns public.chat_rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req public.join_requests;
  v_room public.chat_rooms;
begin
  select * into v_req from public.chat_verify_join_request(p_ref, p_phone);
  if not found then
    raise exception 'request not found';
  end if;

  select * into v_room
  from public.chat_rooms
  where related_entity_table = 'join_requests'
    and related_entity_id = v_req.id::text
    and status in ('open', 'closed')
  order by case when status = 'open' then 0 else 1 end, created_at desc
  limit 1;

  if found then
    return v_room;
  end if;

  insert into public.chat_rooms (
    room_type,
    room_retention_type,
    related_entity_table,
    related_entity_id,
    title_ar,
    context_json
  ) values (
    'join_request',
    'permanent',
    'join_requests',
    v_req.id::text,
    'طلب ' || coalesce(v_req.reference_code, v_req.id::text),
    jsonb_build_object(
      'reference_code', v_req.reference_code,
      'request_type', v_req.request_type,
      'full_name', v_req.full_name
    )
  )
  returning * into v_room;

  insert into public.chat_audit_log (room_id, actor_type, actor_ref, action, meta_json)
  values (
    v_room.id,
    'guest',
    nullif(trim(p_phone), ''),
    'room_created',
    jsonb_build_object('join_request_id', v_req.id, 'reference_code', v_req.reference_code)
  );

  return v_room;
end;
$$;

grant execute on function public.chat_guest_open_join_room(text, text) to anon, authenticated;
