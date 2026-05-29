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

  function isPanelUser(user) {
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

  async function requireAdmin() {
    clearLegacySession();
    try {
      const session = await getSession();
      if (session && isPanelUser(session.user)) {
        if (typeof fetchStaffProfileByEmail === "function") {
          const profile = await fetchStaffProfileByEmail(session.user.email);
          if (profile && String(profile.status || "").toLowerCase() === "suspended") {
            await getAuthClient().auth.signOut();
            window.location.replace(LOGIN_PAGE + "?suspended=1");
            return false;
          }
        }
        return true;
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
    if (!isPanelUser(data.user)) {
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
      return !!(session && isPanelUser(session.user));
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
  window.isPanelLoggedIn = isPanelLoggedIn;
  window.isAdminLoggedIn = isAdminLoggedIn;
  window.requireAdmin = requireAdmin;
  window.adminLogin = adminLogin;
  window.adminLogout = adminLogout;
  window.redirectIfAlreadyLoggedIn = redirectIfAlreadyLoggedIn;
  window.formatAuthError = formatAuthError;
})();
