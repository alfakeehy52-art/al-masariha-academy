# خارطة طريق المشروع — أكاديمية المسارحة

**آخر تحديث:** 2026-05-21  
**الغرض:** متابعة ما أُنجز وأين نتوقف — حتى في محادثة Cursor جديدة.

**ملخص سريع:** [`docs/PROGRESS_CHECKPOINT.md`](PROGRESS_CHECKPOINT.md) ← اقرأه أولاً عند الانتقال لصفحة/محادثة جديدة.

---

## كيف تستأنف العمل في محادثة جديدة

اكتب للمساعد:

```text
اقرأ docs/PROGRESS_CHECKPOINT.md و docs/PROJECT_ROADMAP.md ونكمل من «التالي».
```

أو حدد مرحلة مباشرة: `نبدأ A1` / `نبدأ فحص` / `نكمل RLS`.

---

## المرحلة الحالية

| البند | القيمة |
|-------|--------|
| **المرحلة** | **E1 منشور** — SQL ✅ + كود ✅ على `main` (`bc6e9f0`) |
| **الإنتاج** | https://al-masariha-academy.pages.dev |
| **التالي** | ① تجربة لوحة الإعدادات على الإنتاج ② إعادة تصميم الواجهة ③ D5 دفع (لاحقاً) |
| **Soft Launch** | ✅ انضمام + طلبات + كوادر + إدارة + متجر |
| **سير العمل** | `git push origin main` → نشر تلقائي (لا نشر يدوي) |
| **نقطة التوقف** | [`PROGRESS_CHECKPOINT.md`](PROGRESS_CHECKPOINT.md) |

---

## ما أُنجز (لا تعيده إلا للصيانة)

### Refactor أساسي (كود)

| المرحلة | الحالة | ملخص |
|---------|--------|------|
| 0 | ✅ | إصلاح DNS، `supabase-config.js`، `admin-auth` أولي |
| 1 | ✅ | توحيد Supabase في الصفحات |
| 2 | ✅ | Supabase Auth للإدارة |
| 3 | ✅ | توحيد اعتماد `admin_completion_dashboard` + `request-completion-review.js` |

**تقارير:** `REFACTOR_PHASE0_REPORT.md` … `REFACTOR_PHASE3_REPORT.md`

### RLS + اختبار التشغيل (Supabase)

| الخطوة | الحالة | ملاحظة |
|--------|--------|--------|
| 1 | ✅ | `JOIN_REQUESTS_RLS.sql` + تنظيف |
| 2 | ✅ | `PLAYERS_RLS.sql` |
| 3 | ✅ | `REQUEST_COMPLETIONS_RLS.sql` |
| 4 | ✅ | bucket `academy_files` |
| 5 | ✅ | `REQUEST_COMPLETIONS_RLS_FIX.sql` (دالة upsert) |
| اختبار 1–5 | ✅ | انضمام، متابعة، admin، بحث ولي أمر، قائمة لاعبين |
| اختبار 6 | ✅ | مراجعة مرفقات admin |
| اختبار 7 | ✅ | إغلاق — `REFACTOR_PHASE3_REPORT.md` |

**ترتيب SQL:** `docs/RLS_DEPLOY_ORDER.md`

### ملفات مهمة أُضيفت/عُدّلت

- `js/supabase-public-lookup.js` — RPC عامة
- `js/request-completion-review.js` — شرط اعتماد المرفقات
- `docs/REQUEST_COMPLETIONS_RLS.sql` + `REQUEST_COMPLETIONS_RLS_FIX.sql`
- `docs/COACHES_RLS.sql` — RLS + RPC للمدربين
- `docs/PHASE0_SITE_AUDIT.md` — فحص 55 صفحة
- `docs/A1_TEST_REPORT.md` — تقرير اختبار A1
- `docs/ACADEMY_SETTINGS_RLS.sql` — إعدادات الموقع (جدول + RLS)
- `js/academy-settings.js` — تحميل/حفظ/تطبيق الإعدادات على الواجهة
- `academy_settings_dashboard.html` — لوحة إعدادات (بدل placeholder)
- `docs/PROGRESS_CHECKPOINT.md` — **نقطة التوقف** عند محادثة/صفحة جديدة

---

## خطة إنهاء الموقع (موافق عليها)

### المرحلة 0 — فحص كامل (الآن)

| # | المهمة | الحالة |
|---|--------|--------|
| 0.1 | جدول مراجعة كل صفحات HTML (~55) | ✅ `PHASE0_SITE_AUDIT.md` |
| 0.2 | تحديد: إبقاء / ربط Supabase / إخفاء «قريباً» | ✅ |
| 0.3 | قائمة روابط مكسورة (`#`, هيدر مكرر) | ✅ |

**تقدير:** نصف يوم مع المالك

---

### المرحلة A — «الموقع لا يكذب» (P0)

**هدف:** كل ما يظهر للزائر = حقيقي أو مُعلَم «قريباً» بوضوح.

| # | المهمة | الحالة | تقدير |
|---|--------|--------|-------|
| A1 | ربط المدربين: `index` + `al_masariha_coaches_page` + ملف عام ← Supabase | ✅ | 3–4 س |
| A2 | `coach_view_dashboard` ← Supabase (إزالة localStorage) | ✅ | 2–3 س |
| A3 | إصلاح روابط مكسورة + HTML معطوب (مباريات، عضويات، …) | ✅ | 1–2 س |
| A4 | توحيد `shared-layout` أو إخفاء أقسام غير جاهزة | ✅ | 3–5 س |
| A5 | إخفاء/وسم المحتوى الوهمي (مباريات، أخبار demo) | ✅ | 2–3 س |

**مجموع A:** ~12–18 ساعة

---

### المرحلة B — «الإدارة والواجهة متسقة» (P1)

| # | المهمة | الحالة | تقدير |
|---|--------|--------|-------|
| B1 | `index.html` — قرار محتوى + أقسام حية فقط | ✅ | 4–6 س |
| B2 | متجر: Supabase + `store_products_dashboard` + صفحة عامة | ✅ | 8–12 س |
| B3 | فرق: صفحة عامة أو ربط `teams` | ✅ | 4–6 س |
| B4 | CSS إدارة موحّد (تقليل التكرار) | ✅ | 6–10 س |
| B5 | RLS لجداول إضافية (`academy_members`؛ `teams`/`coaches` منجزة) | ✅ | 4–8 س |

**مجموع B:** ~20–30 ساعة

---

### المرحلة C — «منتج كامل» (P2)

| # | المهمة | الحالة | تقدير |
|---|--------|--------|-------|
| C0 | RLS: `guardians` + `supporters` + `volunteers` + `player_guardians` | ✅ | 2–4 س |
| C1a | مباريات: `matches` + لوحة + صفحة عامة | ✅ | 4–6 س |
| C1b | أخبار + إعلام من قاعدة بيانات | ✅ | 8–14 س |
| C1c | إحصائيات عامة (RPC من players + matches) | ✅ | 3–5 س |
| C2 | نموذج تواصل → Supabase | ✅ | 4–6 س |
| C3 | طلبات المتجر → Supabase | ✅ | 6–10 س |

- مباريات/أخبار/إعلام من قاعدة بيانات (C1)
- متجر دفع/طلبات
- نموذج تواصل يرسل لقاعدة أو بريد
- Cloudflare env + هيكلة `public/` / `admin/`
- جوال، SEO، أداء

**تقدير:** 30–50+ ساعة

---

### المرحلة D — تحسينات نهائية (الآن)

| # | المهمة | الحالة | ملاحظة |
|---|--------|--------|--------|
| D1 | `index.html` — نص المتجر + رابط متابعة طلب ORD | ✅ | 2026-05-21 |
| D2 | روابط «متابعة طلب» في `shared-layout` (انضمام vs متجر) | ✅ | 2026-05-21 |
| D3 | SEO أساسي (عناوين، وصف، Open Graph) | ✅ | 2026-05-21 |
| D4 | نشر Cloudflare Pages + GitHub Auto Deploy | ✅ | `al-masariha-academy.pages.dev` |
| D5 | دفع إلكتروني للمتجر | ⬜ | لاحقاً |
| E1 | إعدادات الأكاديمية — جدول + لوحة + ربط الهيدر/الفوتر/الرئيسية | ✅ SQL + ✅ كود + ✅ نشر | `bc6e9f0` — 2026-05-21 |

---

## حالة الأقسام (ملخص سريع)

| القسم | عام | إدارة | الحكم |
|--------|-----|--------|--------|
| انضمام + طلبات + مرفقات | ✅ | ✅ | DONE |
| لاعبون | ✅ | ✅ | DONE (بعد RLS) |
| مدربون | ✅ Supabase | ✅ Supabase | DONE |
| متجر | ✅ Supabase | ✅ | DONE |
| فرق | ✅ | ✅ | DONE |
| مباريات | ✅ Supabase | ✅ | DONE |
| أخبار/إعلام | ✅ Supabase | ✅ لوحات | DONE |
| إحصائيات | ✅ RPC | ✅ لوحة داخلية | DONE (بعد SQL) |
| إعدادات الموقع | ✅ من DB | ✅ لوحة | DONE (E1 — SQL ✅) |
| كوادر | join | ✅ staff | PARTIAL |
| أولياء/داعمون/متطوعون | join | entity app | ✅ |

---

## أول 10 ملفات للفحص (مرحلة 0)

1. `index.html`
2. `shared-layout.js`
3. `al_masariha_join_page.html`
4. `al_masariha_players_page.html`
5. `al_masariha_coaches_page.html`
6. `al_masariha_store_page.html`
7. `admin_requests.html`
8. `players_list_dashboard.html`
9. `teams_categories_dashboard.html`
10. `store_products_dashboard.html`

---

## قواعد العمل مع المساعد (Cursor)

1. **SQL:** يُوضَع كاملاً في المحادثة للنسخ → Supabase SQL Editor  
2. **خطوة بخطوة:** تنفّذ أنت → «تم» → الخطوة التالية  
3. **تحديث هذا الملف:** بعد كل مرحلة فرعية تُغلق، حدّث جدول الحالة و«المرحلة الحالية»  
4. **لا commit** إلا إذا طلبت صراحة

---

## سجل التحديثات

| التاريخ | ما تغيّر |
|---------|----------|
| 2026-05-21 | إنشاء الخارطة — إغلاق RLS 1–7 + خطة A/B/C |
| 2026-05-21 | إغلاق **0** — `PHASE0_SITE_AUDIT.md` |
| 2026-05-21 | إغلاق **A1** — `COACHES_RLS.sql` + صفحات عامة + `A1_TEST_REPORT.md` |
| 2026-05-21 | إغلاق **A2** — `coach_view_dashboard` من Supabase |
| 2026-05-21 | إغلاق **A3** — روابط `#` + إصلاح HTML مباريات |
| 2026-05-21 | إغلاق **A4** — `shared-layout` موحّد + رابط المدربين في القائمة |
| 2026-05-21 | إغلاق **A5** — وسم المحتوى التجريبي — **مرحلة A مكتملة** |
| 2026-05-21 | إغلاق **B1** — إعادة هيكلة `index.html` (أقسام حية + «قريبًا») |
| 2026-05-21 | إغلاق **B2** — متجر Supabase (`store_products` + لوحة + صفحة عامة) |
| 2026-05-21 | إغلاق **B3** — صفحة الفرق العامة + `TEAMS_RLS.sql` |
| 2026-05-21 | إغلاق **B4** — `admin_theme.css` موحّد |
| 2026-05-21 | إغلاق **B5** — `academy_members` RLS |
| 2026-05-21 | إغلاق **C0** — RLS مجتمع (`guardians` / `supporters` / `volunteers`) |
| 2026-05-21 | بدء **C1a** — `MATCHES_RLS.sql` + لوحة وصفحات عامة |
| 2026-05-21 | إغلاق **C1a** — RLS `matches` (سياسيتان: admin + public select) |
| 2026-05-21 | إغلاق **C1b–C2** — أخبار، إعلام، إحصائيات، تواصل |
| 2026-05-21 | إغلاق **C3** — `STORE_ORDERS_RLS.sql` + اختبار واجهة (طلب + متابعة + لوحة) |
| 2026-05-21 | **مرحلة C مكتملة** — بدء **D** (تحسينات نهائية) |
| 2026-05-21 | إغلاق **D1** — نص المتجر في الرئيسية + **D2** — روابط REQ/ORD في التنقل |
| 2026-05-21 | إغلاق **D3** — `js/site-seo.js` + `robots.txt` + `sitemap.xml` |
| 2026-05-21 | **D4 جاهز** — `_headers` / `_redirects` / `نشر-cloudflare.cmd` + اختبار SEO |
| 2026-05-21 | **إنتاج** — GitHub `main` + Cloudflare Auto Deploy + Staff/Admin RLS |
| 2026-05-21 | **E1** — `academy_settings` + لوحة إعدادات + ربط الموقع؛ SQL نُفّذ في Supabase |
| 2026-05-21 | **توثيق** — `PROGRESS_CHECKPOINT.md` لحفظ المراحل عند الانتقال لمحادثة جديدة |
| 2026-05-21 | **RLS لاعبين عامة** — `players_public_select` (صفحة اللاعبين) |
| 2026-05-21 | **SEO** — `normalizePageKey` لروابط بدون `.html` — commit `6a788ef` |
| 2026-05-21 | **نشر E1** — لوحة إعدادات + `academy-settings.js` — commit `bc6e9f0` |

---

## طلب تجريبي (للاختبار — اختياري)

- مرجع: `REQ-20260520-9999`
- جوال: `0599887766`
- **ملاحظة:** قد يكون **معتمداً** نهائياً — لاختبار جديد أنشئ طلباً من صفحة الانضمام.
