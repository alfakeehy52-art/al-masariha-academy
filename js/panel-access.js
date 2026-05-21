/**
 * صلاحيات لوحة الإدارة — مرحلة R1 (عرض + تصفية القائمة)
 */
(function () {
  const PANEL_ROLE_LABELS = {
    admin: "المدير العام",
    manager: "مدير العمليات",
    supervisor: "مشرف",
    staff: "موظف",
    coach: "مدرب",
    viewer: "مشاهدة فقط"
  };

  const PANEL_ROLES = new Set(["admin", "manager", "supervisor", "staff", "coach", "viewer"]);

  const PANEL_ROLE_OPTIONS = [
    { value: "staff", label: "موظف — طلبات فقط" },
    { value: "supervisor", label: "مشرف — طلبات + أعضاء" },
    { value: "manager", label: "مدير عمليات — بدون إعدادات النظام" },
    { value: "coach", label: "مدرب — تشغيل محدود" },
    { value: "viewer", label: "مشاهدة فقط" },
    { value: "admin", label: "المدير العام (كامل)" }
  ];

  /** مجموعات القائمة الجانبية المخفية حسب الدور */
  const NAV_HIDDEN_GROUPS = {
    admin: [],
    manager: ["system"],
    supervisor: ["system"],
    staff: ["system", "commerce", "ops", "members"],
    coach: ["system", "commerce", "ops", "members", "requests"],
    viewer: ["system", "commerce", "ops", "members"]
  };

  function normalizeEmail(value) {
    return String(value || "").trim().toLowerCase();
  }

  function staffJobTitle(profile) {
    if (!profile || typeof profile !== "object") return "";
    const AR = window.ACADEMY_ROLES;
    const fromRole =
      AR && typeof AR.getRoleLabel === "function"
        ? AR.getRoleLabel(profile.staff_type)
        : "";
    if (fromRole && fromRole !== profile.staff_type) return fromRole;
    if (profile.job_title) return String(profile.job_title).trim();
    if (profile.staff_type) return String(profile.staff_type).trim();
    return "";
  }

  function staffDomainLabel(profile) {
    if (!profile) return "";
    const AR = window.ACADEMY_ROLES;
    if (AR && typeof AR.getDomainLabel === "function") {
      return AR.getDomainLabel(profile.staff_category) || "";
    }
    return String(profile.staff_category || "").trim();
  }

  function getPanelRoleLabel(role, profile) {
    const key = String(role || "").toLowerCase();
    if (key === "staff" && profile) {
      const job = staffJobTitle(profile);
      if (job) return job;
    }
    if (key === "admin" || !key) return PANEL_ROLE_LABELS.admin;
    return PANEL_ROLE_LABELS[key] || PANEL_ROLE_LABELS.staff;
  }

  function authRoleFromUser(user) {
    return typeof getAdminRole === "function" && user ? getAdminRole(user) : "";
  }

  function roleFromStaffProfile(profile) {
    if (!profile || !profile.role) return "";
    const dbRole = String(profile.role).trim().toLowerCase();
    return PANEL_ROLES.has(dbRole) ? dbRole : "";
  }

  async function resolveEffectivePanelRole(user) {
    if (!user) return "";
    if (typeof isAdminUser === "function" && isAdminUser(user)) return "admin";
    const profile = await fetchStaffProfileByEmail(user.email);
    const fromDb = roleFromStaffProfile(profile);
    if (fromDb) return fromDb;
    const authRole = authRoleFromUser(user);
    if (PANEL_ROLES.has(authRole)) return authRole;
    return "staff";
  }

  function buildDisplayIdentity(user, profile, effectiveRole) {
    const role = effectiveRole || roleFromStaffProfile(profile) || authRoleFromUser(user) || "staff";
    const title = getPanelRoleLabel(role, profile);
    const email = user && user.email ? String(user.email).trim() : "";
    const subtitle =
      profile && (role === "staff" || role === "coach")
        ? [staffDomainLabel(profile), staffJobTitle(profile)].filter(Boolean).join(" · ")
        : "";
    return { title, email, subtitle, role };
  }

  function getNavHiddenGroups(role) {
    const key = String(role || "").toLowerCase();
    if (typeof isAdminUser === "function" && key === "admin") return [];
    return NAV_HIDDEN_GROUPS[key] || NAV_HIDDEN_GROUPS.staff;
  }

  async function applyPanelNavPolicy(user) {
    const menu = document.querySelector(".admin-pro-menu");
    if (!menu) return;
    menu.querySelectorAll("[data-nav-role]").forEach((el) => el.removeAttribute("hidden"));
    const role = await resolveEffectivePanelRole(user);
    window.__effectivePanelRole = role;
    const isFullAdmin = typeof isAdminUser === "function" && isAdminUser(user);
    if (!isFullAdmin) {
      getNavHiddenGroups(role).forEach((groupId) => {
        const group = menu.querySelector(`[data-group="${groupId}"]`);
        if (group) group.setAttribute("hidden", "");
      });
      menu.querySelectorAll('[data-nav-role="admin"]').forEach((el) => {
        el.setAttribute("hidden", "");
      });
    }
  }

  async function fetchStaffProfileByEmail(email) {
    if (typeof createSupabaseClient !== "function") return null;
    const normalized = normalizeEmail(email);
    if (!normalized) return null;
    try {
      const sb = createSupabaseClient();
      const { data, error } = await sb
        .from("academy_staff")
        .select("id,full_name,email,staff_type,staff_category,job_title,role,status")
        .ilike("email", normalized)
        .maybeSingle();
      if (error) {
        console.warn("[panel-access] staff profile:", error.message);
        return null;
      }
      return data;
    } catch (e) {
      console.warn("[panel-access] staff profile fetch failed:", e);
      return null;
    }
  }

  async function resolvePanelIdentity(user) {
    if (!user) return buildDisplayIdentity(null, null, "");
    const effectiveRole = await resolveEffectivePanelRole(user);
    if (typeof isAdminUser === "function" && isAdminUser(user)) {
      return buildDisplayIdentity(user, null, "admin");
    }
    const profile = await fetchStaffProfileByEmail(user.email);
    return buildDisplayIdentity(user, profile, effectiveRole);
  }

  window.PANEL_ROLE_LABELS = PANEL_ROLE_LABELS;
  window.PANEL_ROLE_OPTIONS = PANEL_ROLE_OPTIONS;
  window.PANEL_ROLES = PANEL_ROLES;
  window.NAV_HIDDEN_GROUPS = NAV_HIDDEN_GROUPS;
  window.getPanelRoleLabel = getPanelRoleLabel;
  window.getNavHiddenGroups = getNavHiddenGroups;
  window.applyPanelNavPolicy = applyPanelNavPolicy;
  window.fetchStaffProfileByEmail = fetchStaffProfileByEmail;
  window.resolvePanelIdentity = resolvePanelIdentity;
  window.resolveEffectivePanelRole = resolveEffectivePanelRole;
  window.getStaffJobTitle = staffJobTitle;
})();
