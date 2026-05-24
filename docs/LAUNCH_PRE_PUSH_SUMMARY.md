# ملخص قبل الرفع — مراحل B→E (ومستندات F–H)

**التاريخ:** 2026-05-23  
**الفرع:** `main` → Cloudflare Pages

---

## ما يُرفع في هذا الـ push

| مرحلة | ملخص التغييرات |
|--------|------------------|
| **B** | جوال: sidebar، جداول، انضمام، متابعة طلب |
| **C** | صلاحيات، `STAFF_PANEL_ROLES.sql`، لوحة الصلاحيات |
| **D** | مراجعة مرفقات كل الأنواع، `admin_requests` موحّد |
| **E** | سوشيال «قريباً»، `visitor-message.js` |
| **F–H** | مستندات اختبار وتشغيل (لا كود إضافي) |

---

## بعد الرفع — ماذا تفعل أنت؟

1. **F** — `docs/PHASE_F_FULL_PATH_TEST.md` على الإنتاج (15–30 دقيقة).
2. **G** — نسخة احتياطي؛ تنظيف تجريبي **فقط** بموافقة + `LAUNCH_CLEANUP_TEST_DATA.sql`.
3. **H** — `docs/PHASE_H_SECURITY_LAUNCH_CHECKLIST.md` + تفعيل 2FA.

---

## SQL سبق تنفيذه (لا يعاد إلا عند الحاجة)

- `STAFF_PANEL_ROLES.sql` ✅

---

## روابط سريعة

- الموقع: https://al-masariha-academy.pages.dev
- إدارة الطلبات: `/admin_requests.html`
- استكمال: `/admin_completion_dashboard.html`
