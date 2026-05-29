# إعداد مصادقة الإدارة — Supabase Auth (المرحلة 2)

## ما تغيّر

- الدخول عبر **البريد وكلمة المرور** في Supabase Auth بدل `admin` / `1234`.
- الجلسة تُدار تلقائياً بواسطة Supabase (JWT + refresh).
- كل لوحات الإدارة تستخدم `js/admin-auth.js` مع `requireAdmin()`.

## إنشاء مستخدم مسؤول

1. افتح [Supabase Dashboard](https://supabase.com/dashboard) → مشروع الأكاديمية.
2. **Authentication** → **Users** → **Add user**.
3. أدخل بريداً وكلمة مرور قوية.
4. في **User Metadata** (أو Raw JSON) أضف:

```json
{
  "role": "admin"
}
```

أو عيّن البريد في `supabase-config.js`:

```javascript
adminEmails: ["admin@almasariha.com"],
adminRequireRole: false
```

## خيارات `supabase-config.js`

| الحقل | الوصف |
|--------|--------|
| `adminEmails` | قائمة بريد مسموح (اختياري). إن وُجدت يُقبل البريد المطابق. |
| `adminRequireRole` | عند `true` (افتراضي): يُشترط `role: admin` في metadata. |

## اختبار

1. افتح `admin_login.html` وسجّل الدخول بالحساب الجديد.
2. افتح `admin_dashboard.html` — يجب أن تظهر اللوحة.
3. افتح أي لوحة بدون دخول — إعادة توجيه لصفحة الدخول.
4. اضغط «تسجيل خروج» من الشريط الجانبي — يجب الخروج فعلياً من Supabase.

## Site URL واستعادة كلمة المرور

راجع **`docs/SUPABASE_AUTH_EMAIL_AR.md`** — يجب أن يكون:

- **Site URL** = `https://al-masariha-academy.pages.dev` (وليس صفحة انضم إلينا)
- **Redirect URL** = `.../reset_password.html`


- فعّل **Email confirmation** في الإنتاج إن أمكن.
- لا تضع كلمات مرور في الكود؛ أنشئ المستخدمين من لوحة Supabase فقط.
