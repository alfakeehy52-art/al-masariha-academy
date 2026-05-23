# قسم 2 — `guardian_goal` (مساران فقط) — مقفول

**الحالة:** مكتمل محلياً.

## القيم الرسمية

| `guardian_goal` | المعنى |
|-----------------|--------|
| `register_new_player` | تسجيل لاعب جديد عبر ولي الأمر |
| `link_existing_player` | ربط ولي أمر بلاعب/لاعبين مسجّلين |

## مُلغى

- **`guardian_member_only`** — لا يظهر في صفحة الانضمام ولا في فلاتر الإدارة. الطلبات القديمة في القاعدة تُعرض كـ«طلب قديم (غير مدعوم)» ولا تُستكمل مرفقاتها تلقائياً.

## الانضمام

`al_masariha_join_page.html` — زرّان فقط: تسجيل لاعب جديد | ربط بلاعب مسجّل.

## الإدارة

- `guardians_requests.html` — فلتر الغرض (خياران)
- `js/guardian-goals.js` — تسميات و`resolveMode` و`linkedPlayerNames`
- `approveGuardianRequest` — يرفض الاعتماد إن لم يُحدد غرض صالح

## القسم التالي

انظر `docs/JOIN_SECTION3_STAFF.md`.
