# مراجعة تجربة الإدارة — قائمة تحقق

**آخر تحديث:** 2026-05-20  
**الهدف:** تثبيت النظام قبل التوسع — بدون refactor واسع.

## 1) الدخول والهوية

| # | المسار | الحالة | ملاحظة |
|---|--------|--------|--------|
| 1.1 | `admin_login.html` | ✅ | دخول + `role=admin` في JWT |
| 1.2 | رفض غير المصرع | ✅ | `adminRequireRole: true` |
| 1.3 | تسجيل خروج | ✅ | يمسح الجلسة ويعيد للدخول |

## 2) الطلبات والاعتماد

| # | المسار | الحالة | ملاحظة |
|---|--------|--------|--------|
| 2.1 | `admin_requests_dashboard.html` | ✅ | عرض كل الأنواع |
| 2.2 | اعتماد لاعب | ⚠️ | يعمل — راجع RLS `players` بعد SQL |
| 2.3 | اعتماد كادر | ✅ | يُنشئ `academy_staff` |
| 2.4 | `staff_requests.html` | ✅ | فلتر staff فقط |
| 2.5 | رسالة رابط التفعيل بعد اعتماد كادر | ✅ | `staff_login?email=` |

## 3) إدارة الكوادر (موحّد)

| # | المسار | الحالة | ملاحظة |
|---|--------|--------|--------|
| 3.1 | `admin_staff_dashboard.html` | ✅ | جدول + فلاتر + إحصائيات |
| 3.2 | فلتر المجال / الحالة / التفعيل | ✅ | `authFilter` |
| 3.3 | نسخ رابط بوابة الكادر | ✅ | من صف الإجراءات |
| 3.4 | إيقاف / تفعيل سجل | ✅ | تغيير `status` |
| 3.5 | RLS `academy_staff` | ✅ | admin كامل، كادر سجله فقط |

## 4) بقية الكيانات

| # | الوحدة | الحالة | ملاحظة |
|---|--------|--------|--------|
| 4.1 | `players` + لوحة الإدارة | ⏳ | SQL جاهز في `PLAYERS_RLS.sql` — طبّق في Supabase |
| 4.2 | `join_requests` | ⏳ | SQL جاهز في `JOIN_REQUESTS_RLS.sql` — طبّق في Supabase |
| 4.3 | `academy_members` | ☐ | مراجعة لاحقة |
| 4.4 | coaches / volunteers (قديم) | ☐ | دمج أو إيقاف تدريجي |

## 5) القائمة الجانبية والصلاحيات

| # | البند | الحالة | ملاحظة |
|---|-------|--------|--------|
| 5.1 | `role=admin` يرى كل المجموعات | ✅ | افتراضي |
| 5.2 | `role=manager` (مستقبلي) | ✅ | إخفاء commerce + system مُجهّز في `admin_sidebar.js` |
| 5.3 | عدّاد طلبات معلّقة | ✅ | `pendingRequests` badge |

## 6) النشر

| # | البند | الحالة |
|---|-------|--------|
| 6.1 | GitHub Pages يعرض آخر commit | ✅ |
| 6.2 | اختبار محلي Live Server 5500 | ✅ |
| 6.3 | Supabase Redirect URLs | ✅ | راجع عند تفعيل Confirm email |

---

## ملفات RLS الجديدة (الكود)

| ملف | الوظيفة |
|-----|---------|
| `docs/JOIN_REQUESTS_RLS.sql` | طلبات الانضمام + دوال lookup آمنة |
| `docs/PLAYERS_RLS.sql` | لاعبون + `search_players_public` |
| `docs/RLS_DEPLOY_ORDER.md` | ترتيب التطبيق |
| `js/supabase-public-lookup.js` | استدعاء RPC من الواجهة |

## ترتيب التوسع التالي

1. تطبيق SQL في Supabase (بنود 4.1 و 4.2)
2. `academy_members` — RLS
3. `request_completions` — مراجعة منفصلة
4. دمج/أرشفة لوحات coaches/volunteers القديمة

## قاعدة ذهبية

```sql
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'اسم_الجدول';
```

لا تترك سياسة بشرط `true` على جدول حساس.
