# تقرير المرحلة 3 — إغلاق اختبار RLS + توحيد الاعتماد

تاريخ: 2026-05-21

## ملخص

أُغلق **اختبار RLS الأساسي** (الخطوات 1–6) ووُحّد شرط **الاعتماد النهائي** بين لوحتي الإدارة.

---

## ما أُنجز في Supabase (أنت)

| الخطوة | الملف / الإجراء |
|--------|-----------------|
| 1 | `REQUEST_COMPLETIONS_RLS.sql` |
| 2–3 | تحقق policies + bucket `academy_files` |
| 5ب | `REQUEST_COMPLETIONS_RLS_FIX.sql` |

---

## ما أُنجز في الكود (اليوم)

| الملف | التغيير |
|-------|---------|
| `js/request-completion-review.js` | منطق مشترك: الملفات الإجبارية، التقدم، ما ينقص قبل الاعتماد |
| `admin_completion_dashboard.html` | نفس شرط `admin_requests` + عمود تقدم + رابط مراجعة تفصيلية |
| `js/supabase-public-lookup.js` | RPC للمرفقات |
| `request_status.html` / `request_completion.html` | UX + RPC |

---

## اختبار RLS — النتيجة النهائية

| # | الاختبار | الحالة |
|---|----------|--------|
| 1 | انضمام + طلب | تم |
| 2 | `request_status` | تم |
| 3 | `admin_requests` — طلب استكمال | تم |
| 4 | بحث ولي أمر (RPC) | تم |
| 5 | `players_list_dashboard` | تم |
| 5 | رفع Storage + completions | تم |
| 5ب | إصلاح `upsert_request_completion` | تم |
| 6 | مراجعة admin | تم |

**الحالة: جاهز لـ Soft Launch** (انضمام + متابعة + إدارة + لاعبين + مرفقات).

---

## Soft Launch — ما يعمل الآن

- صفحة انضمام (لاعب / ولي أمر / كادر…)
- متابعة الطلب برقم المرجع + الجوال
- إدارة الطلبات + مراجعة مرفقات ملفّ بملف
- قائمة اللاعبين للإدارة
- رفع المرفقات + Storage آمن

---

## ما يُؤجَّل (اختياري لاحقاً)

- RLS لجداول أخرى (`teams`, إشعارات، …)
- توحيد `admin_requests_app.js` لاستيراد `request-completion-review.js` (تقليل تكرار)
- نقل مفتاح anon إلى Cloudflare Pages
- إعادة هيكلة مجلدات `public/` / `admin/`

---

## SQL تحقق نهائي (مصحح)

```sql
SELECT
  jr.reference_code,
  jr.status AS join_status,
  rc.status AS completion_status,
  rc.id_document_status,
  rc.personal_photo_status,
  rc.player_join_file_status,
  rc.medical_file_status
FROM public.request_completions rc
JOIN public.join_requests jr ON jr.id = rc.request_id
WHERE jr.reference_code = 'REQ-20260520-9999';
```

---

## ملاحظة للطلب التجريبي

الطلب `REQ-20260520-9999` أُعيد اعتماده في الاختبار — لإنشاء طلب جديد استخدم صفحة الانضمام.
