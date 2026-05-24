-- ═══════════════════════════════════════════════════════════
-- تنظيف بيانات تجريبية — أكاديمية المسارحة
-- ═══════════════════════════════════════════════════════════
--
-- ⚠️ تحذير — اقرأ قبل التنفيذ:
-- 1) خطة Free: لا backup تلقائي — صدّر CSV يدوياً أولاً (راجع PHASE_G_DATA_OPERATIONS.md).
-- 2) نفّذ قسم «معاينة الأعداد» أدناه ووافق كتابياً قبل أي DELETE.
-- 3) لا يحذف: academy_settings. لا يحذف: chat_rooms / chat_messages (غير مدرجة هنا).
-- 4) لا يحذف مستخدمي Auth — يدوياً من Authentication → Users.
-- 5) بعد SQL: Storage → academy_files → احذف التجريبي يدوياً.
-- 6) السكربت يحذف كل الصفوف في الجداول المذكورة — ليس حذفاً انتقائياً لطلبات معيّنة.
--
-- تقرير الفحص: docs/PHASE_G_INSPECTION_2026-05-24.md
--
-- ═══════════════════════════════════════════════════════════

-- ─── معاينة الأعداد (نفّذ أولاً — قراءة فقط) ───
/*
SELECT 'join_requests' AS tbl, count(*) AS n FROM public.join_requests
UNION ALL SELECT 'request_completions', count(*) FROM public.request_completions
UNION ALL SELECT 'players', count(*) FROM public.players
UNION ALL SELECT 'coaches', count(*) FROM public.coaches
UNION ALL SELECT 'teams', count(*) FROM public.teams
UNION ALL SELECT 'guardians', count(*) FROM public.guardians
UNION ALL SELECT 'academy_staff', count(*) FROM public.academy_staff
UNION ALL SELECT 'academy_members', count(*) FROM public.academy_members
UNION ALL SELECT 'store_products', count(*) FROM public.store_products
UNION ALL SELECT 'store_orders', count(*) FROM public.store_orders
UNION ALL SELECT 'contact_messages', count(*) FROM public.contact_messages
ORDER BY tbl;
*/

-- ─── DELETE أدناه — لا تُنفَّذ إلا بعد موافقة المالك ───

BEGIN;

-- 1) روابط وجداول تابعة
DELETE FROM player_guardians;
DELETE FROM request_completions;
DELETE FROM admin_notifications;

-- 2) طلبات الانضمام
DELETE FROM join_requests;

-- 3) كيانات التشغيل
DELETE FROM players;
DELETE FROM coaches;
DELETE FROM guardians;
DELETE FROM supporters;
DELETE FROM volunteers;

-- 4) كادر (احتفظ بسجلك — عدّل WHERE قبل التنفيذ إن لزم)
-- DELETE FROM academy_staff WHERE email NOT IN ('alfakeehy52@gmail.com');

-- 5) عضوية / مجتمع / فرق / محتوى / متجر
DELETE FROM academy_members;
DELETE FROM teams;
DELETE FROM matches;
DELETE FROM academy_news;
DELETE FROM academy_media;
DELETE FROM contact_messages;
DELETE FROM store_orders;
DELETE FROM store_products;

COMMIT;

-- ═══════════════════════════════════════════════════════════
-- بعد SQL:
-- | Storage      | academy_files → احذف الملفات التجريبية |
-- | Auth         | Authentication → Users → احذف التجريبي |
-- | adminEmails  | supabase-config.js → بريد المدير فقط   |
-- ═══════════════════════════════════════════════════════════
