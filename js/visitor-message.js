/**
 * رسائل آمنة — بدون مصطلحات تقنية (Supabase، RLS، SQL…).
 */
(function () {
  const TECH =
    /supabase|postgresql|postgres|pgrst|row\s*level|\brls\b|schema\s*cache|could\s*not\s*find|column\s*of|anon\s*key|api\s*key|service\s*role|\bjwt\b|\.sql\b|join_requests|request_completions|academy_staff|auth_user_id|panel_level|panel_domains|guardian_name|قاعدة\s*البيانات|\brpc\b|storage\s*bucket|permission\s*denied|violates|constraint|duplicate\s*key|fetch\s*failed|network\s*error|failed\s*to\s*fetch|\b401\b|\b403\b|\b500\b|internal\s*server|invalid\s*login|user\s*not\s*found|email\s*not\s*confirmed|pgrst116|timeout|undefined|null|oauth|authentication\s*→|providers/i;

  const STATUS_AR = {
    active: "نشط",
    inactive: "معطل",
    suspended: "موقوف",
    pending: "بانتظار المراجعة",
    review: "قيد المراجعة",
    reviewing: "قيد المراجعة",
    approved: "مقبول",
    accepted: "مقبول",
    rejected: "مرفوض",
    deleted: "محذوف",
    archived: "مؤرشف",
    draft: "مسودة",
    published: "منشور",
    new: "جديد",
    complete: "مكتمل",
    open: "مفتوح",
    closed: "مغلق"
  };

  const TYPE_AR = {
    player: "لاعب",
    guardian: "ولي أمر",
    coach: "مدرب",
    supporter: "داعم",
    volunteer: "متطوع",
    staff: "كادر",
    academy_member: "عضو أكاديمية"
  };

  const ROLE_AR = {
    admin: "المدير العام",
    manager: "مدير العمليات",
    supervisor: "مشرف",
    staff: "موظف",
    coach: "مدرب",
    viewer: "مشاهدة فقط"
  };

  function sanitizeVisitorMessage(msg, fallback) {
    const text = String(msg || "").trim();
    if (!text || TECH.test(text)) {
      return (
        fallback ||
        "تعذر إتمام العملية. حاول لاحقاً أو تواصل مع الأكاديمية عبر صفحة التواصل."
      );
    }
    return text;
  }

  function sanitizeAdminMessage(msg, fallback) {
    return sanitizeVisitorMessage(
      msg,
      fallback || "تعذر إتمام العملية. تحقق من الاتصال أو تواصل مع مسؤول النظام."
    );
  }

  function sanitizeAuthMessage(msg, fallback) {
    const text = String(msg || "").trim();
    if (!text || TECH.test(text) || /^[A-Za-z][A-Za-z\s.,:;'"-]{8,}$/.test(text)) {
      return fallback || "تعذر إكمال العملية. حاول لاحقاً.";
    }
    return sanitizeVisitorMessage(text, fallback);
  }

  function labelStatusAr(value, fallback) {
    const key = String(value || "")
      .trim()
      .toLowerCase();
    if (!key) return fallback || "—";
    if (STATUS_AR[key]) return STATUS_AR[key];
    if (/[\u0600-\u06FF]/.test(String(value))) return String(value).trim();
    return fallback || "غير محدد";
  }

  function labelTypeAr(value, fallback) {
    const key = String(value || "")
      .trim()
      .toLowerCase();
    if (!key) return fallback || "—";
    if (TYPE_AR[key]) return TYPE_AR[key];
    if (/[\u0600-\u06FF]/.test(String(value))) return String(value).trim();
    return fallback || "غير محدد";
  }

  function labelRoleAr(value, fallback) {
    const key = String(value || "")
      .trim()
      .toLowerCase();
    if (!key) return fallback || "—";
    if (ROLE_AR[key]) return ROLE_AR[key];
    if (/[\u0600-\u06FF]/.test(String(value))) return String(value).trim();
    return fallback || "غير محدد";
  }

  window.sanitizeVisitorMessage = sanitizeVisitorMessage;
  window.sanitizeAdminMessage = sanitizeAdminMessage;
  window.sanitizeAuthMessage = sanitizeAuthMessage;
  window.labelStatusAr = labelStatusAr;
  window.labelTypeAr = labelTypeAr;
  window.labelRoleAr = labelRoleAr;
})();
