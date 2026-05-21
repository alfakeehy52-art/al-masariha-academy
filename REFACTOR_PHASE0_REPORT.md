# تقرير المرحلة 0 — إصلاحات الأكاديمية

تاريخ: 2026-05-19

## ملخص

تم تنفيذ **المرحلة 0** من خطة الـ Refactor على المشروع في `Desktop\academy-project` دون المساس بالمراحل الثقيلة (دمج الطلبات، إعادة هيكلة المجلدات).

---

## العمليات المنفذة

### 1. Supabase URL (إصلاح ERR_NAME_NOT_RESOLVED)

| ملف | التغيير |
|-----|---------|
| `index.html` | `mhlv` → `mhvl` |
| `teams_categories_dashboard.html` | `mhlv` → `mhvl` |
| `al_masariha_players_page.html` | `mhlv` → `mhvl` |

### 2. `shared-layout.js`

- رابط دخول الإدارة: `admin/admin_login.html` → `admin_login.html`
- الشعار: `academy-logo.png` → `academy-logo.svg` (ملف SVG جديد)

### 3. ملفات جديدة

| ملف | الغرض |
|-----|--------|
| `js/admin-auth.js` | `requireAdmin()`, `adminLogout()`, `redirectIfAlreadyLoggedIn()` |
| `js/supabase-client.js` | طبقة موحدة لإنشاء عميل Supabase (جاهزة للمرحلة 1) |
| `supabase-config.js` | إعدادات مركزية مع مفتاح anon صالح |
| `academy-logo.svg` | شعار بديل للملف المفقود |
| `_redirects` | إعادة توجيه 301 من `/admin/admin_login.html` |
| `tools/sync-join-page.mjs` | استيراد النموذج الكامل من Downloads |
| `REFACTOR_PHASE0_REPORT.md` | هذا التقرير |

### 4. المصادقة الإدارية

| ملف | التغيير |
|-----|---------|
| `admin_login.html` | تحميل `admin-auth.js` + إعادة توجيه إذا كان المستخدم مسجلاً مسبقاً |
| `coach_view_dashboard.html` | إضافة `requireAdmin()` (كانت بدون حماية) |
| `store_products_dashboard.html` | إضافة `requireAdmin()` + إصلاح logout (كان يمسح sessionStorage فقط) |
| `al_masariha_player_profile.html` | إزالة حماية الإدارة الخاطئة + إزالة `admin_sidebar.js` |

### 5. صفحات إدارية معطلة

| ملف | التغيير |
|-----|---------|
| `admin_completion_dashboard.html` | استبدال `YOUR_SUPABASE_ANON_KEY_HERE` بالمفتاح الصحيح |

### 6. صفحة الانضمام

- إنشاء `al_masariha_join_page.html` (نموذج مبسّط يعمل مع `supabase-config.js`)
- للنسخة الكاملة من Downloads: `node tools/sync-join-page.mjs`

---

## ما لم يُنفَّذ بعد (المراحل 1–7)

- دمج `admin_requests.html` مع `admin_requests_app.js`
- توحيد كل صفحات Supabase على `supabase-config.js` فقط
- Supabase Auth حقيقي بدل `admin/1234`
- إعادة هيكلة المجلدات `public/` و `admin/`
- إزالة CSS/JS المكرر في صفحات الطلبات

---

## اختبار موصى به

1. افتح `index.html` وتأكد من تحميل اللاعبين من Supabase (Console بدون أخطاء DNS).
2. من أي صفحة عامة: زر «دخول الإدارة» → `admin_login.html`.
3. سجّل دخول `admin` / `1234` → `admin_dashboard.html`.
4. افتح `coach_view_dashboard.html` بدون دخول → يجب إعادة التوجيه للدخول.
5. افتح `store_products_dashboard.html` بعد الدخول → يعمل؛ بعد logout من الشريط الجانبي → يخرج فعلياً.
6. افتح `al_masariha_join_page.html` وأرسل طلباً تجريبياً.
7. على Cloudflare: تأكد من وجود `_redirects` ورفع `academy-logo.svg`.

---

## أمان

المفتاح `anon` ما زال في المستودع (مثل بقية الملفات). يُنصح بـ:

- تدوير المفتاح في Supabase إن كان منشوراً علناً
- نقل المفتاح إلى متغيرات Cloudflare Pages في المرحلة 1
- استبدال مصادقة `localStorage` بـ Supabase Auth
