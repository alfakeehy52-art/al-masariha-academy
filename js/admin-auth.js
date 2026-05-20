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

  function isAdminUser(user) {
    if (!user) return false;
    const { emails, requireRole } = getAdminConfig();
    const role =
      (user.app_metadata && user.app_metadata.role) ||
      (user.user_metadata && user.user_metadata.role);

    if (requireRole && role === "admin") return true;
    if (emails.length) {
      const email = String(user.email || "").trim().toLowerCase();
      return emails.indexOf(email) !== -1;
    }
    return !requireRole || role === "admin";
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
      if (session && isAdminUser(session.user)) return true;
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
      return "لا يوجد حساب بهذا البريد. أنشئ مستخدماً من لوحة Supabase.";
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
    if (!isAdminUser(data.user)) {
      await client.auth.signOut();
      throw new Error("هذا الحساب غير مصرح له بدخول لوحة الإدارة.");
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

  async function redirectIfAlreadyLoggedIn(targetPage) {
    if (await isAdminLoggedIn()) {
      window.location.replace(targetPage || "admin_dashboard.html");
      return true;
    }
    return false;
  }

  window.ADMIN_SESSION_KEY = LEGACY_SESSION_KEY;
  window.getAdminSession = getSession;
  window.isAdminUser = isAdminUser;
  window.isAdminLoggedIn = isAdminLoggedIn;
  window.requireAdmin = requireAdmin;
  window.adminLogin = adminLogin;
  window.adminLogout = adminLogout;
  window.redirectIfAlreadyLoggedIn = redirectIfAlreadyLoggedIn;
  window.formatAuthError = formatAuthError;
})();
