# تحليل سياسات RLS — `join_requests` و `players`

**التاريخ:** 2026-05-20  
**الحالة:** تنظيف مطلوب قبل تنفيذ `JOIN_REQUESTS_RLS.sql` و `PLAYERS_RLS.sql`

---

## الخلاصة

جميع السياسات الظاهرة في الصور **خطيرة ومفتوحة** — لا توجد سياسة «صحيحة» حالياً يجب الإبقاء عليها.

| الجدول | عدد السياسات الظاهرة | سياسات آمنة للإبقاء |
|--------|----------------------|---------------------|
| `join_requests` | ~14 اسمًا مختلفًا | **0** |
| `players` | ~7 أسماء مختلفًا | **0** |

السبب: كلها تستخدم `qual = true` و/أو `with_check = true` على أدوار عامة → أي عميل يستطيع SELECT/UPDATE/DELETE للجدول كامل.

---

## معايير التصنيف

| التصنيف | المعنى | الإجراء |
|---------|--------|---------|
| **legacy** | سياسات قديمة بأسماء عامة (`Allow … for everyone`) | DROP |
| **dev** | تبدأ بـ `academy_dev_` | DROP |
| **duplicate** | نفس الأمر مكرر بأسماء مختلفة (مثلاً 4× SELECT مفتوح) | DROP (احتفظ بصفر) |
| **required** | سياسة إنتاج صحيحة (admin فقط / insert مقيّد / RPC) | **لا توجد بعد** — ستُنشأ لاحقاً |

---

## جدول `join_requests` — تحليل تفصيلي

| policyname | cmd | qual | with_check | التصنيف | السبب |
|------------|-----|------|------------|---------|-------|
| `Allow insert for everyone` | INSERT | NULL | true | legacy | إدراج مفتوح |
| `Allow select for everyone` | SELECT | true | NULL | legacy | قراءة كل الطلبات |
| `Allow update for everyone` | UPDATE | true | true | legacy | تعديل أي طلب |
| `Allow select join_requests` | SELECT | true | NULL | duplicate | مكررة مع «select for everyone» |
| `Allow public insert join_requests` | INSERT | NULL | true | legacy | إدراج مفتوح |
| `Allow read join_requests` | SELECT | true | NULL | duplicate | SELECT مفتوح |
| `Allow update join_requests` | UPDATE | true | true | duplicate | UPDATE مفتوح |
| `Allow delete join_requests` | DELETE | true | NULL | legacy | حذف أي طلب |
| `Allow read all` | SELECT | true | NULL | legacy | قراءة كاملة |
| `Allow insert` | INSERT | NULL | true | legacy | اسم عام جداً |
| `Allow update` | UPDATE | true | true | legacy | تعديل كامل |
| `academy_dev_join_requests_select` | SELECT | true | NULL | dev | مرحلة تطوير |
| `academy_dev_join_requests_insert` | INSERT | NULL | true | dev | مرحلة تطوير |
| `academy_dev_join_requests_update` | UPDATE | true | true | dev | مرحلة تطوير |

### ملاحظات `join_requests`

- **4–5 سياسات SELECT** مفتوحة → تفسّر لماذا أي حساب يرى كل الطلبات.
- **3 سياسات UPDATE** مفتوحة → تفسّر تعديل سجل E2E من حساب كادر سابقاً.
- **DELETE مفتوح** → خطر حذف بيانات الإنتاج.

---

## جدول `players` — تحليل تفصيلي

| policyname | cmd | qual | with_check | التصنيف | السبب |
|------------|-----|------|------------|---------|-------|
| `Full access players` | ALL | true | true | legacy | صلاحية كاملة للجميع |
| `Allow public read players` | SELECT | true | NULL | legacy | قراءة كل اللاعبين |
| `Allow insert players` | INSERT | NULL | true | legacy | إدراج مفتوح |
| `Allow update players` | UPDATE | true | true | legacy | تعديل مفتوح |
| `Allow delete players` | DELETE | true | NULL | legacy | حذف مفتوح |
| `Allow all players` | ALL | true | true | duplicate | مكررة مع Full access |
| `academy_dev_players_all` | ALL | true | true | dev | مرحلة تطوير |

### ملاحظات `players`

- سياسة **`ALL` + true** = أخطر نوع (SELECT + INSERT + UPDATE + DELETE).
- وجود **سياستين ALL** (`Full access` + `Allow all` + `academy_dev`) = تكرار خطير.

---

## ما لا يُحذف في مرحلة التنظيف

هذه الأسماء **ليست موجودة بعد** (ستُنشأ لاحقاً). مذكورة هنا لتجنب حذفها بالخطأ إن وُجدت:

| policyname | الجدول | المصدر |
|------------|--------|--------|
| `join_requests_public_insert` | join_requests | `JOIN_REQUESTS_RLS.sql` |
| `admin_manage_join_requests` | join_requests | `JOIN_REQUESTS_RLS.sql` |
| `admin_manage_players` | players | `PLAYERS_RLS.sql` |

**لا تحذف:** سياسات `academy_staff` (`staff_select_own`, `admin_manage_academy_staff`, …) — جدول مختلف.

---

## السياسات النهائية المتوقعة (بعد التنفيذ الكامل)

### بعد الخطوة 1 — التنظيف فقط

```text
join_requests: (لا سياسات — أو أي اسم لم يُحذف يدوياً)
players:       (لا سياسات)
```

### بعد الخطوة 2 — `JOIN_REQUESTS_RLS.sql`

| النوع | الاسم / الدالة |
|-------|----------------|
| Policy | `join_requests_public_insert` (INSERT لـ anon — بشروط حقول) |
| Policy | `admin_manage_join_requests` (ALL لـ admin فقط) |
| Function | `lookup_join_request_by_ref_phone` |
| Function | `lookup_join_requests_by_contact` |
| Function | `submit_join_request_review` |

**لا SELECT/UPDATE مفتوح على الجدول** — المتابعة عبر RPC فقط.

### بعد الخطوة 4 — `PLAYERS_RLS.sql`

| النوع | الاسم / الدالة |
|-------|----------------|
| Policy | `admin_manage_players` (ALL لـ admin فقط) |
| Function | `search_players_public` (بحث محدود 8 صفوف) |

**لا SELECT مفتوح على الجدول** — البحث العام عبر RPC فقط.

---

## ترتيب التنفيذ الموصى به

```text
[أنت الآن] ① استعلام pg_policies (قبل)
            ② RLS_CLEANUP_STEP1_DROP_ONLY.sql
            ③ استعلام pg_policies (بعد — يجب 0 سياسات مفتوحة)
            ④ JOIN_REQUESTS_RLS.sql
            ⑤ اختبار (join + request_status + admin_requests)
            ⑥ PLAYERS_RLS.sql
            ⑦ اختبار (players_list + join بحث لاعب)
```

---

## اختبارات التحقق بعد كل مرحلة

| المرحلة | الاختبار | المتوقع |
|---------|----------|---------|
| بعد التنظيف | `SELECT count(*) FROM join_requests` كـ anon | **فشل أو 0 صفوف** |
| بعد JOIN_REQUESTS | إرسال طلب من `/join` | نجاح INSERT |
| بعد JOIN_REQUESTS | `request_status?ref=&phone=` | نجاح عبر RPC |
| بعد JOIN_REQUESTS | admin → قائمة الطلبات | يرى الكل |
| بعد PLAYERS | admin → قائمة اللاعبين | يرى الكل |
| بعد PLAYERS | join → بحث لاعب (ولي أمر) | ≤ 8 نتائج عبر RPC |
