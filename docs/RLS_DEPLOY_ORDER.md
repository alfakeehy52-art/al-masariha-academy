# ترتيب تطبيق سياسات RLS

نفّذ في **Supabase → SQL Editor** بالترتيب:

1. [`STAFF_AUTH_RLS.sql`](STAFF_AUTH_RLS.sql) — إن لم يكن مُطبَّقاً مسبقاً
2. [`JOIN_REQUESTS_RLS.sql`](JOIN_REQUESTS_RLS.sql)
3. [`PLAYERS_RLS.sql`](PLAYERS_RLS.sql)

بعد كل ملف:

```sql
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('academy_staff', 'join_requests', 'players')
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
