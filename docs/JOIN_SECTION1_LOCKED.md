# قسم 1 — أنواع الطلبات والمرفقات (مقفل للعرض التشغيلي)

**التاريخ:** 2026-05-22  
**الحالة:** مُطبَّق في الواجهة — **بدون SQL تنظيف بيانات**.

## أنواع الطلبات الرسمية (استقبال جديد)

| `request_type` | الوصف |
|----------------|--------|
| `player` | لاعب |
| `guardian` | ولي أمر — غرضان فقط (انظر قسم 2) |
| `staff` | كادر |
| `supporter` | داعم |
| `academy_member` | عضو متابعة (أخبار/فعاليات) — بدون مرفقات |
| `coach` | أرشيف طلبات قديمة — يُعامل ككادر في الاستكمال |

## مُلغى — لا استقبال ولا عرض في القوائم

| ما أُلغي | البديل |
|---------|--------|
| **`volunteer`** (متطوع) | الكادر عبر `staff` |
| **`guardian_member_only`** (ولي أمر متابع فقط) | عضوية عبر `academy_member` أو ربط/تسجيل لاعب عبر `guardian` |

## مصدر الحقيقة

- `js/join-attachments-catalog.js`
- `js/guardian-goals.js` — غرضا ولي الأمر فقط
- `request_completion.html` + `smart_contract.html`

## أقسام لاحقة

- `docs/JOIN_SECTION2_GUARDIAN_GOALS.md`
- `docs/JOIN_SECTION3_STAFF.md`
- `docs/JOIN_SECTION4_SUPPORTER.md`
- `docs/JOIN_SECTION5_ACADEMY_MEMBER.md`
