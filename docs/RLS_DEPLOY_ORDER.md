# ترتيب تطبيق سياسات RLS

> **متابعة المراحل الكاملة للموقع:** [`PROJECT_ROADMAP.md`](PROJECT_ROADMAP.md)

نفّذ في **Supabase → SQL Editor** بالترتيب:

0. [`RLS_CLEANUP_ANALYSIS.md`](RLS_CLEANUP_ANALYSIS.md) — مراجعة التحليل
1. [`RLS_CLEANUP_STEP1_DROP_ONLY.sql`](RLS_CLEANUP_STEP1_DROP_ONLY.sql) — **DROP فقط** (لا تنشئ سياسات جديدة)
2. تحقق: `pg_policies` لـ `join_requests` و `players` → يجب **0 rows**
3. [`JOIN_REQUESTS_RLS.sql`](JOIN_REQUESTS_RLS.sql) + اختبار
4. [`PLAYERS_RLS.sql`](PLAYERS_RLS.sql) + اختبار
4b. إن كانت صفحة اللاعبين فارغة للزوار: [`PLAYERS_RLS_PUBLIC_READ.sql`](PLAYERS_RLS_PUBLIC_READ.sql)
5. [`REQUEST_COMPLETIONS_RLS.sql`](REQUEST_COMPLETIONS_RLS.sql) + اختبار رفع المرفقات
6. [`COACHES_RLS.sql`](COACHES_RLS.sql) + اختبار صفحة المدربين العامة + الرئيسية ✅ (2026-05-21)
7. [`STORE_PRODUCTS_RLS.sql`](STORE_PRODUCTS_RLS.sql) + اختبار المتجر العام + لوحة الإدارة
8. [`TEAMS_RLS.sql`](TEAMS_RLS.sql) + اختبار صفحة الفرق العامة + لوحة الفرق
9. [`ACADEMY_MEMBERS_RLS.sql`](ACADEMY_MEMBERS_RLS.sql) + اختبار لوحة عضوية الأكاديمية + اعتماد طلب `academy_member`
10. إن ظهرت **أكثر من سياسة** على `academy_members`: [`ACADEMY_MEMBERS_RLS_FIX.sql`](ACADEMY_MEMBERS_RLS_FIX.sql) (حذف سياسات anon/public القديمة)
11. [`COMMUNITY_ENTITIES_RLS.sql`](COMMUNITY_ENTITIES_RLS.sql) — `guardians` + `supporters` + `volunteers` + `player_guardians`
12. إن ظهرت **3 سياسات لكل جدول** (12 صفاً): [`COMMUNITY_ENTITIES_RLS_FIX.sql`](COMMUNITY_ENTITIES_RLS_FIX.sql)
13. [`MATCHES_RLS.sql`](MATCHES_RLS.sql) + `matches_dashboard` + `al_masariha_matches_page.html`
14. [`NEWS_MEDIA_RLS.sql`](NEWS_MEDIA_RLS.sql) + `news_dashboard` + `media_dashboard` + الصفحات العامة
15. [`ACADEMY_STATS_RLS_STEP1_COLUMNS.sql`](ACADEMY_STATS_RLS_STEP1_COLUMNS.sql) ثم [`ACADEMY_STATS_RLS.sql`](ACADEMY_STATS_RLS.sql) + `al_masariha_stats_page.html`
16. [`CONTACT_MESSAGES_RLS.sql`](CONTACT_MESSAGES_RLS.sql) + `contact_messages_dashboard.html` + `al_masariha_contact_page.html`
17. [`STORE_ORDERS_RLS.sql`](STORE_ORDERS_RLS.sql) + `store_orders_dashboard.html` + `al_masariha_store_page.html`
18. [`ACADEMY_SETTINGS_RLS.sql`](ACADEMY_SETTINGS_RLS.sql) + `academy_settings_dashboard.html` + الهيدر/الفوتر/الرئيسية
19. [`AUDIT_LOG_SCHEMA.sql`](AUDIT_LOG_SCHEMA.sql) — جدول `audit_log` + RLS (RBAC-3)
20. [`SUPPORT_TICKETS_SCHEMA.sql`](SUPPORT_TICKETS_SCHEMA.sql) — جدول `support_tickets` + RLS + `support_tickets_dashboard.html`
21. [`PANEL_RLS_BY_DOMAIN.sql`](PANEL_RLS_BY_DOMAIN.sql) — **RLS كامل** حسب Domain (RBAC-3) — راجع [`PANEL_RLS_BY_DOMAIN.md`](PANEL_RLS_BY_DOMAIN.md)

( [`STAFF_AUTH_RLS.sql`](STAFF_AUTH_RLS.sql) — مُطبَّق مسبقاً على `academy_staff` )

بعد كل ملف:

```sql
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('academy_staff', 'join_requests', 'players', 'request_completions', 'coaches', 'store_products', 'store_orders', 'teams', 'academy_members', 'guardians', 'supporters', 'volunteers', 'player_guardians', 'matches', 'academy_news', 'academy_media', 'contact_messages', 'academy_settings')
ORDER BY tablename, policyname;
```

تأكد من عدم وجود سياسات بشرط `true` على الجداول الحساسة.

## اختبار سريع بعد التطبيق

| الاختبار | المتوقع |
|----------|---------|
| صفحة Join — إرسال طلب | نجاح INSERT |
| `request_status` — ref + phone | يعرض الطلب |
| `admin_requests` — قائمة الطلبات | admin يرى الكل |
| `join` — بحث لاعب (ولي أمر) | حتى 8 نتائج |
| `players_list_dashboard` — admin | يرى كل اللاعبين |
| `request_completion` — ref + phone | رفع ملف تجريبي → نجاح |
| `request_status` — بعد الرفع | حالة المرفقات «قيد المراجعة» |
| `al_masariha_coaches_page` — زائر | يعرض مدربين من `coaches` (بدون localStorage) |
| `coaches_dashboard` — admin | إضافة/حذف يعمل |
| `al_masariha_coach_profile?id=...` | ملف مدرب حقيقي |
| `store_products_dashboard` — admin | إضافة منتج → يظهر في Supabase |
| `al_masariha_store_page.html` — زائر | منتجات منشورة/قريبًا |
| `index.html` — قسم المتجر | منتجات مميزة من Supabase |
| `teams_categories_dashboard` — admin | إضافة/تعديل فرق |
| `al_masariha_teams_page.html` — زائر | فرق نشطة فقط (بدون «مراجعة») |
| `academy_members_dashboard` — admin | تحميل/قبول/رفض/إيقاف عضويات |
| `admin_requests` — اعتماد طلب `academy_member` | إنشاء سجل في `academy_members` |
| `guardians_dashboard` / `supporters_dashboard` / `volunteers_dashboard` | تحميل وتعديل السجلات |
| اعتماد طلب ولي أمر / داعم / متطوع | INSERT في الجدول المناسب + ربط `player_guardians` عند الحاجة |
| `matches_dashboard` — admin | إضافة مباراة → تظهر للزوار |
| `al_masariha_matches_page.html` | قائمة مباريات + رابط تفاصيل `?id=` |
| `news_dashboard` — admin | إضافة خبر منشور → يظهر في صفحة الأخبار |
| `media_dashboard` — admin | إضافة صورة/فيديو → يظهر في صفحة الإعلام |
| `al_masariha_news_page.html` | أخبار منشورة + خبر مميز |
| `al_masariha_media_page.html` | معرض صور + بطاقات فيديو |
| `al_masariha_stats_page.html` | إحصائيات عامة من RPC (لاعبون + مباريات) |
| `stats_dashboard.html` — admin | أرقام داخلية من players/coaches/teams |
| `al_masariha_contact_page.html` — زائر | إرسال رسالة → رقم مرجع MSG-… |
| `contact_messages_dashboard` — admin | قراءة وتحديث حالة الرسائل |
| `al_masariha_store_page.html` — زائر | طلب منتج منشور → ORD-… |
| `store_order_status.html` | متابعة طلب برقم المرجع + الجوال |
| `store_orders_dashboard` — admin | إدارة طلبات المتجر |
