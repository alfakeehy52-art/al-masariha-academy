/**
 * RBAC v1 — Level × Domain + قوالب المسميات التنظيمية
 */
(function () {
  const DOMAINS = {
    requests: { id: "requests", label: "الطلبات والمراجعة" },
    members: { id: "members", label: "الأعضاء والمنتسبون" },
    ops: { id: "ops", label: "التشغيل الرياضي" },
    store: { id: "store", label: "المتجر" },
    media: { id: "media", label: "الإعلام والمحتوى" },
    support: { id: "support", label: "الدعم الفني والتواصل" },
    system: { id: "system", label: "النظام والإعدادات" }
  };

  const LEVELS = {
    L1: { id: "L1", label: "تنفيذي / مدير عام", actions: ["read", "create", "update", "delete", "approve"] },
    L2: { id: "L2", label: "مدير قسم", actions: ["read", "create", "update", "delete", "approve"] },
    L3: { id: "L3", label: "نائب / مشرف", actions: ["read", "create", "update", "approve"] },
    L4: { id: "L4", label: "موظف", actions: ["read", "create", "update"] },
    L5: { id: "L5", label: "مشاهدة فقط", actions: ["read"] }
  };

  const ROLE_TEMPLATES = [
    { id: "gm", label: "المدير العام", level: "L1", domains: ["*"], jobTitle: "المدير العام", legacyRole: "admin" },
    { id: "deputy_gm", label: "نائب المدير العام", level: "L2", domains: ["requests", "members", "ops", "store", "media", "support"], jobTitle: "نائب المدير العام", legacyRole: "manager" },
    { id: "requests_mgr", label: "مدير الطلبات", level: "L2", domains: ["requests", "support"], jobTitle: "مدير الطلبات", legacyRole: "manager" },
    { id: "requests_deputy", label: "نائب مدير الطلبات", level: "L3", domains: ["requests", "support"], jobTitle: "نائب مدير الطلبات", legacyRole: "supervisor" },
    { id: "requests_staff", label: "موظف الطلبات", level: "L4", domains: ["requests"], jobTitle: "موظف الطلبات", legacyRole: "staff" },
    { id: "members_mgr", label: "مدير الأعضاء", level: "L2", domains: ["members"], jobTitle: "مدير الأعضاء", legacyRole: "manager" },
    { id: "members_super", label: "مشرف الأعضاء", level: "L3", domains: ["members"], jobTitle: "مشرف الأعضاء", legacyRole: "supervisor" },
    { id: "members_staff", label: "موظف الأعضاء", level: "L4", domains: ["members"], jobTitle: "موظف الأعضاء", legacyRole: "staff" },
    { id: "store_mgr", label: "مدير المتجر", level: "L2", domains: ["store"], jobTitle: "مدير المتجر", legacyRole: "manager" },
    { id: "store_deputy", label: "نائب مدير المتجر", level: "L3", domains: ["store"], jobTitle: "نائب مدير المتجر", legacyRole: "supervisor" },
    { id: "store_staff", label: "موظف المتجر", level: "L4", domains: ["store"], jobTitle: "موظف المتجر", legacyRole: "staff" },
    { id: "media_mgr", label: "مدير الإعلام", level: "L2", domains: ["media"], jobTitle: "مدير الإعلام", legacyRole: "manager" },
    { id: "media_super", label: "مشرف المحتوى", level: "L3", domains: ["media"], jobTitle: "مشرف المحتوى", legacyRole: "supervisor" },
    { id: "media_staff", label: "مصور / مخرج", level: "L4", domains: ["media"], jobTitle: "موظف إعلام", legacyRole: "staff" },
    { id: "support_mgr", label: "مدير الدعم الفني", level: "L2", domains: ["support"], jobTitle: "مدير الدعم الفني", legacyRole: "manager" },
    { id: "support_deputy", label: "نائب مدير الدعم الفني", level: "L3", domains: ["support"], jobTitle: "نائب مدير الدعم", legacyRole: "supervisor" },
    { id: "support_staff", label: "موظف الدعم الفني", level: "L4", domains: ["support"], jobTitle: "موظف الدعم الفني", legacyRole: "staff" },
    { id: "ops_mgr", label: "مدير التشغيل الرياضي", level: "L2", domains: ["ops"], jobTitle: "مدير التشغيل", legacyRole: "manager" },
    { id: "ops_super", label: "مشرف تشغيل", level: "L3", domains: ["ops"], jobTitle: "مشرف تشغيل", legacyRole: "supervisor" },
    { id: "viewer", label: "مشاهدة / مراجع", level: "L5", domains: ["requests", "members"], jobTitle: "مراجع", legacyRole: "viewer" },
    { id: "coach_ops", label: "مدرب — تشغيل", level: "L4", domains: ["ops"], jobTitle: "مدرب", legacyRole: "coach" }
  ];

  const LEGACY_ROLE_FALLBACK = {
    admin: { level: "L1", domains: ["*"], jobTitle: "المدير العام" },
    manager: { level: "L2", domains: ["requests", "members", "ops", "store", "media", "support"], jobTitle: "مدير عمليات" },
    supervisor: { level: "L3", domains: ["requests", "members"], jobTitle: "مشرف" },
    staff: { level: "L4", domains: ["requests"], jobTitle: "موظف" },
    coach: { level: "L4", domains: ["ops"], jobTitle: "مدرب" },
    viewer: { level: "L5", domains: ["requests"], jobTitle: "مشاهدة" }
  };

  function normalizeDomains(raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.map((d) => String(d || "").trim()).filter(Boolean);
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return normalizeDomains(parsed);
      } catch (_e) {
        return raw.split(/[,،]/).map((s) => s.trim()).filter(Boolean);
      }
    }
    return [];
  }

  function hasWildcard(domains) {
    return normalizeDomains(domains).includes("*");
  }

  function hasDomain(domains, domain) {
    const list = normalizeDomains(domains);
    if (hasWildcard(list)) return true;
    return list.includes(String(domain || "").trim());
  }

  function levelAllows(level, action) {
    const key = String(level || "L4").toUpperCase();
    const def = LEVELS[key] || LEVELS.L4;
    const act = String(action || "read").toLowerCase();
    return def.actions.includes(act);
  }

  function canAccess(ctx, domain, action) {
    if (!ctx) return false;
    if (ctx.isFullAdmin && domain !== "system") return levelAllows(ctx.level, action);
    if (ctx.isFullAdmin && domain === "system") return true;
    if (String(ctx.status || "").toLowerCase() === "suspended") return false;
    if (!hasDomain(ctx.domains, domain)) return false;
    if (domain === "system") {
      if (ctx.level === "L1") return true;
      if (ctx.level === "L2" && action === "read") return true;
      return false;
    }
    return levelAllows(ctx.level, action);
  }

  function templateById(id) {
    return ROLE_TEMPLATES.find((t) => t.id === id) || null;
  }

  function resolveFromProfile(profile, isFullAdmin) {
    if (isFullAdmin) {
      return {
        level: "L1",
        domains: ["*"],
        jobTitle: profile?.job_title_ar || "المدير العام",
        template: profile?.panel_template || "gm",
        status: profile?.status || "active",
        isFullAdmin: true
      };
    }
    const domains = normalizeDomains(profile?.panel_domains);
    const level = String(profile?.panel_level || "").toUpperCase();
    const legacy = LEGACY_ROLE_FALLBACK[String(profile?.role || "staff").toLowerCase()] || LEGACY_ROLE_FALLBACK.staff;
    const tpl = profile?.panel_template ? templateById(profile.panel_template) : null;
    return {
      level: level || tpl?.level || legacy.level,
      domains: domains.length ? domains : tpl?.domains || legacy.domains,
      jobTitle: profile?.job_title_ar || tpl?.jobTitle || profile?.job_title || legacy.jobTitle,
      template: profile?.panel_template || "",
      status: profile?.status || "active",
      isFullAdmin: false
    };
  }

  function staffSelectFields() {
    return "id,full_name,email,phone,staff_type,staff_category,job_title_ar,role,status,auth_user_id,panel_level,panel_domains,panel_template";
  }

  window.PanelRBAC = {
    DOMAINS,
    LEVELS,
    ROLE_TEMPLATES,
    normalizeDomains,
    hasDomain,
    levelAllows,
    canAccess,
    templateById,
    resolveFromProfile,
    staffSelectFields
  };
})();
