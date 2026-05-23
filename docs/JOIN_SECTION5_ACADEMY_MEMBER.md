# قسم 5 — عضو الأكاديمية (`academy_member`) — مقفول للعرض التشغيلي

**الحالة:** مكتمل محلياً (غير مرفوع على Pages حتى انتهاء كل الأقسام وملاحظات المالك).

## النطاق

| البند | القرار |
|--------|--------|
| نوع الطلب | `request_type = academy_member` — متابعة أخبار/فعاليات/عروض فقط |
| الاهتمامات | `news` · `events` · `store` · `future_player` · `support` — **واحد على الأقل إلزامي** |
| المرفقات | **لا يوجد** — رسالة توضيحية في الاستكمال |
| الاعتماد | جدول **`academy_members`** مع `member_code` و`interests` (jsonb) |
| مسار قديم | `guardian_goal` على طلب عضوية → **محظور** (كان `guardian_member_only`) |

## مصدر الحقيقة

- `js/academy-member-profile.js`
- `js/join-attachments-catalog.js` — `noAttachments` + تحقق الاهتمامات

## الانضمام

- `al_masariha_join_page.html` — شرائح اهتمام من الملف الموحّد
- `js/join-page-app.js` — `formatMemberNotes` بمعرّفات الاهتمام

## الإدارة

| الصفحة | الدور |
|--------|--------|
| `academy_members_requests.html` | طلبات انضمام جديدة (قبول/رفض) + فلتر اهتمام |
| `academy_members_dashboard.html` | الأعضاء المقبولون (حالة العضوية، إيقاف، …) |

## الاختبار المحلي

```bash
node scripts/test-attachments-catalog.js
```

## انتهاء أقسام الانضمام

أقسام الاستقبال (1–5) **مكتملة محلياً**. التالي: بنود العرض في `docs/LAUNCH_OWNER_SUMMARY.md` ثم **رفع Pages** بعد ملاحظات المالك.
