-- =====================================================
-- المرحلة 1 فقط: تنظيف سياسات RLS المفتوحة (DROP فقط)
-- =====================================================
-- لا ينشئ سياسات جديدة.
-- لا يحذف: join_requests_public_insert, admin_manage_join_requests, admin_manage_players
-- (غير موجودة عادةً قبل التنفيذ — مذكورة للأمان)
--
-- نفّذ في Supabase SQL Editor
-- ثم راجع النتائج بـ الاستعلام في الأسفل قبل JOIN_REQUESTS_RLS.sql

-- ─── 0) لقطة قبل التنظيف (اختياري — للمراجعة) ───
-- select tablename, policyname, cmd, qual, with_check
-- from pg_policies
-- where schemaname = 'public' and tablename in ('join_requests', 'players')
-- order by tablename, policyname;

-- =====================================================
-- join_requests — legacy / dev / duplicate (كلها مفتوحة)
-- =====================================================

drop policy if exists "Allow insert for everyone" on public.join_requests;
drop policy if exists "Allow select for everyone" on public.join_requests;
drop policy if exists "Allow update for everyone" on public.join_requests;
drop policy if exists "Allow select join_requests" on public.join_requests;
drop policy if exists "Allow public insert join_requests" on public.join_requests;
drop policy if exists "Allow read join_requests" on public.join_requests;
drop policy if exists "Allow update join_requests" on public.join_requests;
drop policy if exists "Allow delete join_requests" on public.join_requests;
drop policy if exists "Allow read all" on public.join_requests;
drop policy if exists "Allow insert" on public.join_requests;
drop policy if exists "Allow update" on public.join_requests;

drop policy if exists academy_dev_join_requests_select on public.join_requests;
drop policy if exists academy_dev_join_requests_insert on public.join_requests;
drop policy if exists academy_dev_join_requests_update on public.join_requests;

-- أسماء شائعة إضافية (إن وُجدت من سكربتات قديمة)
drop policy if exists "join_requests_all" on public.join_requests;
drop policy if exists "Enable read access for all users" on public.join_requests;
drop policy if exists "Enable insert for authenticated users only" on public.join_requests;
drop policy if exists "Enable insert for anon" on public.join_requests;
drop policy if exists "Public read join_requests" on public.join_requests;
drop policy if exists allow_all_join_requests on public.join_requests;
drop policy if exists join_requests_select on public.join_requests;
drop policy if exists join_requests_insert on public.join_requests;
drop policy if exists join_requests_update on public.join_requests;
drop policy if exists join_requests_delete on public.join_requests;

-- =====================================================
-- players — legacy / dev / duplicate (كلها مفتوحة)
-- =====================================================

drop policy if exists "Full access players" on public.players;
drop policy if exists "Allow public read players" on public.players;
drop policy if exists "Allow insert players" on public.players;
drop policy if exists "Allow update players" on public.players;
drop policy if exists "Allow delete players" on public.players;
drop policy if exists "Allow all players" on public.players;

drop policy if exists academy_dev_players_all on public.players;

-- أسماء شائعة إضافية (إن وُجدت)
drop policy if exists "players_all" on public.players;
drop policy if exists "Enable read access for all users" on public.players;
drop policy if exists "Public read players" on public.players;
drop policy if exists allow_all_players on public.players;
drop policy if exists players_select on public.players;
drop policy if exists players_insert on public.players;
drop policy if exists players_update on public.players;
drop policy if exists players_delete on public.players;

-- =====================================================
-- بعد التنفيذ: تحقق أن لا تبقى سياسة بـ qual=true
-- =====================================================

select
  tablename,
  policyname,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('join_requests', 'players')
order by tablename, policyname;

-- المتوقع بعد التنظيف: 0 rows
-- إن ظهرت سياسة لم تُذكر أعلاه، أرسل اسمها قبل تنفيذ JOIN_REQUESTS_RLS.sql
