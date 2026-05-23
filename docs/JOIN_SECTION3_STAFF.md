# قسم 3 — الكادر (`staff`) — مقفول للعرض التشغيلي

**الحالة:** مكتمل محلياً (غير مرفوع على Pages حتى انتهاء كل الأقسام وملاحظات المالك).

## النطاق

| البند | القرار |
|--------|--------|
| نوع الطلب | `request_type = staff` فقط للكادر الجديد |
| المجالات | `sports` · `medical` · `admin` · `operations` · `media_tech` |
| الأدوار | معرّفات في `js/academy-roles.js` — كلها `approveAs: staff` |
| الاعتماد | **`academy_staff` فقط** — لا إنشاء في `volunteers` ولا `coaches` عند قبول طلب كادر |
| طلبات `coach` القديمة | صفحة منفصلة `coaches_requests.html` — أرشيف؛ الاستكمال يعاملها ككادر في الكتالوج |

## الانضمام

- `al_masariha_join_page.html` + `js/join-page-app.js`
- يحفظ: `volunteer_field` = معرّف المجال، `coach_job_title` = معرّف الدور، `coach_specialty` = تسمية الدور، وملاحظات `مجال الكادر:` / `الدور:` عبر `formatStaffNotes`

## الإدارة

- `staff_requests.html` — فلتر **المجال** (`staffDomainFilter`)
- `admin_requests_app.js` — `staffMeta` · تفاصيل المودال · `approveStaffRequest` → `createAcademyStaff`
- حقول السجل: `staff_category` (مجال) · `staff_type` (دور)

## مُلغى / لا يُستخدم

- **`volunteer`** كنوع طلب — محظور في الاستكمال والقائمة
- **`approveStaffRequestLegacy`** — حُذف؛ لا fallback لجداول المتطوعين/المدربين

## الاختبار المحلي

```bash
node scripts/test-attachments-catalog.js
```

يفحص مرفقات كادر (بما فيها سائق باص) و`parseStaffFromRequest` عبر `academy-roles.js`.

## القسم التالي

انظر `docs/JOIN_SECTION4_SUPPORTER.md`.
