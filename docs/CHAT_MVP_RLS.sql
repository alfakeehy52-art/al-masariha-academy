-- =====================================================
-- نظام التواصل MVP — RLS + دوال آمنة
-- نفّذ بعد CHAT_MVP_SCHEMA.sql في Supabase SQL Editor
-- =====================================================

create extension if not exists pgcrypto;

-- ─── مساعد: هل المستخدم إداري؟ ───
create or replace function public.is_chat_admin()
returns boolean
language sql
stable
as $$
  select
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin';
$$;

-- ─── محفّزات ───
create or replace function public.chat_rooms_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists chat_rooms_updated_at on public.chat_rooms;
create trigger chat_rooms_updated_at
  before update on public.chat_rooms
  for each row execute function public.chat_rooms_set_updated_at();

create or replace function public.chat_messages_touch_room()
returns trigger
language plpgsql
as $$
begin
  update public.chat_rooms
  set last_message_at = new.created_at,
      updated_at = now()
  where id = new.room_id;
  return new;
end;
$$;

drop trigger if exists chat_messages_after_insert on public.chat_messages;
create trigger chat_messages_after_insert
  after insert on public.chat_messages
  for each row execute function public.chat_messages_touch_room();

-- غرفة واحدة مفتوحة لكل كيان (اختياري لكن مُفضّل)
create unique index if not exists chat_rooms_one_open_per_entity
  on public.chat_rooms (related_entity_table, related_entity_id)
  where status = 'open'
    and related_entity_table is not null
    and related_entity_id is not null;

-- ─── تفعيل RLS ───
alter table public.chat_rooms enable row level security;
alter table public.chat_members enable row level security;
alter table public.chat_messages enable row level security;
alter table public.chat_invites enable row level security;
alter table public.chat_audit_log enable row level security;
alter table public.chat_notifications enable row level security;

-- ─── إزالة سياسات قديمة إن وُجدت ───
drop policy if exists admin_manage_chat_rooms on public.chat_rooms;
drop policy if exists admin_manage_chat_members on public.chat_members;
drop policy if exists admin_manage_chat_messages on public.chat_messages;
drop policy if exists admin_manage_chat_invites on public.chat_invites;
drop policy if exists admin_manage_chat_audit_log on public.chat_audit_log;
drop policy if exists admin_manage_chat_notifications on public.chat_notifications;

-- ─── الإدارة: وصول كامل (authenticated + role admin) ───
create policy admin_manage_chat_rooms on public.chat_rooms
  for all to authenticated
  using (public.is_chat_admin())
  with check (public.is_chat_admin());

create policy admin_manage_chat_members on public.chat_members
  for all to authenticated
  using (public.is_chat_admin())
  with check (public.is_chat_admin());

create policy admin_manage_chat_messages on public.chat_messages
  for all to authenticated
  using (public.is_chat_admin())
  with check (public.is_chat_admin());

create policy admin_manage_chat_invites on public.chat_invites
  for all to authenticated
  using (public.is_chat_admin())
  with check (public.is_chat_admin());

create policy admin_manage_chat_audit_log on public.chat_audit_log
  for all to authenticated
  using (public.is_chat_admin())
  with check (public.is_chat_admin());

create policy admin_manage_chat_notifications on public.chat_notifications
  for all to authenticated
  using (public.is_chat_admin())
  with check (public.is_chat_admin());

-- ─── تحقق من طلب انضمام (ref + phone) ───
create or replace function public.chat_verify_join_request(p_ref text, p_phone text)
returns public.join_requests
language sql
security definer
set search_path = public
stable
as $$
  select jr.*
  from public.join_requests jr
  where jr.reference_code = nullif(trim(p_ref), '')
    and jr.phone = nullif(trim(p_phone), '')
  limit 1;
$$;

-- ─── إنشاء/جلب غرفة طلب (إدارة) ───
create or replace function public.chat_admin_ensure_join_room(p_join_request_id uuid)
returns public.chat_rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req public.join_requests;
  v_room public.chat_rooms;
begin
  if not public.is_chat_admin() then
    raise exception 'admin only';
  end if;

  select * into v_req from public.join_requests where id = p_join_request_id;
  if not found then
    raise exception 'join request not found';
  end if;

  select * into v_room
  from public.chat_rooms
  where related_entity_table = 'join_requests'
    and related_entity_id = v_req.id::text
    and status = 'open'
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
    'admin',
    coalesce(auth.uid()::text, 'system'),
    'room_created',
    jsonb_build_object('join_request_id', v_req.id)
  );

  return v_room;
end;
$$;

-- ─── ولي/مقدّم الطلب: فتح غرفة الطلب (ref + phone) ───
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

  if not found then
    raise exception 'no chat room for this request yet';
  end if;

  return v_room;
end;
$$;

-- ─── قائمة رسائل الغرفة (إدارة أو ضيف طلب) ───
create or replace function public.chat_list_messages(
  p_room_id uuid,
  p_ref text default null,
  p_phone text default null,
  p_limit int default 50
)
returns setof public.chat_messages
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_room public.chat_rooms;
  v_req public.join_requests;
begin
  select * into v_room from public.chat_rooms where id = p_room_id;
  if not found then
    raise exception 'room not found';
  end if;

  if public.is_chat_admin() then
    return query
    select m.*
    from public.chat_messages m
    where m.room_id = p_room_id
      and m.deleted_at is null
    order by m.created_at asc
    limit greatest(1, least(coalesce(p_limit, 50), 200));
    return;
  end if;

  if v_room.related_entity_table = 'join_requests' then
    select * into v_req from public.chat_verify_join_request(p_ref, p_phone);
    if not found or v_req.id::text <> v_room.related_entity_id then
      raise exception 'access denied';
    end if;
    return query
    select m.*
    from public.chat_messages m
    where m.room_id = p_room_id
      and m.deleted_at is null
    order by m.created_at asc
    limit greatest(1, least(coalesce(p_limit, 50), 200));
    return;
  end if;

  raise exception 'access denied';
end;
$$;

-- ─── إرسال رسالة (إدارة أو ضيف طلب) ───
create or replace function public.chat_send_message(
  p_room_id uuid,
  p_body text,
  p_sender_label text default null,
  p_ref text default null,
  p_phone text default null
)
returns public.chat_messages
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.chat_rooms;
  v_req public.join_requests;
  v_msg public.chat_messages;
  v_sender_type text;
  v_sender_ref text;
begin
  if nullif(trim(p_body), '') is null then
    raise exception 'empty message';
  end if;

  select * into v_room from public.chat_rooms where id = p_room_id;
  if not found then
    raise exception 'room not found';
  end if;

  if v_room.status <> 'open' then
    raise exception 'room is not open';
  end if;

  if public.is_chat_admin() then
    v_sender_type := 'admin';
    v_sender_ref := coalesce(auth.uid()::text, 'admin');
  elsif v_room.related_entity_table = 'join_requests' then
    select * into v_req from public.chat_verify_join_request(p_ref, p_phone);
    if not found or v_req.id::text <> v_room.related_entity_id then
      raise exception 'access denied';
    end if;
    v_sender_type := 'guest';
    v_sender_ref := coalesce(v_req.reference_code, v_req.id::text);
  else
    raise exception 'access denied';
  end if;

  insert into public.chat_messages (room_id, sender_type, sender_ref, body)
  values (p_room_id, v_sender_type, v_sender_ref, trim(p_body))
  returning * into v_msg;

  return v_msg;
end;
$$;

-- ─── دعوة مؤقتة: فتح غرفة (slug + PIN اختياري) ───
create or replace function public.chat_invite_open(p_slug text, p_pin text default null)
returns public.chat_rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv public.chat_invites;
  v_hash text;
begin
  select * into v_inv
  from public.chat_invites
  where slug = nullif(trim(p_slug), '')
  limit 1;

  if not found then
    raise exception 'invite not found';
  end if;

  if v_inv.revoked_at is not null or v_inv.expires_at <= now() then
    raise exception 'invite expired or revoked';
  end if;

  if v_inv.use_count >= v_inv.max_uses then
    raise exception 'invite usage limit reached';
  end if;

  if v_inv.pin_hash is not null then
    v_hash := encode(digest(nullif(trim(p_pin), ''), 'sha256'), 'hex');
    if v_inv.pin_hash <> v_hash then
      raise exception 'invalid pin';
    end if;
  end if;

  update public.chat_invites
  set use_count = use_count + 1
  where id = v_inv.id;

  insert into public.chat_audit_log (room_id, actor_type, actor_ref, action, meta_json)
  values (v_inv.room_id, 'guest', v_inv.slug, 'invite_used', jsonb_build_object('invite_id', v_inv.id));

  return (select r from public.chat_rooms r where r.id = v_inv.room_id);
end;
$$;

-- ─── صلاحيات الدوال ───
revoke all on function public.is_chat_admin() from public;
grant execute on function public.is_chat_admin() to authenticated;

revoke all on function public.chat_verify_join_request(text, text) from public;
grant execute on function public.chat_verify_join_request(text, text) to anon, authenticated;

revoke all on function public.chat_admin_ensure_join_room(uuid) from public;
grant execute on function public.chat_admin_ensure_join_room(uuid) to authenticated;

revoke all on function public.chat_guest_open_join_room(text, text) from public;
grant execute on function public.chat_guest_open_join_room(text, text) to anon, authenticated;

revoke all on function public.chat_list_messages(uuid, text, text, int) from public;
grant execute on function public.chat_list_messages(uuid, text, text, int) to anon, authenticated;

revoke all on function public.chat_send_message(uuid, text, text, text, text) from public;
grant execute on function public.chat_send_message(uuid, text, text, text, text) to anon, authenticated;

revoke all on function public.chat_invite_open(text, text) from public;
grant execute on function public.chat_invite_open(text, text) to anon, authenticated;

-- تحقق (إدارة):
-- select public.chat_admin_ensure_join_room('uuid-طلب-هنا');
-- تحقق (ضيف):
-- select * from public.chat_guest_open_join_room('REQ-XXXX', '05xxxxxxxx');
-- select * from public.chat_list_messages('room-uuid', 'REQ-XXXX', '05xxxxxxxx', 30);
