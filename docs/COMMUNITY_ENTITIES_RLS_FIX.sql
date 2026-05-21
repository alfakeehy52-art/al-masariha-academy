-- =====================================================
-- تنظيف سياسات guardians / supporters / volunteers / player_guardians
-- المطلوب: سياسة واحدة لكل جدول — admin_manage_* فقط
-- =====================================================

-- guardians
drop policy if exists "Allow all guardians" on public.guardians;
drop policy if exists academy_dev_guardians_all on public.guardians;
drop policy if exists "guardians_all" on public.guardians;
drop policy if exists guardians_select on public.guardians;
drop policy if exists guardians_insert on public.guardians;
drop policy if exists guardians_update on public.guardians;
drop policy if exists guardians_delete on public.guardians;
drop policy if exists "Enable read access for all users" on public.guardians;
drop policy if exists "Public read guardians" on public.guardians;
drop policy if exists "allow_all_guardians" on public.guardians;
drop policy if exists "Allow admin read guardians" on public.guardians;
drop policy if exists "Allow anon read guardians" on public.guardians;

drop policy if exists admin_manage_guardians on public.guardians;
create policy admin_manage_guardians on public.guardians
  for all to authenticated
  using (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  )
  with check (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  );

-- supporters
drop policy if exists "Allow all supporters" on public.supporters;
drop policy if exists academy_dev_supporters_all on public.supporters;
drop policy if exists "supporters_all" on public.supporters;
drop policy if exists supporters_select on public.supporters;
drop policy if exists supporters_insert on public.supporters;
drop policy if exists supporters_update on public.supporters;
drop policy if exists supporters_delete on public.supporters;
drop policy if exists "Enable read access for all users" on public.supporters;
drop policy if exists "Public read supporters" on public.supporters;
drop policy if exists "allow_all_supporters" on public.supporters;

drop policy if exists admin_manage_supporters on public.supporters;
create policy admin_manage_supporters on public.supporters
  for all to authenticated
  using (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  )
  with check (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  );

-- volunteers
drop policy if exists "Allow all volunteers" on public.volunteers;
drop policy if exists academy_dev_volunteers_all on public.volunteers;
drop policy if exists "volunteers_all" on public.volunteers;
drop policy if exists volunteers_select on public.volunteers;
drop policy if exists volunteers_insert on public.volunteers;
drop policy if exists volunteers_update on public.volunteers;
drop policy if exists volunteers_delete on public.volunteers;
drop policy if exists "Enable read access for all users" on public.volunteers;
drop policy if exists "Public read volunteers" on public.volunteers;
drop policy if exists "allow_all_volunteers" on public.volunteers;

drop policy if exists admin_manage_volunteers on public.volunteers;
create policy admin_manage_volunteers on public.volunteers
  for all to authenticated
  using (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  )
  with check (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  );

-- player_guardians
drop policy if exists "Allow all player_guardians" on public.player_guardians;
drop policy if exists academy_dev_player_guardians_all on public.player_guardians;
drop policy if exists "player_guardians_all" on public.player_guardians;
drop policy if exists player_guardians_select on public.player_guardians;
drop policy if exists player_guardians_insert on public.player_guardians;
drop policy if exists player_guardians_update on public.player_guardians;
drop policy if exists player_guardians_delete on public.player_guardians;

drop policy if exists admin_manage_player_guardians on public.player_guardians;
create policy admin_manage_player_guardians on public.player_guardians
  for all to authenticated
  using (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  )
  with check (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  );
