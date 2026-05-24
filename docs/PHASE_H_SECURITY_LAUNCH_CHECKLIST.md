# المرحلة H — أمان وتشغيل (قائمة نهائية)

---

## RLS — مراجعة سريعة

**المرجع الكامل:** `docs/RLS_DEPLOY_ORDER.md`

نفّذ في SQL Editor للتحقق:

```sql
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'join_requests', 'request_completions', 'players', 'coaches',
    'academy_staff', 'store_products', 'store_orders', 'contact_messages',
    'academy_settings', 'academy_members'
  )
ORDER BY tablename, policyname;
```

| التحقق | المتوقع |
|--------|---------|
| لا سياسة `USING (true)` على جداول حساسة للكتابة | ⬜ |
| زائر يرسل join / contact / store عبر RPC أو INSERT محدود | ⬜ |
| admin يرى الطلبات والاعتماد | ⬜ |

---

## حسابات الإدارة

| # | البند | ✓ |
|---|--------|---|
| 1 | `adminEmails` في `supabase-config.js` صحيحة | ⬜ |
| 2 | حساب Auth لكل مدير/موظف بنفس البريد | ⬜ |
| 3 | `STAFF_PANEL_ROLES.sql` مُنفَّذ | ⬜ |
| 4 | أدوار مُختبرة (خروج/دخول) | ⬜ |

---

## 2FA (توصية — لا يُفرض من الكود)

| الحساب | الإجراء |
|--------|---------|
| مالك Supabase | تفعيل 2FA على حساب supabase.com |
| GitHub / Cloudflare | 2FA مفعّل |
| بريد المدير (Gmail) | 2FA + نسخ احتياطي |

---

## نسخ احتياطي دوري

| ما | متى |
|----|-----|
| Supabase automated backup | Pro فقط — على Free استخدم CSV شهرياً |
| تصدير يدوي قبل تغيير كبير | قبل G (تنظيف) — ✅ 2026-05-24 |
| `academy_settings` | بعد كل تعديل مهم |

---

## قائمة «جاهز للتشغيل» (بدون دومين)

- [x] B — جوال P0 (موافقة)
- [x] C — صلاحيات
- [x] D — مرفقات إدارة
- [x] E — واجهة + سوشيال قريباً
- [x] F — مسار REQ مُختبر على الإنتاج
- [x] G — backup يدوي (CSV + Storage)
- [ ] G — تنظيف تجريبي (بموافقة — لم يُنفَّذ)
- [ ] H — RLS مراجعة + 2FA

**الموقع يبقى على pages.dev** حتى اعتماد الدومين لاحقاً — مقصود.

---

## تقرير المرحلة H

```text
مراجعة RLS: تمت / تحتاج إصلاح (اذكر الجدول):
2FA المالك: نعم / لا
جاهز للإعلان التشغيلي (بدون دومين): نعم / لا
```
