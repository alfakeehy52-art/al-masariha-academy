-- =====================================================
-- إصلاح: عرض اللاعبين للزوار (صفحة اللاعبين + الرئيسية)
-- نفّذ في Supabase SQL Editor إذا كانت قائمة اللاعبين فارغة للعامة
-- =====================================================

drop policy if exists players_public_select on public.players;
create policy players_public_select on public.players
  for select to anon, authenticated
  using (
    coalesce(status, '') in ('active', 'نشط', 'مكتمل')
    or coalesce(player_status, '') in ('active', 'نشط', 'معتمد', 'مكتمل')
  );

-- تحقق (anon يرى اللاعبين النشطين فقط):
-- select id, full_name, status from public.players limit 5;
