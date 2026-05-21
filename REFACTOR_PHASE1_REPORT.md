# تقرير المرحلة 1 — توحيد Supabase

تاريخ: 2026-05-19

## ملخص

تم توحيد إعدادات Supabase عبر `supabase-config.js` و `js/supabase-client.js` في جميع الصفحات والسكربتات التي تتصل بقاعدة البيانات.

---

## التغييرات

### 1. مصدر واحد للإعدادات

| ملف | الدور |
|-----|--------|
| `supabase-config.js` | `window.SUPABASE_CONFIG` (url + anonKey) |
| `js/supabase-client.js` | `createSupabaseClient()` و `getSupabaseConfig()` |

### 2. صفحات ومكوّنات محدّثة (29 HTML + 3 JS)

- الصفحة الرئيسية واللاعبين والانضمام والطلبات العامة
- لوحات الإدارة (لاعبين، مدربين، فرق، طلبات، إشعارات، إحصائيات، …)
- `entity_management_app.js`, `admin_requests_app.js`, `academy_members_app.js`

**النمط الموحّد:**

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="supabase-config.js"></script>
<script src="js/supabase-client.js"></script>
<script>
  const supabaseClient = createSupabaseClient(); // أو const sb = ...
</script>
```

### 3. فحوصات grep (نظيفة)

| البحث | النتيجة |
|--------|---------|
| `mhlv` (خطأ DNS) | لا يوجد في الكود — فقط في تقرير المرحلة 0 |
| `admin/admin_login` | لا يوجد في HTML/JS — `_redirects` يعيد التوجيه للمسار الجديد |
| `YOUR_SUPABASE` | لا يوجد في الكود — فقط في التقرير السابق |
| مفتاح anon مكرر | موجود فقط في `supabase-config.js` (+ توثيق `SUPABASE_SETUP.md`) |

### 4. `al_masariha_join_page.html`

- إصلاح HTML: إغلاق `</div>` لحقل البريد
- استخدام `createSupabaseClient()` مع تحميل config
- تم استيراد **النموذج الكامل** من `Downloads\al_masariha_join_page.html` (~53 KB)
- يستخدم `createSupabaseClient()` مع `supabase-config.js` و `js/supabase-client.js`

### 5. أدوات

- `tools/migrate-supabase-config.mjs` — سكربت ترحيل (اختياري لإعادة التشغيل)

---

## اختبار موصى به

1. `index.html` — تحميل اللاعبين بدون أخطاء Console
2. `al_masariha_join_page.html` — إرسال طلب تجريبي
3. `admin_login.html` → لوحة → `coach_view_dashboard.html` (حماية)
4. صفحة طلبات (`players_requests.html`) وصفحة كيان (`guardians_dashboard.html`)
5. `request_status.html` — متابعة طلب بالمرجع

---

## المرحلة التالية (2+)

- Supabase Auth بدل `localStorage` / `admin/1234`
- دمج `admin_requests.html` مع `admin_requests_app.js`
- نقل المفتاح إلى متغيرات Cloudflare Pages
