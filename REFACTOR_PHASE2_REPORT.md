# تقرير المرحلة 2 — Supabase Auth للإدارة

تاريخ: 2026-05-19

## ملخص

استبدال مصادقة `admin` / `1234` و `localStorage` بـ **Supabase Auth** عبر `js/admin-auth.js`، مع تحديث **26 صفحة إدارية** وصفحة الدخول.

---

## التغييرات الرئيسية

### 1. `js/admin-auth.js`

| الدالة | الوظيفة |
|--------|---------|
| `adminLogin(email, password)` | تسجيل دخول عبر Supabase |
| `adminLogout()` | `signOut` + إعادة توجيه |
| `requireAdmin()` | حماية الصفحات (جلسة + صلاحية) |
| `isAdminLoggedIn()` | فحص الجلسة |
| `redirectIfAlreadyLoggedIn()` | صفحة الدخول |

**التحقق من الصلاحية:**

- `user_metadata.role === "admin"` أو `app_metadata.role === "admin"` (عند `adminRequireRole: true`)
- أو البريد ضمن `adminEmails` في `supabase-config.js`

### 2. `admin_login.html`

- حقول بريد وكلمة مرور
- إزالة `admin` / `1234`
- تحميل Supabase + `admin-auth.js`

### 3. `supabase-config.js`

```javascript
adminEmails: [],
adminRequireRole: true
```

### 4. صفحات محدّثة (26)

لوحات الإدارة، الطلبات، الكيانات، `coach_view_dashboard.html`, `store_products_dashboard.html`, وغيرها.

**النمط الموحّد في `<head>`:**

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="supabase-config.js"></script>
<script src="js/supabase-client.js"></script>
<script src="js/admin-auth.js"></script>
<script>requireAdmin();</script>
```

### 5. وثائق وأدوات

| ملف | الغرض |
|-----|--------|
| `ADMIN_AUTH_SETUP.md` | إنشاء مستخدم Admin في Supabase |
| `tools/migrate-admin-auth.mjs` | ترحيل الصفحات (للمراجعة أو إعادة التشغيل) |

---

## مطلوب منك قبل الاختبار

1. في **Supabase Dashboard** → Authentication → Users: أنشئ مستخدم Admin.
2. أضف في User Metadata: `{ "role": "admin" }`.
3. أو ضع البريد في `adminEmails` واضبط `adminRequireRole: false`.

راجع `ADMIN_AUTH_SETUP.md` للتفاصيل.

---

## اختبار موصى به

1. `admin_login.html` — دخول بالحساب الجديد → `admin_dashboard.html`.
2. فتح `coach_view_dashboard.html` بدون دخول → إعادة توجيه للدخول.
3. تسجيل خروج من الشريط الجانبي → لا يمكن العودة للوحة بدون دخول.
4. `guardians_requests.html` و `players_list_dashboard.html` — تعمل بعد الدخول.

---

## المرحلة التالية (3+)

- دمج `admin_requests.html` مع `admin_requests_app.js`
- نقل المفتاح إلى متغيرات Cloudflare Pages
- إعادة هيكلة المجلدات `public/` و `admin/`
