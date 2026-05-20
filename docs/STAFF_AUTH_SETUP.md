# بوابة دخول الكادر — دليل الإعداد

## الملفات

| ملف | الوظيفة |
|-----|---------|
| `staff_login.html` | دخول / تفعيل / رابط بريد |
| `staff_dashboard.html` | لوحة الكادر بعد الربط |
| `js/staff-auth.js` | مصادقة وربط `auth_user_id` |

## المسار الكامل

1. المتقدّم يرسل طلب **كادر** من `al_masariha_join_page.html` (**البريد إلزامي**).
2. الإدارة تقبل من `staff_requests.html` → يُنشأ سجل في `academy_staff`.
3. الكادر يفتح `staff_login.html` → تبويب **تفعيل حساب** (أول مرة) أو **دخول**.
4. عند التفعيل/الدخول يُحدَّث `academy_staff.auth_user_id` تلقائياً إذا تطابق البريد.

## إعداد Supabase

### 1. Authentication → Providers

- فعّيل **Email** مع كلمة مرور.
- للتجربة السريعة: عطّل **Confirm email** مؤقتاً، أو أكّد البريد يدوياً من لوحة Users.

### 2. Authentication → URL Configuration

أضف عناوين إعادة التوجيه (محلي + الإنتاج):

- `http://127.0.0.1:5500/staff_dashboard.html`
- `https://YOUR-DOMAIN/staff_dashboard.html`

### 3. سياسات RLS

نفّذ `docs/STAFF_AUTH_RLS.sql` إذا لم تعد تستخدم `using (true)` على `academy_staff`.

### 4. User Metadata عند التفعيل

يُضبط تلقائياً: `role: "staff"` مع `staff_id`, `staff_type`, `staff_category`.

## اختبار

1. اعتمد طلب كادر فيه بريد `test@example.com`.
2. افتح `staff_login.html?email=test@example.com`.
3. **تفعيل حساب** بكلمة مرور جديدة.
4. تحقق في Table Editor: `auth_user_id` مملوء في `academy_staff`.
5. افتح `staff_dashboard.html` — تظهر بيانات الكادر.

## استكشاف الأخطاء

| المشكلة | الحل |
|---------|------|
| لا يوجد سجل بهذا البريد | تأكد من اعتماد الطلب ووجود `email` في `academy_staff` |
| تعذر الربط | نفّذ سياسات RLS في `STAFF_AUTH_RLS.sql` |
| تأكيد البريد مطلوب | أكّد من Supabase Users أو عطّل Confirm email |
