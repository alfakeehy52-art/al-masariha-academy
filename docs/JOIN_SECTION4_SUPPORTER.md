# قسم 4 — الداعم (`supporter`) — مقفول للعرض التشغيلي

**الحالة:** مكتمل محلياً (غير مرفوع على Pages حتى انتهاء كل الأقسام وملاحظات المالك).

## النطاق

| البند | القرار |
|--------|--------|
| نوع الطلب | `request_type = supporter` |
| أنواع الداعم | `individual` · `institution` · `sponsor_prospect` |
| مستويات الدعم | `basic` · `silver` · `gold` · `official_sponsor` |
| طرق الدعم | `financial` · `logistics` · `media_sponsorship` · `partnership` |
| الاعتماد | جدول **`supporters`** فقط (عبر `approveSupporterRequest`) |
| اسم الجهة | **مطلوب** للمؤسسة والراعي المحتمل |

## مصدر الحقيقة

- `js/supporter-profile.js` — معرّفات، تسميات عربية، تحليل طلب قديم/جديد
- `js/join-attachments-catalog.js` — مرفقات حسب نوع الداعم (سجل تجاري للمؤسسة، شعار إلزامي للراعي المحتمل)

## الانضمام

- `al_masariha_join_page.html` + `js/join-page-app.js`
- القوائم تُملأ من `SUPPORTER_PROFILE`؛ الحفظ بمعرّفات (`support_type`، `support_level`، `support_method`)
- ملاحظات منظمة: `نوع الداعم:` / `مستوى الدعم:` / `طريقة الدعم:`

## الإدارة

- `supporters_requests.html` — فلتر نوع الداعم + فلتر طريقة الدعم
- `admin_requests_app.js` — `supporterMeta` · تفاصيل المودال · اعتماد مع تحقق

## مرفقات الاستكمال

| نوع | إضافة |
|-----|--------|
| فرد | المجموعة الأساسية (هوية، عقد، تعهد، …) |
| مؤسسة | السجل التجاري / الترخيص **إلزامي** |
| راعٍ محتمل | شعار الجهة **إلزامي** |

## الاختبار المحلي

```bash
node scripts/test-attachments-catalog.js
```

## القسم التالي

انظر `docs/JOIN_SECTION5_ACADEMY_MEMBER.md`.
