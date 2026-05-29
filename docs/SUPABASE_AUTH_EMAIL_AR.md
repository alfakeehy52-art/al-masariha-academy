# تخصيص بريد استعادة كلمة المرور — Supabase

## 1) إصلاح التوجيه إلى «انضم إلينا»

إذا فُتح رابط الاستعادة على صفحة الانضمام بدل تعيين كلمة المرور، السبب غالباً **Site URL** في Supabase.

### الخطوة (مرة واحدة)

**Supabase → Authentication → URL Configuration**

| الحقل | القيمة الصحيحة |
|--------|----------------|
| **Site URL** | `https://al-masariha-academy.pages.dev` |
| **Redirect URLs** | `https://al-masariha-academy.pages.dev/reset_password.html` |
| | `http://127.0.0.1:5500/reset_password.html` (للتطوير المحلي) |

**لا تجعل Site URL = صفحة انضم إلينا.**  
عند فشل التوجيه، Supabase يرسل المستخدم إلى Site URL.

---

## 2) تغيير اسم المرسل ومحتوى الرسالة

البريد الافتراضي يظهر من **Supabase Auth** بالإنجليزية. لتخصيصه:

**Supabase → Authentication → Email Templates → Reset password**

### Subject (الموضوع)

```
استعادة كلمة المرور — أكاديمية المسارحة
```

### Body (HTML) — مثال

```html
<h2>أكاديمية المسارحة لكرة القدم</h2>
<p>مرحباً،</p>
<p>تلقّينا طلباً لاستعادة كلمة مرور حسابك في لوحة الأكاديمية.</p>
<p><a href="{{ .ConfirmationURL }}">اضغط هنا لتعيين كلمة مرور جديدة</a></p>
<p>إذا لم تطلب ذلك، تجاهل هذه الرسالة.</p>
<p style="color:#888;font-size:12px">أكاديمية المسارحة — نظام إداري موحّد</p>
```

> **مهم:** اترك `{{ .ConfirmationURL }}` كما هو — هذا الرابط الفعلي.

---

## 3) اسم المرسل (بدل Supabase Auth)

البريد الافتراضي من Supabase **لا يمكن** تغيير اسم المرسل إلا بـ **SMTP مخصص**:

**Supabase → Project Settings → Authentication → SMTP Settings**

| الحقل | مثال |
|--------|------|
| Sender email | `noreply@masariha-academy.com` |
| Sender name | `أكاديمية المسارحة` |
| Host | (Resend / SendGrid / Gmail SMTP…) |

بدون SMTP مخصص: يبقى المرسل «Supabase Auth» لكن **المحتوى والموضوع** يتغيران من Email Templates.

---

## 4) اختبار بعد التعديل

1. `admin_login.html` → نسيت كلمة المرور  
2. افتح البريد → اضغط الرابط  
3. يجب أن تفتح **`reset_password.html`** (وليس انضم إلينا)  
4. عيّن كلمة مرور → سجّل الدخول  

---

## 5) ما أضافه الموقع تلقائياً

- `reset_password.html` — صفحة تعيين كلمة المرور  
- `js/auth-recovery-redirect.js` — إذا فُتح الرابط على صفحة خاطئة، ينقلك لصفحة التعيين  
- إذا وُجهت لـ «انضم إلينا» **بعد** هذا التحديث، سيُعاد توجيهك تلقائياً  
