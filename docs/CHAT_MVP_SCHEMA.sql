-- نظام التواصل التشغيلي — MVP (جداول + فهارس)
-- نفّذ في Supabase SQL Editor بعد مراجعة RLS مع فريق المشروع
-- مرجع: docs/CHAT_SYSTEM_DISCUSSION.md

-- أنواع الغرفة
-- join_request | guardian | staff | temporary_invite | admin_support

-- الاحتفاظ
-- permanent | 90_days | temporary

create table if not exists public.chat_rooms (
  id uuid primary key default gen_random_uuid(),
  room_type text not null,
  room_retention_type text not null default 'permanent',
  related_entity_table text,
  related_entity_id text,
  title_ar text not null default 'محادثة',
  status text not null default 'open', -- open | closed | archived
  context_json jsonb not null default '{}'::jsonb,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint chat_rooms_room_type_check check (
    room_type in ('join_request', 'guardian', 'staff', 'temporary_invite', 'admin_support')
  ),
  constraint chat_rooms_retention_check check (
    room_retention_type in ('permanent', '90_days', 'temporary')
  ),
  constraint chat_rooms_status_check check (status in ('open', 'closed', 'archived'))
);

create index if not exists chat_rooms_entity_idx
  on public.chat_rooms (related_entity_table, related_entity_id);

create index if not exists chat_rooms_type_status_idx
  on public.chat_rooms (room_type, status, last_message_at desc);

create table if not exists public.chat_members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  member_type text not null, -- admin_user | guardian | guest | system
  member_ref text not null, -- admin id / guardian id / invite id
  role text not null default 'member', -- owner | admin | supervisor | member | guest
  can_write boolean not null default true,
  is_muted boolean not null default false,
  unread_count int not null default 0,
  last_read_at timestamptz,
  joined_at timestamptz not null default now(),
  unique (room_id, member_type, member_ref)
);

create index if not exists chat_members_room_idx on public.chat_members (room_id);
create index if not exists chat_members_ref_idx on public.chat_members (member_type, member_ref);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  sender_type text not null,
  sender_ref text not null,
  body text,
  attachment_type text, -- image | pdf | null
  attachment_path text,
  attachment_name text,
  attachment_size_bytes int,
  is_pinned boolean not null default false,
  deleted_at timestamptz,
  deleted_by_type text,
  deleted_by_ref text,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_room_created_idx
  on public.chat_messages (room_id, created_at desc);

create table if not exists public.chat_invites (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  slug text not null unique,
  pin_hash text,
  label_ar text,
  max_uses int not null default 1,
  use_count int not null default 0,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_by_type text not null default 'admin',
  created_by_ref text,
  created_at timestamptz not null default now()
);

create index if not exists chat_invites_slug_idx on public.chat_invites (slug);

create table if not exists public.chat_audit_log (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.chat_rooms(id) on delete set null,
  actor_type text not null,
  actor_ref text not null,
  action text not null,
  target_type text,
  target_id text,
  meta_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists chat_audit_room_idx on public.chat_audit_log (room_id, created_at desc);

create table if not exists public.chat_notifications (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  recipient_type text not null,
  recipient_ref text not null,
  message_id uuid references public.chat_messages(id) on delete set null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists chat_notifications_recipient_idx
  on public.chat_notifications (recipient_type, recipient_ref, is_read, created_at desc);

-- تحديث last_message_at (يُستدعى من التطبيق أو trigger لاحقاً)
-- RLS: يُضاف في CHAT_MVP_RLS.sql منفصل بعد تعريف سياسات admin/guardian/guest

comment on table public.chat_rooms is 'غرف تواصل تشغيلي — كل غرفة مربوطة بسجل رسمي';
comment on column public.chat_rooms.related_entity_table is 'مثال: join_requests, players, guardians';
comment on column public.chat_rooms.related_entity_id is 'معرّف السجل في الجدول المرتبط';

-- تحقق:
-- select room_type, room_retention_type, related_entity_table, related_entity_id from public.chat_rooms limit 5;
