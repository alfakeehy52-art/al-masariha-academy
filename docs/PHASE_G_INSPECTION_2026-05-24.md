# تقرير فحص المرحلة G — 2026-05-24

**المالك:** نسخ احتياطي يدوي (CSV + Storage) — مكتمل ✅  
**قاعدة:** لا DELETE / TRUNCATE / تنظيف حتى موافقة صريحة بعد مراجعة هذا التقرير.

---

## 1) ما تم أرشفته (حسب ما أبلغت)

### جداول CSV (20 ملفاً تقريباً)

| مُصدَّر | ملاحظة |
|---------|--------|
| `academy_settings`, `join_requests`, `request_completions` | حرج |
| `players` (~451 KB) | الأكبر — بيانات لاعبين فعلية/تجريبية |
| `coaches`, `teams`, `guardians`, `player_guardians` | تشغيل |
| `academy_staff`, `academy_members`, `supporters`, `volunteers` | مجتمع |
| `store_products`, `matches`, `academy_news`, `academy_media` | محتوى ومتجر |
| `contact_messages`, `admin_notifications` | تواصل وإشعارات |
| `chat_rooms`, `chat_messages` | محادثات طلبات |

### اختياري — إن لم تُصدَّر بعد

| جدول | لماذا |
|------|--------|
| `store_orders` | طلبات المتجر — مذكور في سكربت التنظيف |
| `statistics` / `player_stats` | إن وُجدت في مشروعك |

### Storage (مجلدات مضغوطة)

`certificates`, `contracts`, `guardian-approval`, `ids`, `medical`, `photos`, `player-join`, `player-pledge`, `pledges`, `site-assets` — ✅ مناسب للأرشفة.

---

## 2) تحسينات فورية (بدون حذف)

| # | البند | الإجراء | من ينفّذ |
|---|--------|---------|----------|
| 1 | وصف البطل «قاعدة البيانات» | SQL أدناه أو من لوحة الإعدادات | المالك / SQL Editor |
| 2 | كمبوبوكس «المجال» أبيض | إصلاح في `admin_theme.css` — يحتاج **رفع** إلى `main` | مطوّر |
| 3 | بيانات تشغيلية | شعار، تواصل، فرق، منتجات من اللوحات | المالك |
| 4 | طلب اختبار `REQ-20260521-8416` | **بانتظار استكمال** — لا تحذفه إن أردت إكمال مسار D | — |

**SQL وصف البطل (آمن — UPDATE واحد):**

```sql
UPDATE public.academy_settings
SET hero_description = 'انضم للأكاديمية، تابع اللاعبين والمدربين والمباريات، وقدّم طلبك بخطوات واضحة.'
WHERE id = 'default';
```

---

## 3) معاينة التنظيف التجريبي (لا تُنفَّذ من المساعد)

**الملف المرجعي:** `docs/LAUNCH_CLEANUP_TEST_DATA.sql`

### ماذا يفعل السكربت الحالي إن نُفّذ كاملاً؟

| الخطوة | الجداول | الأثر |
|--------|---------|--------|
| 1 | `player_guardians`, `request_completions`, `admin_notifications` | حذف **كل** الصفوف |
| 2 | `join_requests` | حذف **كل** الطلبات |
| 3 | `players`, `coaches`, `guardians`, `supporters`, `volunteers` | حذف **كل** السجلات |
| 4 | `academy_staff` | **معطّل** في السكربت (سطر معلّق) — يبقى الكادر ما لم تفعّل السطر يدوياً |
| 5 | `academy_members`, `teams`, `matches`, `academy_news`, `academy_media`, `contact_messages`, `store_orders`, `store_products` | حذف **كل** الصفوف |

**لا يحذف:** `academy_settings`  
**لا يحذف تلقائياً:** `chat_rooms`, `chat_messages` (غير موجودة في السكربت)  
**بعد SQL يدوياً:** Storage تجريبي، مستخدمي Auth تجريبيين

### معاينة الأعداد (نفّذها أنت في SQL Editor — قراءة فقط)

```sql
SELECT 'join_requests' AS tbl, count(*) AS n FROM public.join_requests
UNION ALL SELECT 'request_completions', count(*) FROM public.request_completions
UNION ALL SELECT 'players', count(*) FROM public.players
UNION ALL SELECT 'coaches', count(*) FROM public.coaches
UNION ALL SELECT 'teams', count(*) FROM public.teams
UNION ALL SELECT 'guardians', count(*) FROM public.guardians
UNION ALL SELECT 'academy_staff', count(*) FROM public.academy_staff
UNION ALL SELECT 'academy_members', count(*) FROM public.academy_members
UNION ALL SELECT 'store_products', count(*) FROM public.store_products
UNION ALL SELECT 'store_orders', count(*) FROM public.store_orders
UNION ALL SELECT 'contact_messages', count(*) FROM public.contact_messages
UNION ALL SELECT 'chat_rooms', count(*) FROM public.chat_rooms
UNION ALL SELECT 'chat_messages', count(*) FROM public.chat_messages
ORDER BY tbl;
```

### توصية قبل أي موافقة على الحذف

1. الصق نتيجة المعاينة أعلاه في المحادثة.
2. قرّر: **تنظيف كامل** أم **حذف انتقائي** (مثلاً طلبات `REQ-%` تجريبية فقط) — السكربت الحالي **كامل** وليس انتقائياً.
3. إن وافقت، اكتب: **«أوافق على حذف التجريبي بالسكربت الكامل»** أو اطلب سكربت انتقائي.

---

## 4) المرحلة H — جاهز للبدء (بدون حذف)

| البند | ملف |
|--------|-----|
| مراجعة سياسات RLS | `docs/PHASE_H_SECURITY_LAUNCH_CHECKLIST.md` |
| ترتيب SQL السابق | `docs/RLS_DEPLOY_ORDER.md` |
| 2FA | Supabase + GitHub + Cloudflare + Gmail |

---

## 5) حالة G

| البند | الحالة |
|--------|--------|
| نسخ احتياطي CSV + Storage | ✅ |
| تنظيف تجريبي | ⏸️ بانتظار موافقة + معاينة أعداد |
| بيانات حقيقية | 🔄 مستمرة من اللوحات |
| الانتقال لـ H | ⬜ بعد إغلاق G أو بالتوازي |
