# RLS حسب Domain — دليل التطبيق والاختبار

**الملف:** [`PANEL_RLS_BY_DOMAIN.sql`](PANEL_RLS_BY_DOMAIN.sql)  
**التاريخ:** 2026-05-29  
**الحالة:** RBAC-3 — يستبدل سياسات `admin_manage_*` (JWT `role=admin` فقط)

---

## 1) ماذا يفعل؟

| قبل | بعد |
|-----|-----|
| فقط JWT `role=admin` يصل للجداول | أي موظف **نشط** في `academy_staff` حسب `panel_domains` + `panel_level` |
| إخفاء الأزرار في الواجهة فقط | **قاعدة البيانات** ترفض الوصول غير المصرّح |

### دوال مساعدة

| الدالة | المعنى |
|--------|--------|
| `panel_staff_has_domain(domain)` | قراءة — L5+ مع النطاق |
| `panel_staff_can_write(domain)` | إدراج/تحديث — L1–L4 (لا L5) |
| `panel_staff_can_delete(domain)` | حذف — L1/L2 فقط |
| `panel_staff_can_read_system()` | إعدادات — L1/L2 |
| `panel_staff_can_write_system()` | تعديل إعدادات — L1 فقط |
| `is_chat_admin()` | محادثات — `support` **أو** `requests` |

---

## 2) ترتيب التنفيذ

1. [`RBAC_PANEL_GRANTS.sql`](RBAC_PANEL_GRANTS.sql) — أعمدة RBAC في `academy_staff`
2. [`STAFF_AUTH_RLS.sql`](STAFF_AUTH_RLS.sql)
3. جداول RLS السابقة (JOIN_REQUESTS، STORE، …)
4. [`AUDIT_LOG_SCHEMA.sql`](AUDIT_LOG_SCHEMA.sql)
5. [`SUPPORT_TICKETS_SCHEMA.sql`](SUPPORT_TICKETS_SCHEMA.sql)
6. **`PANEL_RLS_BY_DOMAIN.sql`** ← هذا الملف

---

## 3) الجداول الم cubierta

| Domain | الجداول |
|--------|---------|
| `requests` | `join_requests`, `request_completions` |
| `support` | `contact_messages`, `support_tickets` + `is_chat_admin()` للمحادثات |
| `store` | `store_products`, `store_orders` |
| `media` | `academy_news`, `academy_media` |
| `members` | `players`, `coaches`, `guardians`, `supporters`, `volunteers`, `academy_members`, `player_guardians` |
| `ops` | `matches`, `teams` |
| `system` | `academy_settings` (update فقط — L1) |

**لم يُمس:** insert عامة (anon) · RPC `security definer` · `academy_settings_public_select` · `audit_log` · `academy_staff` (سياسات HR منفصلة)

---

## 4) اختبار سريع

### أ) موظف طلبات L4 (`requests` فقط)
- ✅ `join_requests` — قراءة + تحديث
- ❌ `store_products` — 0 rows / permission denied
- ❌ `academy_settings` — update مرفوض

### ب) موظف متجر L4
- ✅ `store_orders` — قراءة + تحديث
- ❌ `join_requests` — مرفوض

### ج) مشاهدة L5
- ✅ قراءة ضمن نطاقه
- ❌ أي `insert` / `update` / `delete`

### د) مدير عام L1
- ✅ كل النطاقات + `audit_log` + إعدادات

---

## 5) استعلام تحقق

```sql
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and policyname like 'panel_%'
order by tablename, policyname;
```

---

## 6) ملاحظات

- **GM في `adminEmails`** بدون سجل `academy_staff`: ما زال يعمل عبر `panel_is_jwt_admin()`.
- **موظف panel** يجب أن يكون `auth_user_id` مربوطاً و`status = active`.
- بعد تغيير `panel_domains`: الموظف **يعيد تسجيل الدخول** لتحديث الجلسة في الواجهة؛ RLS يقرأ من DB مباشرة.
