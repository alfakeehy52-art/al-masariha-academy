-- =====================================================
-- RBAC-3 — RLS كامل حسب Domain (Level × Domain)
-- نفّذ في Supabase → SQL Editor (مرة واحدة)
-- بعد: STAFF_AUTH_RLS + AUDIT_LOG + SUPPORT_TICKETS + جداول RLS السابقة
-- =====================================================
-- يستبدل سياسات admin_manage_* (JWT role=admin فقط)
-- بسياسات panel_staff_* حسب academy_staff.panel_domains + panel_level
-- لا يمس: insert عامة (anon) · RPC security definer · قراءة published

-- ═══════════════════════════════════════════════════════
-- 1) دوال مساعدة مركزية
-- ═══════════════════════════════════════════════════════

create or replace function public.panel_is_jwt_admin()
returns boolean
language sql
stable
set search_path = public
as $$
  select
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin';
$$;

create or replace function public.panel_staff_has_domain(p_domain text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.panel_is_jwt_admin()
    or exists (
      select 1
      from public.academy_staff s
      where s.auth_user_id = auth.uid()
        and s.status = 'active'
        and (
          s.panel_level = 'L1'
          or s.panel_domains @> '["*"]'::jsonb
          or s.panel_domains @> to_jsonb(array[p_domain])
        )
    );
$$;

create or replace function public.panel_staff_can_write(p_domain text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.panel_is_jwt_admin()
    or exists (
      select 1
      from public.academy_staff s
      where s.auth_user_id = auth.uid()
        and s.status = 'active'
        and s.panel_level <> 'L5'
        and (
          s.panel_level = 'L1'
          or s.panel_domains @> '["*"]'::jsonb
          or s.panel_domains @> to_jsonb(array[p_domain])
        )
    );
$$;

create or replace function public.panel_staff_can_delete(p_domain text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.panel_is_jwt_admin()
    or exists (
      select 1
      from public.academy_staff s
      where s.auth_user_id = auth.uid()
        and s.status = 'active'
        and s.panel_level in ('L1', 'L2')
        and (
          s.panel_level = 'L1'
          or s.panel_domains @> '["*"]'::jsonb
          or s.panel_domains @> to_jsonb(array[p_domain])
        )
    );
$$;

create or replace function public.panel_staff_can_read_system()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.panel_is_jwt_admin()
    or exists (
      select 1
      from public.academy_staff s
      where s.auth_user_id = auth.uid()
        and s.status = 'active'
        and s.panel_level in ('L1', 'L2')
        and (
          s.panel_level = 'L1'
          or s.panel_domains @> '["*"]'::jsonb
          or s.panel_domains @> '["system"]'::jsonb
        )
    );
$$;

create or replace function public.panel_staff_can_write_system()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.panel_is_jwt_admin()
    or exists (
      select 1
      from public.academy_staff s
      where s.auth_user_id = auth.uid()
        and s.status = 'active'
        and s.panel_level = 'L1'
    );
$$;

-- توافق مع support_tickets السابق
create or replace function public.panel_staff_support_can_delete()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.panel_staff_can_delete('support');
$$;

-- محادثات: دعم فني + موظفو الطلبات
create or replace function public.is_chat_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.panel_staff_has_domain('support')
    or public.panel_staff_has_domain('requests');
$$;

revoke all on function public.panel_is_jwt_admin() from public;
grant execute on function public.panel_is_jwt_admin() to authenticated;

revoke all on function public.panel_staff_has_domain(text) from public;
grant execute on function public.panel_staff_has_domain(text) to authenticated;

revoke all on function public.panel_staff_can_write(text) from public;
grant execute on function public.panel_staff_can_write(text) to authenticated;

revoke all on function public.panel_staff_can_delete(text) from public;
grant execute on function public.panel_staff_can_delete(text) to authenticated;

revoke all on function public.panel_staff_can_read_system() from public;
grant execute on function public.panel_staff_can_read_system() to authenticated;

revoke all on function public.panel_staff_can_write_system() from public;
grant execute on function public.panel_staff_can_write_system() to authenticated;

revoke all on function public.panel_staff_support_can_delete() from public;
grant execute on function public.panel_staff_support_can_delete() to authenticated;

revoke all on function public.is_chat_admin() from public;
grant execute on function public.is_chat_admin() to authenticated;

-- ═══════════════════════════════════════════════════════
-- 2) requests — join_requests · request_completions
-- ═══════════════════════════════════════════════════════

alter table public.join_requests enable row level security;
drop policy if exists admin_manage_join_requests on public.join_requests;
drop policy if exists panel_join_requests_select on public.join_requests;
drop policy if exists panel_join_requests_insert on public.join_requests;
drop policy if exists panel_join_requests_update on public.join_requests;
drop policy if exists panel_join_requests_delete on public.join_requests;

create policy panel_join_requests_select on public.join_requests
  for select to authenticated
  using (public.panel_staff_has_domain('requests'));

create policy panel_join_requests_insert on public.join_requests
  for insert to authenticated
  with check (public.panel_staff_can_write('requests'));

create policy panel_join_requests_update on public.join_requests
  for update to authenticated
  using (public.panel_staff_can_write('requests'))
  with check (public.panel_staff_can_write('requests'));

create policy panel_join_requests_delete on public.join_requests
  for delete to authenticated
  using (public.panel_staff_can_delete('requests'));

alter table public.request_completions enable row level security;
drop policy if exists admin_manage_request_completions on public.request_completions;
drop policy if exists panel_request_completions_select on public.request_completions;
drop policy if exists panel_request_completions_insert on public.request_completions;
drop policy if exists panel_request_completions_update on public.request_completions;
drop policy if exists panel_request_completions_delete on public.request_completions;

create policy panel_request_completions_select on public.request_completions
  for select to authenticated
  using (public.panel_staff_has_domain('requests'));

create policy panel_request_completions_insert on public.request_completions
  for insert to authenticated
  with check (public.panel_staff_can_write('requests'));

create policy panel_request_completions_update on public.request_completions
  for update to authenticated
  using (public.panel_staff_can_write('requests'))
  with check (public.panel_staff_can_write('requests'));

create policy panel_request_completions_delete on public.request_completions
  for delete to authenticated
  using (public.panel_staff_can_delete('requests'));

-- ═══════════════════════════════════════════════════════
-- 3) support — contact_messages · support_tickets
-- ═══════════════════════════════════════════════════════

alter table public.contact_messages enable row level security;
drop policy if exists admin_manage_contact_messages on public.contact_messages;
drop policy if exists panel_contact_messages_select on public.contact_messages;
drop policy if exists panel_contact_messages_insert on public.contact_messages;
drop policy if exists panel_contact_messages_update on public.contact_messages;
drop policy if exists panel_contact_messages_delete on public.contact_messages;

create policy panel_contact_messages_select on public.contact_messages
  for select to authenticated
  using (public.panel_staff_has_domain('support'));

create policy panel_contact_messages_insert on public.contact_messages
  for insert to authenticated
  with check (public.panel_staff_can_write('support'));

create policy panel_contact_messages_update on public.contact_messages
  for update to authenticated
  using (public.panel_staff_can_write('support'))
  with check (public.panel_staff_can_write('support'));

create policy panel_contact_messages_delete on public.contact_messages
  for delete to authenticated
  using (public.panel_staff_can_delete('support'));

-- support_tickets: إعادة تطبيق بالدوال الموحّدة
alter table public.support_tickets enable row level security;
drop policy if exists support_tickets_staff_select on public.support_tickets;
drop policy if exists support_tickets_staff_insert on public.support_tickets;
drop policy if exists support_tickets_staff_update on public.support_tickets;
drop policy if exists support_tickets_staff_delete on public.support_tickets;

create policy support_tickets_staff_select on public.support_tickets
  for select to authenticated
  using (public.panel_staff_has_domain('support'));

create policy support_tickets_staff_insert on public.support_tickets
  for insert to authenticated
  with check (public.panel_staff_can_write('support'));

create policy support_tickets_staff_update on public.support_tickets
  for update to authenticated
  using (public.panel_staff_can_write('support'))
  with check (public.panel_staff_can_write('support'));

create policy support_tickets_staff_delete on public.support_tickets
  for delete to authenticated
  using (public.panel_staff_can_delete('support'));

-- ═══════════════════════════════════════════════════════
-- 4) store — store_products · store_orders
-- ═══════════════════════════════════════════════════════

alter table public.store_products enable row level security;
drop policy if exists admin_manage_store_products on public.store_products;
drop policy if exists panel_store_products_select on public.store_products;
drop policy if exists panel_store_products_insert on public.store_products;
drop policy if exists panel_store_products_update on public.store_products;
drop policy if exists panel_store_products_delete on public.store_products;

create policy panel_store_products_select on public.store_products
  for select to authenticated
  using (public.panel_staff_has_domain('store'));

create policy panel_store_products_insert on public.store_products
  for insert to authenticated
  with check (public.panel_staff_can_write('store'));

create policy panel_store_products_update on public.store_products
  for update to authenticated
  using (public.panel_staff_can_write('store'))
  with check (public.panel_staff_can_write('store'));

create policy panel_store_products_delete on public.store_products
  for delete to authenticated
  using (public.panel_staff_can_delete('store'));

alter table public.store_orders enable row level security;
drop policy if exists admin_manage_store_orders on public.store_orders;
drop policy if exists panel_store_orders_select on public.store_orders;
drop policy if exists panel_store_orders_insert on public.store_orders;
drop policy if exists panel_store_orders_update on public.store_orders;
drop policy if exists panel_store_orders_delete on public.store_orders;

create policy panel_store_orders_select on public.store_orders
  for select to authenticated
  using (public.panel_staff_has_domain('store'));

create policy panel_store_orders_insert on public.store_orders
  for insert to authenticated
  with check (public.panel_staff_can_write('store'));

create policy panel_store_orders_update on public.store_orders
  for update to authenticated
  using (public.panel_staff_can_write('store'))
  with check (public.panel_staff_can_write('store'));

create policy panel_store_orders_delete on public.store_orders
  for delete to authenticated
  using (public.panel_staff_can_delete('store'));

-- ═══════════════════════════════════════════════════════
-- 5) media — academy_news · academy_media
-- ═══════════════════════════════════════════════════════

alter table public.academy_news enable row level security;
drop policy if exists admin_manage_academy_news on public.academy_news;
drop policy if exists panel_academy_news_select on public.academy_news;
drop policy if exists panel_academy_news_insert on public.academy_news;
drop policy if exists panel_academy_news_update on public.academy_news;
drop policy if exists panel_academy_news_delete on public.academy_news;

create policy panel_academy_news_select on public.academy_news
  for select to authenticated
  using (public.panel_staff_has_domain('media'));

create policy panel_academy_news_insert on public.academy_news
  for insert to authenticated
  with check (public.panel_staff_can_write('media'));

create policy panel_academy_news_update on public.academy_news
  for update to authenticated
  using (public.panel_staff_can_write('media'))
  with check (public.panel_staff_can_write('media'));

create policy panel_academy_news_delete on public.academy_news
  for delete to authenticated
  using (public.panel_staff_can_delete('media'));

alter table public.academy_media enable row level security;
drop policy if exists admin_manage_academy_media on public.academy_media;
drop policy if exists panel_academy_media_select on public.academy_media;
drop policy if exists panel_academy_media_insert on public.academy_media;
drop policy if exists panel_academy_media_update on public.academy_media;
drop policy if exists panel_academy_media_delete on public.academy_media;

create policy panel_academy_media_select on public.academy_media
  for select to authenticated
  using (public.panel_staff_has_domain('media'));

create policy panel_academy_media_insert on public.academy_media
  for insert to authenticated
  with check (public.panel_staff_can_write('media'));

create policy panel_academy_media_update on public.academy_media
  for update to authenticated
  using (public.panel_staff_can_write('media'))
  with check (public.panel_staff_can_write('media'));

create policy panel_academy_media_delete on public.academy_media
  for delete to authenticated
  using (public.panel_staff_can_delete('media'));

-- ═══════════════════════════════════════════════════════
-- 6) members — players · coaches · guardians · supporters · volunteers · academy_members · player_guardians
-- ═══════════════════════════════════════════════════════

alter table public.players enable row level security;
drop policy if exists admin_manage_players on public.players;
drop policy if exists panel_players_select on public.players;
drop policy if exists panel_players_insert on public.players;
drop policy if exists panel_players_update on public.players;
drop policy if exists panel_players_delete on public.players;

create policy panel_players_select on public.players
  for select to authenticated using (public.panel_staff_has_domain('members'));
create policy panel_players_insert on public.players
  for insert to authenticated with check (public.panel_staff_can_write('members'));
create policy panel_players_update on public.players
  for update to authenticated
  using (public.panel_staff_can_write('members'))
  with check (public.panel_staff_can_write('members'));
create policy panel_players_delete on public.players
  for delete to authenticated using (public.panel_staff_can_delete('members'));

alter table public.coaches enable row level security;
drop policy if exists admin_manage_coaches on public.coaches;
drop policy if exists panel_coaches_select on public.coaches;
drop policy if exists panel_coaches_insert on public.coaches;
drop policy if exists panel_coaches_update on public.coaches;
drop policy if exists panel_coaches_delete on public.coaches;

create policy panel_coaches_select on public.coaches
  for select to authenticated using (public.panel_staff_has_domain('members'));
create policy panel_coaches_insert on public.coaches
  for insert to authenticated with check (public.panel_staff_can_write('members'));
create policy panel_coaches_update on public.coaches
  for update to authenticated
  using (public.panel_staff_can_write('members'))
  with check (public.panel_staff_can_write('members'));
create policy panel_coaches_delete on public.coaches
  for delete to authenticated using (public.panel_staff_can_delete('members'));

alter table public.guardians enable row level security;
drop policy if exists admin_manage_guardians on public.guardians;
drop policy if exists panel_guardians_select on public.guardians;
drop policy if exists panel_guardians_insert on public.guardians;
drop policy if exists panel_guardians_update on public.guardians;
drop policy if exists panel_guardians_delete on public.guardians;

create policy panel_guardians_select on public.guardians
  for select to authenticated using (public.panel_staff_has_domain('members'));
create policy panel_guardians_insert on public.guardians
  for insert to authenticated with check (public.panel_staff_can_write('members'));
create policy panel_guardians_update on public.guardians
  for update to authenticated
  using (public.panel_staff_can_write('members'))
  with check (public.panel_staff_can_write('members'));
create policy panel_guardians_delete on public.guardians
  for delete to authenticated using (public.panel_staff_can_delete('members'));

alter table public.supporters enable row level security;
drop policy if exists admin_manage_supporters on public.supporters;
drop policy if exists panel_supporters_select on public.supporters;
drop policy if exists panel_supporters_insert on public.supporters;
drop policy if exists panel_supporters_update on public.supporters;
drop policy if exists panel_supporters_delete on public.supporters;

create policy panel_supporters_select on public.supporters
  for select to authenticated using (public.panel_staff_has_domain('members'));
create policy panel_supporters_insert on public.supporters
  for insert to authenticated with check (public.panel_staff_can_write('members'));
create policy panel_supporters_update on public.supporters
  for update to authenticated
  using (public.panel_staff_can_write('members'))
  with check (public.panel_staff_can_write('members'));
create policy panel_supporters_delete on public.supporters
  for delete to authenticated using (public.panel_staff_can_delete('members'));

alter table public.volunteers enable row level security;
drop policy if exists admin_manage_volunteers on public.volunteers;
drop policy if exists panel_volunteers_select on public.volunteers;
drop policy if exists panel_volunteers_insert on public.volunteers;
drop policy if exists panel_volunteers_update on public.volunteers;
drop policy if exists panel_volunteers_delete on public.volunteers;

create policy panel_volunteers_select on public.volunteers
  for select to authenticated using (public.panel_staff_has_domain('members'));
create policy panel_volunteers_insert on public.volunteers
  for insert to authenticated with check (public.panel_staff_can_write('members'));
create policy panel_volunteers_update on public.volunteers
  for update to authenticated
  using (public.panel_staff_can_write('members'))
  with check (public.panel_staff_can_write('members'));
create policy panel_volunteers_delete on public.volunteers
  for delete to authenticated using (public.panel_staff_can_delete('members'));

alter table public.academy_members enable row level security;
drop policy if exists admin_manage_academy_members on public.academy_members;
drop policy if exists panel_academy_members_select on public.academy_members;
drop policy if exists panel_academy_members_insert on public.academy_members;
drop policy if exists panel_academy_members_update on public.academy_members;
drop policy if exists panel_academy_members_delete on public.academy_members;

create policy panel_academy_members_select on public.academy_members
  for select to authenticated using (public.panel_staff_has_domain('members'));
create policy panel_academy_members_insert on public.academy_members
  for insert to authenticated with check (public.panel_staff_can_write('members'));
create policy panel_academy_members_update on public.academy_members
  for update to authenticated
  using (public.panel_staff_can_write('members'))
  with check (public.panel_staff_can_write('members'));
create policy panel_academy_members_delete on public.academy_members
  for delete to authenticated using (public.panel_staff_can_delete('members'));

alter table public.player_guardians enable row level security;
drop policy if exists admin_manage_player_guardians on public.player_guardians;
drop policy if exists panel_player_guardians_select on public.player_guardians;
drop policy if exists panel_player_guardians_insert on public.player_guardians;
drop policy if exists panel_player_guardians_update on public.player_guardians;
drop policy if exists panel_player_guardians_delete on public.player_guardians;

create policy panel_player_guardians_select on public.player_guardians
  for select to authenticated using (public.panel_staff_has_domain('members'));
create policy panel_player_guardians_insert on public.player_guardians
  for insert to authenticated with check (public.panel_staff_can_write('members'));
create policy panel_player_guardians_update on public.player_guardians
  for update to authenticated
  using (public.panel_staff_can_write('members'))
  with check (public.panel_staff_can_write('members'));
create policy panel_player_guardians_delete on public.player_guardians
  for delete to authenticated using (public.panel_staff_can_delete('members'));

-- ═══════════════════════════════════════════════════════
-- 7) ops — matches · teams
-- ═══════════════════════════════════════════════════════

alter table public.matches enable row level security;
drop policy if exists admin_manage_matches on public.matches;
drop policy if exists panel_matches_select on public.matches;
drop policy if exists panel_matches_insert on public.matches;
drop policy if exists panel_matches_update on public.matches;
drop policy if exists panel_matches_delete on public.matches;

create policy panel_matches_select on public.matches
  for select to authenticated using (public.panel_staff_has_domain('ops'));
create policy panel_matches_insert on public.matches
  for insert to authenticated with check (public.panel_staff_can_write('ops'));
create policy panel_matches_update on public.matches
  for update to authenticated
  using (public.panel_staff_can_write('ops'))
  with check (public.panel_staff_can_write('ops'));
create policy panel_matches_delete on public.matches
  for delete to authenticated using (public.panel_staff_can_delete('ops'));

alter table public.teams enable row level security;
drop policy if exists admin_manage_teams on public.teams;
drop policy if exists panel_teams_select on public.teams;
drop policy if exists panel_teams_insert on public.teams;
drop policy if exists panel_teams_update on public.teams;
drop policy if exists panel_teams_delete on public.teams;

create policy panel_teams_select on public.teams
  for select to authenticated using (public.panel_staff_has_domain('ops'));
create policy panel_teams_insert on public.teams
  for insert to authenticated with check (public.panel_staff_can_write('ops'));
create policy panel_teams_update on public.teams
  for update to authenticated
  using (public.panel_staff_can_write('ops'))
  with check (public.panel_staff_can_write('ops'));
create policy panel_teams_delete on public.teams
  for delete to authenticated using (public.panel_staff_can_delete('ops'));

-- ═══════════════════════════════════════════════════════
-- 8) system — academy_settings
-- ═══════════════════════════════════════════════════════

alter table public.academy_settings enable row level security;
drop policy if exists admin_manage_academy_settings on public.academy_settings;
drop policy if exists panel_academy_settings_update on public.academy_settings;

create policy panel_academy_settings_update on public.academy_settings
  for update to authenticated
  using (public.panel_staff_can_write_system())
  with check (public.panel_staff_can_write_system());

-- academy_settings_public_select (قراءة default) تبقى من ACADEMY_SETTINGS_RLS.sql

-- ═══════════════════════════════════════════════════════
-- تحقق سريع (اختياري):
-- select tablename, policyname from pg_policies
-- where schemaname = 'public' and policyname like 'panel_%'
-- order by tablename, policyname;
