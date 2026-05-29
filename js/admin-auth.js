/**
 * حماية صفحات لوحة الإدارة — إخفاء فوري + تحقق النطاق
 */
(function panelPageGuardsModule() {
  const PANEL_PAGE_GUARDS = {
    "academy_settings_dashboard.html": { domain: "system", action: "read" },
    "admin_permissions_dashboard.html": { domain: "system", action: "update" },
    "admin_notifications.html": { domain: "system", action: "read" },
    "admin_members_dashboard.html": { domain: "members", action: "read" },
    "players_list_dashboard.html": { domain: "members", action: "read" },
    "players_add_dashboard.html": { domain: "members", action: "create" },
    "player_view_dashboard.html": { domain: "members", action: "read" },
    "edit_player_dashboard.html": { domain: "members", action: "update" },
    "coaches_dashboard.html": { domain: "members", action: "read" },
    "coaches_add_dashboard.html": { domain: "members", action: "create" },
    "coach_view_dashboard.html": { domain: "members", action: "read" },
    "guardians_dashboard.html": { domain: "members", action: "read" },
    "supporters_dashboard.html": { domain: "members", action: "read" },
    "admin_staff_dashboard.html": { domain: "members", action: "read" },
    "academy_members_dashboard.html": { domain: "members", action: "read" },
    "admin_requests_dashboard.html": { domain: "requests", action: "read" },
    "admin_requests.html": { domain: "requests", action: "read" },
    "admin_completion_dashboard.html": { domain: "requests", action: "read" },
    "players_requests.html": { domain: "requests", action: "read" },
    "coaches_requests.html": { domain: "requests", action: "read" },
    "guardians_requests.html": { domain: "requests", action: "read" },
    "supporters_requests.html": { domain: "requests", action: "read" },
    "staff_requests.html": { domain: "requests", action: "read" },
    "academy_members_requests.html": { domain: "requests", action: "read" },
    "volunteers_requests.html": { domain: "requests", action: "read" },
    "teams_categories_dashboard.html": { domain: "ops", action: "read" },
    "matches_dashboard.html": { domain: "ops", action: "read" },
    "stats_dashboard.html": { domain: "ops", action: "read" },
    "store_products_dashboard.html": { domain: "store", action: "read" },
    "store_orders_dashboard.html": { domain: "store", action: "read" },
    "news_dashboard.html": { domain: "media", action: "read" },
    "media_dashboard.html": { domain: "media", action: "read" },
    "communications_dashboard.html": { domain: "support", action: "read" },
    "contact_messages_dashboard.html": { domain: "support", action: "read" }
  };

  const PANEL_DENIED_MSG_KEY = "panel_denied_message";
  const PANEL_DENIED_DEFAULT = "حسابك لايملك الصلاحيات للدخول لهذه الصفحة";

  function currentPage() {
    return (window.location.pathname.split("/").pop() || "").toLowerCase();
  }

  function injectLockStyle() {
    if (document.getElementById("panel-page-lock-style")) return;
    const style = document.createElement("style");
    style.id = "panel-page-lock-style";
    style.textContent =
      "html.panel-page-locked,html.panel-page-locked body{visibility:hidden!important;background:#041009!important}" +
      ".admin-pro-menu.nav-policy-pending{visibility:hidden!important}" +
      ".admin-pro-menu [hidden],.menu-group[hidden],.nav-parent[hidden],.nav-link[hidden]{display:none!important}";
    (document.head || document.documentElement).appendChild(style);
  }

  function lockPanelContent() {
    injectLockStyle();
    document.documentElement.classList.add("panel-page-locked");
  }

  function unlockPanelContent() {
    document.documentElement.classList.remove("panel-page-locked");
  }

  function flashPanelDenied(message) {
    try {
      sessionStorage.setItem(PANEL_DENIED_MSG_KEY, String(message || PANEL_DENIED_DEFAULT).trim());
    } catch (_e) {}
  }

  function consumePanelDeniedFlash() {
    try {
      const msg = sessionStorage.getItem(PANEL_DENIED_MSG_KEY);
      if (msg) sessionStorage.removeItem(PANEL_DENIED_MSG_KEY);
      return msg || "";
    } catch (_e) {
      return "";
    }
  }

  function showPanelDeniedBanner(containerId) {
    const el = document.getElementById(containerId || "panelDeniedBanner");
    if (!el) return;
    const msg = consumePanelDeniedFlash();
    if (!msg) return;
    el.textContent = msg;
    el.hidden = false;
  }

  function getPageGuard(page) {
    return PANEL_PAGE_GUARDS[String(page || currentPage()).toLowerCase()] || null;
  }

  if (getPageGuard()) lockPanelContent();

  window.PANEL_PAGE_GUARDS = PANEL_PAGE_GUARDS;
  window.PANEL_DENIED_DEFAULT = PANEL_DENIED_DEFAULT;
  window.getPanelPageGuard = getPageGuard;
  window.lockPanelContent = lockPanelContent;
  window.unlockPanelContent = unlockPanelContent;
  window.flashPanelDenied = flashPanelDenied;
  window.consumePanelDeniedFlash = consumePanelDeniedFlash;
  window.showPanelDeniedBanner = showPanelDeniedBanner;
})();

(function () {
  const LOGIN_PAGE = "admin_login.html";
  const LEGACY_SESSION_KEY = "adminLoggedIn";

  function getAuthClient() {
    if (typeof createSupabaseClient !== "function") {
      throw new Error("Load supabase-config.js and js/supabase-client.js before admin-auth.js");
    }
    return createSupabaseClient();
  }

  function clearLegacySession() {
    try {
      localStorage.removeItem(LEGACY_SESSION_KEY);
      sessionStorage.removeItem(LEGACY_SESSION_KEY);
    } catch (e) {}
  }

  function getAdminConfig() {
    const cfg = window.SUPABASE_CONFIG || {};
    return {
      emails: (cfg.adminEmails || []).map(function (e) {
        return String(e).trim().toLowerCase();
      }).filter(Boolean),
      requireRole: cfg.adminRequireRole !== false
    };
  }

  const ADMIN_ROLE_LABELS = {
    admin: "المدير العام",
    manager: "مدير العمليات",
    supervisor: "مشرف",
    staff: "موظف",
    coach: "مدرب",
    viewer: "مشاهدة فقط"
  };

  function getAdminRole(user) {
    if (!user) return "";
    return String(
      (user.app_metadata && user.app_metadata.role) ||
        (user.user_metadata && user.user_metadata.role) ||
        ""
    )
      .trim()
      .toLowerCase();
  }

  function getAdminRoleLabel(user) {
    if (!user) return "مسؤول";
    if (isAdminUser(user)) {
      const role = getAdminRole(user);
      if (!role || role === "admin") return ADMIN_ROLE_LABELS.admin;
    }
    const role = getAdminRole(user);
    return ADMIN_ROLE_LABELS[role] || "مسؤول النظام";
  }

  function getAdminDisplayIdentity(user) {
    return {
      title: getAdminRoleLabel(user),
      email: user && user.email ? String(user.email).trim() : ""
    };
  }

  function isAdminUser(user) {
    if (!user) return false;
    const { emails, requireRole } = getAdminConfig();
    const role = getAdminRole(user);

    if (requireRole && role === "admin") return true;
    if (emails.length) {
      const email = String(user.email || "").trim().toLowerCase();
      return emails.indexOf(email) !== -1;
    }
    return !requireRole || role === "admin";
  }

  const PANEL_ROLE_SET = new Set(["admin", "manager", "supervisor", "staff", "coach", "viewer"]);

  function isPanelUserLegacy(user) {
    if (!user) return false;
    if (isAdminUser(user)) return true;
    const role = getAdminRole(user);
    const panelRoles = window.PANEL_ROLES || PANEL_ROLE_SET;
    if (!panelRoles.has(role)) return false;
    const { emails } = getAdminConfig();
    const email = String(user.email || "").trim().toLowerCase();
    if (!emails.length) return false;
    return emails.indexOf(email) !== -1;
  }

  function isPanelUser(user) {
    return isPanelUserLegacy(user);
  }

  async function canAccessAdminPanel(user) {
    if (!user) return false;
    if (isAdminUser(user)) return true;

    const email = String(user.email || "").trim().toLowerCase();
    if (!email) return false;

    if (typeof fetchStaffProfileByEmail === "function") {
      try {
        const profile = await fetchStaffProfileByEmail(email);
        if (profile) {
          const st = String(profile.status || "").toLowerCase();
          if (st === "suspended") return false;
          if (st === "active") return true;
        }
      } catch (e) {
        console.warn("[admin-auth] staff panel check:", e);
      }
    }

    return isPanelUserLegacy(user);
  }

  async function getSession() {
    const client = getAuthClient();
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    return data.session;
  }

  async function isAdminLoggedIn() {
    try {
      const session = await getSession();
      return !!(session && isAdminUser(session.user));
    } catch (e) {
      return false;
    }
  }

  function loadScriptOnce(src) {
    return new Promise((resolve, reject) => {
      const base = String(src).split("?")[0];
      if (document.querySelector(`script[src^="${base}"]`)) return resolve();
      const el = document.createElement("script");
      el.src = src;
      el.onload = () => resolve();
      el.onerror = () => reject(new Error("Failed: " + src));
      document.head.appendChild(el);
    });
  }

  async function ensurePanelAccessLoaded() {
    if (!window.PanelRBAC) await loadScriptOnce("js/panel-rbac.js?v=20260529-rbac2");
    if (typeof window.canPanel !== "function") await loadScriptOnce("js/panel-access.js?v=20260529-rbac2");
  }

  async function checkPageDomainAccess() {
    const guard =
      typeof getPanelPageGuard === "function"
        ? getPanelPageGuard()
        : window.PANEL_PAGE_GUARDS && window.PANEL_PAGE_GUARDS[(location.pathname.split("/").pop() || "").toLowerCase()];
    if (!guard) return true;
    if (typeof lockPanelContent === "function") lockPanelContent();
    await ensurePanelAccessLoaded();
    const session = await getSession();
    if (session?.user && typeof resolvePanelAccessContext === "function") {
      window.__panelAccessContext = await resolvePanelAccessContext(session.user);
    }
    const ok = typeof canPanel === "function" ? await canPanel(guard.domain, guard.action) : false;
    if (!ok) {
      if (typeof flashPanelDenied === "function") flashPanelDenied(window.PANEL_DENIED_DEFAULT);
      window.location.replace("admin_dashboard.html");
      return false;
    }
    if (typeof unlockPanelContent === "function") unlockPanelContent();
    return true;
  }

  async function requireAdmin() {
    clearLegacySession();
    try {
      const session = await getSession();
      if (session?.user) await ensurePanelAccessLoaded();
      if (session && (await canAccessAdminPanel(session.user))) {
        if (typeof fetchStaffProfileByEmail === "function") {
          const profile = await fetchStaffProfileByEmail(session.user.email);
          if (profile && String(profile.status || "").toLowerCase() === "suspended") {
            await getAuthClient().auth.signOut();
            window.location.replace(LOGIN_PAGE + "?suspended=1");
            return false;
          }
        }
        const domainOk = await checkPageDomainAccess();
        return domainOk;
      }
    } catch (e) {
      console.error("Admin auth check failed:", e);
    }
    window.location.replace(LOGIN_PAGE);
    return false;
  }

  function formatAuthError(error) {
    const msg = (error && error.message) || "";
    if (/invalid login credentials/i.test(msg)) {
      return "بيانات الدخول غير صحيحة. تحقق من البريد وكلمة المرور.";
    }
    if (/email not confirmed/i.test(msg)) {
      return "يرجى تأكيد البريد الإلكتروني من الرسالة المرسلة إليك.";
    }
    if (/user not found/i.test(msg)) {
      return "لا يوجد حساب بهذا البريد. تواصل مع مسؤول النظام لتفعيل الحساب.";
    }
    return msg || "تعذر تسجيل الدخول.";
  }

  async function adminLogin(email, password) {
    clearLegacySession();
    const client = getAuthClient();
    const { data, error } = await client.auth.signInWithPassword({
      email: String(email || "").trim(),
      password: String(password || "")
    });
    if (error) {
      const wrapped = new Error(formatAuthError(error));
      wrapped.cause = error;
      throw wrapped;
    }
    if (!(await canAccessAdminPanel(data.user))) {
      await client.auth.signOut();
      throw new Error("هذا الحساب غير مصرح له بدخول لوحة الإدارة.");
    }
    if (typeof fetchStaffProfileByEmail === "function") {
      const profile = await fetchStaffProfileByEmail(data.user.email);
      if (profile && String(profile.status || "").toLowerCase() === "suspended") {
        await client.auth.signOut();
        throw new Error("تم إيقاف حسابك. تواصل مع المدير العام.");
      }
    }
    if (typeof linkStaffProfileByEmail === "function") {
      try {
        await linkStaffProfileByEmail(data.user);
      } catch (linkErr) {
        console.warn("[admin-auth] staff link:", linkErr);
      }
    }
    return data;
  }

  async function adminLogout() {
    clearLegacySession();
    try {
      const client = getAuthClient();
      await client.auth.signOut();
    } catch (e) {}
    window.location.href = LOGIN_PAGE;
  }

  async function isPanelLoggedIn() {
    try {
      const session = await getSession();
      return !!(session && (await canAccessAdminPanel(session.user)));
    } catch (e) {
      return false;
    }
  }

  async function redirectIfAlreadyLoggedIn(targetPage) {
    if (await isPanelLoggedIn()) {
      window.location.replace(targetPage || "admin_dashboard.html");
      return true;
    }
    return false;
  }

  window.ADMIN_SESSION_KEY = LEGACY_SESSION_KEY;
  window.getAdminSession = getSession;
  window.getAdminRole = getAdminRole;
  window.getAdminRoleLabel = getAdminRoleLabel;
  window.getAdminDisplayIdentity = getAdminDisplayIdentity;
  window.ADMIN_ROLE_LABELS = ADMIN_ROLE_LABELS;
  window.isAdminUser = isAdminUser;
  window.isPanelUser = isPanelUser;
  window.canAccessAdminPanel = canAccessAdminPanel;
  window.isPanelLoggedIn = isPanelLoggedIn;
  window.isAdminLoggedIn = isAdminLoggedIn;
  window.requireAdmin = requireAdmin;
  window.adminLogin = adminLogin;
  window.adminLogout = adminLogout;
  window.redirectIfAlreadyLoggedIn = redirectIfAlreadyLoggedIn;
  window.formatAuthError = formatAuthError;
})();
