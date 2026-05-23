# نقطة التوقف — ما أُنجز حتى الآن

**آخر تحديث:** 2026-05-22  
**الغرض:** عند فتح محادثة أو صفحة جديدة — اقرأ هذا الملف أولاً لتعرف أين وصلنا.

---

## ابدأ محادثة جديدة بهذا النص

```text
اقرأ docs/PROGRESS_CHECKPOINT.md و docs/PROJECT_ROADMAP.md ونكمل من «التالي».
```

---

## المرحلة الحالية

| | |
|---|---|
| **آخر إنجاز** | **تواصل MVP** — Drawer (`js/chat-drawer.js`) + SQL chat + `communications_dashboard.html` |
| **التالي** | بنود العرض: جوال · صلاحيات · سوشيال «قريباً» · تنظيف واجهة · **قبل العرض:** Badge إشعارات + Realtime `chat_notifications` |
| **الإنتاج** | https://al-masariha-academy.pages.dev (ينشر من `main` تلقائياً) |
| **دخول إدارة** | `admin_login.html` — بريد في `supabase-config.js` |

---

## ✅ مكتمل — لا تعيد العمل

### Refactor (كود)
- [x] **0** — DNS، `supabase-config.js`، `admin-auth`
- [x] **1** — توحيد Supabase
- [x] **2** — Auth للإدارة
- [x] **3** — `request-completion-review.js` + لوحة المرفقات

### RLS في Supabase (نفّذها المالك — «تم»)
- [x] انضمام، لاعبون، مرفقات، مدربون، متجر منتجات، فرق
- [x] أعضاء، مجتمع (أولياء/داعمون/متطوعون)
- [x] مباريات، أخبار، إعلام، إحصائيات، رسائل تواصل
- [x] **طلبات المتجر** `STORE_ORDERS_RLS.sql`
- [x] **لاعبون للزوار** `players_public_select` (صفحة اللاعبين)
- [x] **إعدادات الأكاديمية** `academy_settings` + RLS

**الترتيب الكامل:** `docs/RLS_DEPLOY_ORDER.md` (حتى الخطوة 18)

### مراحل الموقع (وظائف)
- [x] **A** — بيانات حية، روابط، shared-layout، إزالة وهمي زائد
- [x] **B** — رئيسية، متجر، فرق، ثيم إدارة، RLS إضافي
- [x] **C** — مباريات، أخبار، إعلام، إحصائيات، تواصل، طلبات متجر
- [x] **D1–D4** — روابط متابعة، SEO، sitemap، Cloudflare + GitHub
- [x] **E1** — لوحة `academy_settings_dashboard.html` + `js/academy-settings.js` + ربط هيدر/فوتر/رئيسية/تواصل

### اختبار إنتاج (تم سابقاً)
- [x] مدربون، فرق، مباريات، أخبار، متجر، RPC طلب متجر/تواصل
- [x] حذف طلبات/رسائل تجريبية من لوحة الإدارة (محلي)
- [x] إصلاح SEO لروابط بدون `.html` — commit `6a788ef` على GitHub

---

## ⏳ بعد النشر — تحقق يدوياً

| الخطوة | الرابط / ملاحظة |
|--------|------------------|
| لوحة الإعدادات | `academy_settings_dashboard.html` (بعد دخول admin) |
| الموقع العام | https://al-masariha-academy.pages.dev — انتظر 1–3 دقائق بعد `git push` |
| أول حفظ | تأكد أن `ACADEMY_SETTINGS_RLS.sql` مُنفَّذ في Supabase ✅ |

---

## ⬜ لم يُنجز بعد (مخطط)

| البند | الأولوية |
|-------|----------|
| ~~رفع E1 إلى GitHub / Cloudflare~~ | ✅ `bc6e9f0` |
| ~~إعادة تصميم الواجهة مرحلة 1~~ | ✅ رئيسية + فوتر |
| ~~مرحلة 2 صفحات داخلية~~ | ✅ جارية — ألوان موحّدة من الإعدادات |
| بريد رسمي `admin@al-masariha-academy.com` | لاحقاً |
| Google Search Console + sitemap | اختياري |
| D5 دفع إلكتروني للمتجر | لاحقاً |
| رفع شعار من اللوحة (Storage) | تحسين E1 |
| لوحة كادر — ربط بيانات كامل | PARTIAL |
| **تواصل — Badge + `chat_notifications` + Realtime للجدول** | قبل العرض — انظر `docs/CHAT_SYSTEM_DISCUSSION.md` |
| **تواصل — غرف فئات / كادر / دعوات PIN من الواجهة** | مرحلة 2 |

---

## SQL — قاعدة العمل

- المساعد **يلصق السكربت كاملاً في المحادثة** (لا يكتفي باسم الملف فقط).
- المالك ينسخ → Supabase SQL Editor → «تم».

---

## ملفات المرجع

| ملف | محتوى |
|-----|--------|
| `docs/JOIN_SECTION1_LOCKED.md` | قسم 1 — أنواع الطلب والمرفقات |
| `docs/JOIN_SECTION2_GUARDIAN_GOALS.md` | قسم 2 — ولي الأمر (مقفول) |
| `docs/JOIN_SECTION3_STAFF.md` | قسم 3 — الكادر (مقفول) |
| `docs/JOIN_SECTION4_SUPPORTER.md` | قسم 4 — الداعم (مقفول) |
| `docs/JOIN_SECTION5_ACADEMY_MEMBER.md` | قسم 5 — عضو الأكاديمية (مقفول) |
| `docs/OWNER_FEEDBACK_BACKLOG.md` | **ملاحظات المالك (9 بنود) + أولويات تنفيذ** |
| `docs/LAUNCH_READINESS.md` | **هل الموقع جاهز للإطلاق؟ — قائمة تحقق** |
| `docs/PROJECT_ROADMAP.md` | خارطة تفصيلية + سجل التحديثات |
| `docs/RLS_DEPLOY_ORDER.md` | ترتيب SQL |
| `REFACTOR_PHASE0_REPORT.md` … `PHASE3` | تقارير refactor |
| `docs/ACADEMY_SETTINGS_RLS.sql` | إعدادات (مُنفَّذ ✅) |

---

## سجل آخر جلسة

| التاريخ | ماذا حصل |
|---------|----------|
| 2026-05-21 | E1: بناء لوحة إعدادات + ربط الموقع |
| 2026-05-21 | المالك نفّذ SQL إعدادات الأكاديمية — «تم» |
| 2026-05-21 | توثيق نقطة التوقف (هذا الملف) |
| 2026-05-21 | نشر E1 — `git push` → `bc6e9f0` على `main` |
| 2026-05-22 | توثيق ملاحظات المالك: `OWNER_FEEDBACK_BACKLOG.md` + `LAUNCH_READINESS.md` |
| 2026-05-22 | انضمام: قفل قسم 2؛ قسم 3 كادر — `approveAs: staff`، فلتر مجال، اعتماد `academy_staff` فقط |
| 2026-05-22 | قسم 4 داعم — `supporter-profile.js`، فلاتر إدارة، مرفقات حسب النوع، اعتماد `supporters` |
| 2026-05-22 | قسم 5 عضوية — `academy-member-profile.js`، `academy_members_requests.html`، بدون مرفقات، اعتماد `academy_members` |
