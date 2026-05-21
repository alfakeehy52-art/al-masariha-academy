# فحص الموقع — المرحلة 0

**التاريخ:** 2026-05-21  
**النطاق:** 55 صفحة HTML

---

## ملخص تنفيذي

| البند | العدد |
|-------|-------|
| صفحات HTML | 55 |
| مرتبطة بـ Supabase | 27 |
| تعتمد localStorage (وهمي) | 4 ملفات |
| محتوى demo ثابت (بدون DB) | ~12 |
| روابط `href="#"` | ✅ أُصلحت في A3 (فلاتر اللاعبين → أزرار) |
| **مرحلة A** | ✅ مكتملة (0 → A5) |
| **التالي** | **B1** أو **B2** |

---

## جدول المراجعة (55 صفحة)

| # | الملف | القرار | Supabase | ملاحظة |
|---|------|--------|----------|--------|
| 1 | `index.html` | ربط Supabase | جزئي | لاعبون ✅ — مدربون localStorage → **A1** |
| 2 | `al_masariha_join_page.html` | إبقاء | ✅ | انضمام + RPC |
| 3 | `al_masariha_players_page.html` | إبقاء | ✅ | قائمة لاعبين عامة |
| 4 | `al_masariha_coaches_page.html` | ربط Supabase | ❌ | localStorage + DEFAULT → **A1** |
| 5 | `al_masariha_coach_profile.html` | ربط Supabase | ❌ | بيانات JS ثابتة → **A1** |
| 6 | `al_masariha_player_profile_public.html` | إبقاء | ✅ | REST عام |
| 7 | `al_masariha_player_profile.html` | مراجعة | — | قالب/قديم |
| 8 | `al_masariha_store_page.html` | إخفاء/وسم | — | منتجات ثابتة → **B2** |
| 9 | `al_masariha_matches_page.html` | إخفاء/وسم | — | demo مباريات → **A5** |
| 10 | `al_masariha_match_details.html` | إخفاء/وسم | — | demo |
| 11 | `al_masariha_news_page.html` | إخفاء/وسم | — | أخبار ثابتة → **A5** |
| 12 | `al_masariha_media_page.html` | إخفاء/وسم | — | صور/فيديو ثابت |
| 13 | `al_masariha_stats_page.html` | إخفاء/وسم | — | إحصائيات ثابتة |
| 14 | `al_masariha_memberships_page.html` | إخفاء/وسم | — | `href="#"` ×3 |
| 15 | `al_masariha_about_page.html` | إبقاء | — | محتوى ثابت |
| 16 | `al_masariha_contact_page.html` | إبقاء | — | نموذج بدون إرسال DB → **C** |
| 17 | `al_masariha_supporters_page.html` | إبقاء | — | واجهة عامة |
| 18 | `al_masariha_supporter_profile.html` | مراجعة | — | قالب |
| 19 | `al_masariha_admin_page.html` | إبقاء | — | بوابة |
| 20 | `al_masariha_registration_page.html` | مراجعة | — | قديم؟ |
| 21 | `join.html` | إبقاء | ✅ | redirect/انضمام |
| 22 | `request_status.html` | إبقاء | ✅ | متابعة طلب |
| 23 | `request_completion.html` | إبقاء | ✅ | مرفقات |
| 24 | `admin_login.html` | إبقاء | ✅ | Auth |
| 25 | `admin_dashboard.html` | إبقاء | ✅ | لوحة رئيسية |
| 26 | `admin_requests.html` | إبقاء | ✅ | طلبات + إنشاء coach |
| 27 | `admin_requests_dashboard.html` | مراجعة | — | تكرار؟ |
| 28 | `admin_completion_dashboard.html` | إبقاء | ✅ | مراجعة مرفقات |
| 29 | `admin_notifications.html` | إبقاء | ✅ | |
| 30 | `admin_members_dashboard.html` | إبقاء | ✅ | |
| 31 | `admin_staff_dashboard.html` | إبقاء | ✅ | |
| 32 | `players_list_dashboard.html` | إبقاء | ✅ | |
| 33 | `players_add_dashboard.html` | إبقاء | ✅ | |
| 34 | `players_requests.html` | إبقاء | — | طلبات قديمة |
| 35 | `edit_player_dashboard.html` | إبقاء | ✅ | |
| 36 | `player_view_dashboard.html` | إبقاء | ✅ | |
| 37 | `coaches_dashboard.html` | إبقاء | ✅ | إدارة مدربين |
| 38 | `coaches_add_dashboard.html` | إبقاء | ✅ | إضافة مدرب |
| 39 | `coach_view_dashboard.html` | ربط Supabase | جزئي | عرض/تعديل localStorage → **A2** |
| 40 | `coaches_requests.html` | أرشفة | — | طلبات قديمة |
| 41 | `teams_categories_dashboard.html` | إبقاء | ✅ | فرق |
| 42 | `store_products_dashboard.html` | ربط لاحق | جزئي | localStorage → **B2** |
| 43 | `academy_members_dashboard.html` | إبقاء | ✅ | |
| 44 | `academy_settings_dashboard.html` | إبقاء | ✅ | |
| 45 | `stats_dashboard.html` | إبقاء | ✅ | |
| 46 | `guardians_dashboard.html` | إبقاء | — | |
| 47 | `guardians_requests.html` | إبقاء | — | |
| 48 | `supporters_dashboard.html` | إبقاء | — | |
| 49 | `supporters_requests.html` | إبقاء | — | |
| 50 | `volunteers_dashboard.html` | إبقاء | — | |
| 51 | `volunteers_requests.html` | إبقاء | — | |
| 52 | `staff_login.html` | إبقاء | ✅ | |
| 53 | `staff_dashboard.html` | إبقاء | ✅ | |
| 54 | `staff_requests.html` | إبقاء | — | |
| 55 | `smart_contract.html` | إبقاء | ✅ | خاص |

---

## 0.2 — تصنيف سريع

| التصنيف | الملفات |
|---------|---------|
| **إبقاء (جاهز)** | join, request_*, admin_requests, players_*, coaches_dashboard/add, RLS مسار الانضمام |
| **ربط Supabase (A1)** | `index`, `al_masariha_coaches_page`, `al_masariha_coach_profile` |
| **إخفاء/وسم «قريباً» (A5)** | matches, news, media, stats, memberships, مباريات index |
| **لاحق B2/B3** | store, teams عامة |
| **أرشفة** | coaches_requests, players_requests (قديم) |

---

## 0.3 — روابط مكسورة (`href="#"`)

| الملف | العدد | الموقع |
|-------|-------|--------|
| `al_masariha_coaches_page.html` | 3 | هيدر 🔔 🔍 + «ملف المدرب» |
| `al_masariha_players_page.html` | 5 | هيدر + أزرار |
| `al_masariha_memberships_page.html` | 3 | أزرار اشتراك |

**الحالة:** ✅ أُنجز في A3 (2026-05-21).

---

## هيدر مكرر

- **19/19** صفحة `al_masariha_*` العامة تستخدم `shared-layout.js` ✅ (بعد A4)
- لوحات الإدارة (`*_dashboard.html`) تحتفظ بهيدرها الخاص ✅

---

## المرحلة التالية

- **مرحلة A:** ✅ مكتملة (انضمام + لاعبون + مدربون + وسم demo)
- **التالي:** **B1** محتوى الرئيسية أو **B2** المتجر
