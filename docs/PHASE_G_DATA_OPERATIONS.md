# المرحلة G — بيانات تشغيلية

**قاعدة:** لا حذف بيانات بدون **موافقة صريحة** من المالك + نسخ احتياطي أولاً.

---

## 1) نسخ احتياطي (إلزامي قبل أي تنظيف)

### خطة Supabase المجانية (Free)

> **النسخ التلقائي اليومي غير متوفر** على Free — الاعتماد على **تصدير يدوي دوري** قبل أي تغيير كبير (تنظيف، SQL، ترحيل).

| الطريقة | من أين | متى تستخدمها |
|---------|--------|--------------|
| **تصدير CSV** | Table Editor → جدول → Export | الأسهل — لكل جدول مهم |
| **SQL + حفظ النتائج** | SQL Editor | معاينة + أرشفة سريعة |
| **pg_dump** (اختياري) | اتصال PostgreSQL المباشر | نسخة كاملة إن ركّبت أداة على جهازك |
| **Storage** | Storage → `academy_files` | تحميل الملفات المرفوعة يدوياً |

**لا تعتمد على:** Database → Backups (يتطلب Pro).

---

### أ) تصدير CSV (موصى به — 15–20 دقيقة)

1. Supabase → **Table Editor**
2. لكل جدول من القائمة أدناه: افتح الجدول → **Export** → CSV
3. احفظ الملفات في مجلد على جهازك، مثلاً:  
   `backup-academy-2026-05-23/`
4. سمِّ الملفات: `join_requests.csv`, `players.csv`, …

**جداول أولوية عالية:**

| الجدول | لماذا |
|--------|--------|
| `academy_settings` | هوية الموقع ونصوص الرئيسية |
| `join_requests` | كل طلبات الانضمام |
| `request_completions` | المرفقات وحالة المراجعة |
| `players` | اللاعبون |
| `coaches` | المدربون |
| `teams` | الفرق |
| `guardians`, `player_guardians` | أولياء الأمور والربط |
| `academy_staff` | الكادر |
| `academy_members` | عضوية الأكاديمية |
| `supporters`, `volunteers` | داعمون / متطوعون |
| `store_products`, `store_orders` | المتجر |
| `matches`, `news`, `media_items` | محتوى عام |
| `contact_messages` | رسائل التواصل |

**جداول ثانوية (إن وُجدت بيانات):** `admin_notifications`, `chat_rooms`, `chat_messages`

---

### ب) معاينة SQL قبل التنظيف

انسخ في **SQL Editor** واحفظ النتائج (لقطة أعداد):

```sql
SELECT 'join_requests' AS tbl, count(*) FROM public.join_requests
UNION ALL SELECT 'request_completions', count(*) FROM public.request_completions
UNION ALL SELECT 'players', count(*) FROM public.players
UNION ALL SELECT 'coaches', count(*) FROM public.coaches
UNION ALL SELECT 'teams', count(*) FROM public.teams
UNION ALL SELECT 'guardians', count(*) FROM public.guardians
UNION ALL SELECT 'academy_staff', count(*) FROM public.academy_staff
UNION ALL SELECT 'academy_members', count(*) FROM public.academy_members
UNION ALL SELECT 'academy_settings', count(*) FROM public.academy_settings
UNION ALL SELECT 'store_products', count(*) FROM public.store_products
UNION ALL SELECT 'store_orders', count(*) FROM public.store_orders
ORDER BY tbl;
```

---

### ج) Storage

- **Storage → `academy_files`** — حمّل المجلدات/الملفات المهمة (هويات، عقود، صور).
- على Free لا يوجد «نسخ bucket تلقائي» — التحميل اليدوي أو سكربت لاحقاً.

---

### د) pg_dump (اختياري — نسخة كاملة)

1. Supabase → **Project Settings → Database** → **Connection string** → **URI** (Direct)
2. على جهازك (يتطلب PostgreSQL client):

```bash
pg_dump "postgresql://postgres.[ref]:[PASSWORD]@db.[ref].supabase.co:5432/postgres" -F c -f academy-backup-2026-05-23.dump
```

> استبدل `[ref]` و `[PASSWORD]` من لوحة Supabase. لا تشارك الرابط في محادثات عامة.

---

### هـ) أرشفة المخطط (Schema)

سكربتات RLS والجداول محفوظة في المشروع → `docs/RLS_DEPLOY_ORDER.md` وملفات `*_RLS.sql`.  
هذا **لا يستبدل** بيانات الجداول — فقط هيكل القاعدة.

---

### روتين موصى به على Free

| متى | ماذا |
|-----|------|
| قبل تنظيف تجريبي | CSV للجداول الحساسة + Storage |
| بعد إدخال بيانات حقيقية كثيرة | CSV شهري |
| قبل SQL كبير | معاينة الأعداد + CSV |

---

## 2) تنظيف تجريبي (بموافقة فقط)

**الملف:** `docs/LAUNCH_CLEANUP_TEST_DATA.sql`

| قبل التنفيذ | |
|-------------|---|
| ⬜ موافقة المالك مكتوبة («أوافق على حذف التجريبي») | |
| ⬜ **تصدير CSV يدوي** (Free — لا يوجد backup تلقائي) | |
| ⬜ شغّلت SELECT المعاينة وراجعت الأعداد | |
| ⬜ عدّلت سطر `academy_staff` إن أردت الإبقاء على بريدك | |

**بعد SQL:**

- Auth → Users → احذف حسابات تجريبية
- Storage → احذف ملفات تجريبية
- `supabase-config.js` → `adminEmails` للمدير فقط

---

## 3) إدخال بيانات تشغيلية حقيقية

| البند | أين |
|--------|-----|
| شعار + نصوص | `academy_settings_dashboard.html` |
| فرق / مدربون | لوحات الفرق والمدربين |
| منتجات متجر | `store_products_dashboard` |
| أخبار / إعلام | لوحات المحتوى |
| بريد المدير | `supabase-config.js` + Auth |

---

## تقرير المرحلة G

```text
نسخة احتياطية: ✅ نعم — 2026-05-24 — CSV + Storage محلي (backup-academy-2026-05-24)
فحص: docs/PHASE_G_INSPECTION_2026-05-24.md
نسخة احتياطية (قديم): نعم / لا — التاريخ: — الطريقة: CSV / pg_dump / …
تنظيف تجريبي: نُفّذ / لم يُنفّذ / مؤجل
بيانات حقيقية: بدأنا / مكتمل جزئياً
موافقة الانتقال لـ H: نعم / لا
```
