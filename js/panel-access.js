/**
 * صلاحيات لوحة الإدارة — RBAC v1 (Level × Domain)
 */
(function () {
  const RBAC = () => window.PanelRBAC;

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

  const NAV_HIDDEN_GROUPS = {
    admin: [],
    manager: [],
    supervisor: [],
    staff: ["store", "media", "ops", "members"],
    coach: ["store", "media", "ops", "members", "requests"],
    viewer: ["store", "media", "ops", "members"]
  };

  function normalizeEmail(value) {
    return String(value || "").trim().toLowerCase();
  }

  function staffJobTitle(profile) {
    if (!profile || typeof profile !== "object") return "";
    if (profile.job_title_ar) return String(profile.job_title_ar).trim();
    if (profile.job_title) return String(profile.job_title).trim();
    const AR = window.ACADEMY_ROLES;
    const fromRole =
      AR && typeof AR.getRoleLabel === "function" ? AR.getRoleLabel(profile.staff_type) : "";
    if (fromRole && fromRole !== profile.staff_type) return fromRole;
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
    const job = staffJobTitle(profile);
    if (job) return job;
    const key = String(role || "").toLowerCase();
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

  async function fetchStaffProfileByEmail(email) {
    if (typeof createSupabaseClient !== "function") return null;
    const normalized = normalizeEmail(email);
    if (!normalized) return null;
    const fields = RBAC()?.staffSelectFields?.() || "id,full_name,email,staff_type,staff_category,job_title,role,status";
    try {
      const sb = createSupabaseClient();
      const minimal = "id,full_name,email,phone,role,status,auth_user_id";
      let { data, error } = await sb.from("academy_staff").select(fields).ilike("email", normalized).maybeSingle();
      if (error && /column|panel_|job_title/i.test(String(error.message || ""))) {
        const retry = await sb.from("academy_staff").select(minimal).ilike("email", normalized).maybeSingle();
        data = retry.data;
        error = retry.error;
      }
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

  async function resolvePanelAccessContext(user) {
    const fullAdmin = typeof isAdminUser === "function" && user && isAdminUser(user);
    const profile = await fetchStaffProfileByEmail(user?.email);
    const rbac = RBAC();
    if (rbac && typeof rbac.resolveFromProfile === "function") {
      return rbac.resolveFromProfile(profile, fullAdmin);
    }
    return {
      level: fullAdmin ? "L1" : "L4",
      domains: fullAdmin ? ["*"] : ["requests"],
      jobTitle: fullAdmin ? "المدير العام" : "موظف",
      status: profile?.status || "active",
      isFullAdmin: !!fullAdmin
    };
  }

  async function resolveEffectivePanelRole(user) {
    if (!user) return "";
    if (typeof isAdminUser === "function" && isAdminUser(user)) return "admin";
    const profile = await fetchStaffProfileByEmail(user.email);
    if (profile && String(profile.status || "").toLowerCase() === "suspended") return "suspended";
    const fromDb = roleFromStaffProfile(profile);
    if (fromDb) return fromDb;
    const authRole = authRoleFromUser(user);
    if (PANEL_ROLES.has(authRole)) return authRole;
    return "staff";
  }

  function buildDisplayIdentity(user, profile, effectiveRole) {
    const ctx = RBAC()?.resolveFromProfile?.(
      profile,
      typeof isAdminUser === "function" && user && isAdminUser(user)
    );
    const role = effectiveRole || roleFromStaffProfile(profile) || authRoleFromUser(user) || "staff";
    const title = ctx?.jobTitle || getPanelRoleLabel(role, profile);
    const email = user && user.email ? String(user.email).trim() : "";
    const subtitle =
      profile && !ctx?.isFullAdmin
        ? [staffDomainLabel(profile), ctx?.level ? "مستوى " + ctx.level : ""].filter(Boolean).join(" · ")
        : ctx?.level === "L1"
          ? "المدير العام"
          : "";
    return { title, email, subtitle, role, level: ctx?.level || "" };
  }

  function getNavHiddenGroups(role) {
    const key = String(role || "").toLowerCase();
    if (typeof isAdminUser === "function" && key === "admin") return [];
    return NAV_HIDDEN_GROUPS[key] || NAV_HIDDEN_GROUPS.staff;
  }

  function domainVisible(ctx, domain) {
    const rbac = RBAC();
    if (!rbac || !ctx) return false;
    if (ctx.isFullAdmin) return true;
    return rbac.hasDomain(ctx.domains, domain);
  }

  function syncGroupVisibility(menu) {
    menu.querySelectorAll("section[data-group]").forEach((group) => {
      const visible = group.querySelector(
        ".nav-link:not([hidden]), .nav-parent:not([hidden])"
      );
      if (!visible) group.setAttribute("hidden", "");
      else group.removeAttribute("hidden");
    });
    menu.querySelectorAll("[data-nav-parent]").forEach((parent) => {
      const visibleChild = parent.querySelector(".nav-sublink:not([hidden])");
      if (!visibleChild) parent.setAttribute("hidden", "");
      else parent.removeAttribute("hidden");
    });
  }

  function applyDomainNavVisibility(ctx) {
    const menu = document.querySelector(".admin-pro-menu");
    if (!menu || !ctx) return;

    menu.querySelectorAll("section[data-group]").forEach((group) => {
      const domain = group.getAttribute("data-panel-domain");
      if (!domain) return;
      if (domainVisible(ctx, domain)) group.removeAttribute("hidden");
      else group.setAttribute("hidden", "");
    });

    menu.querySelectorAll("[data-panel-domain]").forEach((el) => {
      const domain = el.getAttribute("data-panel-domain");
      if (domainVisible(ctx, domain)) el.removeAttribute("hidden");
      else el.setAttribute("hidden", "");
    });

    syncGroupVisibility(menu);
  }

  async function applyPanelNavPolicy(user) {
    const menu = document.querySelector(".admin-pro-menu");
    if (!menu) return;
    menu.classList.add("nav-policy-pending");

    const ctx = await resolvePanelAccessContext(user);
    window.__panelAccessContext = ctx;
    window.__effectivePanelRole = await resolveEffectivePanelRole(user);

    applyDomainNavVisibility(ctx);

    const canManageStaff = ctx.isFullAdmin || (RBAC() && RBAC().canAccess(ctx, "system", "update"));
    const canReadSystem = ctx.isFullAdmin || (RBAC() && RBAC().canAccess(ctx, "system", "read"));

    menu.querySelectorAll("[data-require-system-update]").forEach((el) => {
      if (!canManageStaff) el.setAttribute("hidden", "");
      else el.removeAttribute("hidden");
    });
    menu.querySelectorAll("[data-require-system-read]").forEach((el) => {
      if (!canReadSystem) el.setAttribute("hidden", "");
      else el.removeAttribute("hidden");
    });
    menu.querySelectorAll('[data-nav-role="admin"]').forEach((el) => {
      if (!canManageStaff) el.setAttribute("hidden", "");
      else el.removeAttribute("hidden");
    });

    syncGroupVisibility(menu);
    menu.classList.remove("nav-policy-pending");
  }

  async function resolvePanelIdentity(user) {
    if (!user) return buildDisplayIdentity(null, null, "");
    const effectiveRole = await resolveEffectivePanelRole(user);
    if (typeof isAdminUser === "function" && isAdminUser(user)) {
      const profile = await fetchStaffProfileByEmail(user.email);
      return buildDisplayIdentity(user, profile, "admin");
    }
    const profile = await fetchStaffProfileByEmail(user.email);
    return buildDisplayIdentity(user, profile, effectiveRole);
  }

  async function canPanel(domain, action) {
    const session = typeof getAdminSession === "function" ? await getAdminSession() : null;
    const user = session?.user;
    if (!user) return false;
    const ctx = window.__panelAccessContext || (await resolvePanelAccessContext(user));
    const rbac = RBAC();
    return rbac ? rbac.canAccess(ctx, domain, action) : false;
  }

  async function linkStaffProfileByEmail(user) {
    if (!user?.id || typeof createSupabaseClient !== "function") return null;
    const sb = createSupabaseClient();
    const { data: byAuth, error: authErr } = await sb
      .from("academy_staff")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    if (authErr) throw authErr;
    if (byAuth) return byAuth;

    const email = normalizeEmail(user.email);
    if (!email) return null;
    const { data: candidate, error: selErr } = await sb
      .from("academy_staff")
      .select("id,status,auth_user_id")
      .ilike("email", email)
      .maybeSingle();
    if (selErr) throw selErr;
    if (!candidate || candidate.auth_user_id) return candidate;
    if (String(candidate.status || "").toLowerCase() !== "active") return null;

    const { data, error } = await sb
      .from("academy_staff")
      .update({ auth_user_id: user.id, updated_at: new Date().toISOString() })
      .eq("id", candidate.id)
      .is("auth_user_id", null)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async function requirePanelPage(domain, action, redirectTo) {
    if (typeof lockPanelContent === "function") lockPanelContent();
    const loggedIn = typeof requireAdmin === "function" ? await requireAdmin() : false;
    if (!loggedIn) return false;
    const ok = await canPanel(domain, action);
    if (ok) {
      if (typeof unlockPanelContent === "function") unlockPanelContent();
      return true;
    }
    if (typeof flashPanelDenied === "function") {
      flashPanelDenied(window.PANEL_DENIED_DEFAULT);
    }
    window.location.replace(redirectTo || "admin_dashboard.html");
    return false;
  }

  async function requirePanelPermission(domain, action, redirectTo) {
    const ok = await canPanel(domain, action);
    if (ok) return true;
    if (typeof flashPanelDenied === "function") {
      flashPanelDenied("لا توجد صلاحية كافية لهذا الإجراء.");
    }
    if (redirectTo) window.location.replace(redirectTo);
    return false;
  }

  window.PANEL_ROLE_LABELS = PANEL_ROLE_LABELS;
  window.PANEL_ROLE_OPTIONS = PANEL_ROLE_OPTIONS;
  window.PANEL_ROLES = PANEL_ROLES;
  window.NAV_HIDDEN_GROUPS = NAV_HIDDEN_GROUPS;
  window.getPanelRoleLabel = getPanelRoleLabel;
  window.getNavHiddenGroups = getNavHiddenGroups;
  window.applyPanelNavPolicy = applyPanelNavPolicy;
  window.fetchStaffProfileByEmail = fetchStaffProfileByEmail;
  window.linkStaffProfileByEmail = linkStaffProfileByEmail;
  window.resolvePanelIdentity = resolvePanelIdentity;
  window.resolveEffectivePanelRole = resolveEffectivePanelRole;
  window.resolvePanelAccessContext = resolvePanelAccessContext;
  window.getStaffJobTitle = staffJobTitle;
  window.canPanel = canPanel;
  window.requirePanelPermission = requirePanelPermission;
  window.requirePanelPage = requirePanelPage;
})();
