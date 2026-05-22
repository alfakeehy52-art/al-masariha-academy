-- ═══════════════════════════════════════════════════════════
-- تنظيف بيانات تجريبية — أكاديمية المسارحة
-- ═══════════════════════════════════════════════════════════
--
-- ⚠️ تحذير — اقرأ قبل التنفيذ:
-- 1) خذ نسخة احتياطية من Supabase (Database → Backups أو تصدير يدوي).
-- 2) راجع الأعداد أولاً (استبدل SELECT بالأسفل ثم نفّذ DELETE).
-- 3) لا يحذف: جدول academy_settings.
-- 4) لا يحذف مستخدمي Auth تلقائياً — احذفهم يدوياً من Authentication → Users.
-- 5) بعد SQL: Storage → bucket academy_files → احذف الملفات التجريبية.
--
-- ═══════════════════════════════════════════════════════════

-- ─── معاينة الأعداد (نفّذ أولاً) ───
-- SELECT 'join_requests' AS tbl, count(*) FROM join_requests
-- UNION ALL SELECT 'players', count(*) FROM players
-- UNION ALL SELECT 'request_completions', count(*) FROM request_completions;

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
