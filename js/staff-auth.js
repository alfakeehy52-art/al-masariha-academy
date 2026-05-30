(function () {
  const LOGIN_PAGE = "staff_login.html";
  const DASHBOARD_PAGE = "staff_dashboard.html";

  function getAuthClient() {
    if (typeof createSupabaseClient !== "function") {
      throw new Error("Load supabase-config.js and js/supabase-client.js before staff-auth.js");
    }
    return createSupabaseClient();
  }

  function normalizeEmail(value) {
    return String(value || "").trim().toLowerCase();
  }

  function getStaffConfig() {
    const cfg = window.SUPABASE_CONFIG || {};
    return {
      activationRedirect:
        cfg.staffActivationRedirect ||
        new URL(DASHBOARD_PAGE, window.location.href).href
    };
  }

  function formatAuthError(error) {
    const msg = (error && error.message) || "";
    if (/invalid login credentials/i.test(msg)) {
      return "بيانات الدخول غير صحيحة.";
    }
    if (/email not confirmed/i.test(msg)) {
      return "يرجى تأكيد البريد من الرسالة المرسلة ثم حاول الدخول.";
    }
    if (/user already registered/i.test(msg)) {
      return "هذا البريد مسجّل مسبقاً. استخدم تبويب «دخول» أو استعادة كلمة المرور.";
    }
    if (/signup is disabled/i.test(msg)) {
      return "التسجيل الذاتي غير متاح حالياً. تواصل مع إدارة الأكاديمية.";
    }
    return typeof sanitizeAuthMessage === "function"
      ? sanitizeAuthMessage(msg, "تعذر إكمال العملية.")
      : msg || "تعذر إكمال العملية.";
  }

  function isStaffSessionUser(user) {
    if (!user) return false;
    const role =
      (user.app_metadata && user.app_metadata.role) ||
      (user.user_metadata && user.user_metadata.role);
    return role === "staff";
  }

  async function getSession() {
    const client = getAuthClient();
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    return data.session;
  }

  async function fetchStaffByAuthUserId(userId) {
    const client = getAuthClient();
    const { data, error } = await client
      .from("academy_staff")
      .select("*")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async function fetchStaffCandidateByEmail(email) {
    const client = getAuthClient();
    const normalized = normalizeEmail(email);
    if (!normalized) return null;
    const { data, error } = await client
      .from("academy_staff")
      .select("*")
      .ilike("email", normalized)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  /**
   * يربط سجل academy_staff بالمستخدم الحالي عند أول دخول/تفعيل (نفس البريد).
   */
  async function linkStaffProfile(user) {
    if (!user || !user.id) return null;
    const existing = await fetchStaffByAuthUserId(user.id);
    if (existing) return existing;

    const email = normalizeEmail(user.email);
    if (!email) return null;

    const candidate = await fetchStaffCandidateByEmail(email);
    if (!candidate) return null;
    if (candidate.auth_user_id && String(candidate.auth_user_id) !== String(user.id)) {
      throw new Error("هذا البريد مربوط بحساب آخر. تواصل مع الإدارة.");
    }
    if (String(candidate.status || "") !== "active") {
      throw new Error("سجل الكادر غير نشط. تواصل مع إدارة الأكاديمية.");
    }

    const client = getAuthClient();
    const { data, error } = await client
      .from("academy_staff")
      .update({
        auth_user_id: user.id,
        updated_at: new Date().toISOString()
      })
      .eq("id", candidate.id)
      .is("auth_user_id", null)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    if (data) return data;

    return await fetchStaffByAuthUserId(user.id);
  }

  async function loadStaffProfile(user) {
    if (!user) return null;
    let profile = await fetchStaffByAuthUserId(user.id);
    if (!profile) profile = await linkStaffProfile(user);
    return profile;
  }

  async function isStaffLoggedIn() {
    try {
      const session = await getSession();
      if (!session || !session.user) return false;
      const profile = await loadStaffProfile(session.user);
      return !!profile && String(profile.status) === "active";
    } catch (e) {
      console.warn("Staff session check:", e);
      return false;
    }
  }

  async function requireStaff() {
    try {
      const session = await getSession();
      if (!session || !session.user) {
        window.location.replace(LOGIN_PAGE);
        return false;
      }
      const profile = await loadStaffProfile(session.user);
      if (!profile) {
        await staffLogout(false);
        window.location.replace(LOGIN_PAGE + "?err=no_profile");
        return false;
      }
      if (String(profile.status) !== "active") {
        await staffLogout(false);
        window.location.replace(LOGIN_PAGE + "?err=inactive");
        return false;
      }
      window.STAFF_PROFILE = profile;
      window.STAFF_USER = session.user;
      return true;
    } catch (e) {
      console.error("Staff auth check failed:", e);
      window.location.replace(LOGIN_PAGE);
      return false;
    }
  }

  async function staffLogin(email, password) {
    const client = getAuthClient();
    const { data, error } = await client.auth.signInWithPassword({
      email: normalizeEmail(email),
      password: String(password || "")
    });
    if (error) {
      const wrapped = new Error(formatAuthError(error));
      wrapped.cause = error;
      throw wrapped;
    }

    const profile = await linkStaffProfile(data.user);
    if (!profile) {
      await client.auth.signOut();
      throw new Error(
        "لا يوجد سجل كادر معتمد مرتبط بهذا البريد. تأكد من اعتماد طلبك وتطابق البريد، أو فعّل الحساب من تبويب التفعيل."
      );
    }
    if (String(profile.status) !== "active") {
      await client.auth.signOut();
      throw new Error("حساب الكادر غير نشط. تواصل مع الإدارة.");
    }
    return { session: data.session, profile };
  }

  async function staffActivate(email, password, fullName) {
    const normalized = normalizeEmail(email);
    if (!normalized) throw new Error("البريد الإلكتروني مطلوب.");

    const candidate = await fetchStaffCandidateByEmail(normalized);
    if (!candidate) {
      throw new Error(
        "لا يوجد سجل كادر معتمد بهذا البريد. يجب قبول طلبك أولاً من الإدارة."
      );
    }
    if (candidate.auth_user_id) {
      throw new Error("الحساب مفعّل مسبقاً. استخدم تبويب «دخول».");
    }
    if (String(candidate.status) !== "active") {
      throw new Error("سجل الكادر غير نشط.");
    }

    const client = getAuthClient();
    const { activationRedirect } = getStaffConfig();
    const { data, error } = await client.auth.signUp({
      email: normalized,
      password: String(password || ""),
      options: {
        emailRedirectTo: activationRedirect,
        data: {
          role: "staff",
          full_name: fullName || candidate.full_name || "",
          staff_id: candidate.id,
          staff_type: candidate.staff_type,
          staff_category: candidate.staff_category
        }
      }
    });

    if (error) {
      const wrapped = new Error(formatAuthError(error));
      wrapped.cause = error;
      throw wrapped;
    }

    if (data.session && data.user) {
      await linkStaffProfile(data.user);
      return { session: data.session, user: data.user, needsEmailConfirm: false };
    }

    return {
      session: null,
      user: data.user,
      needsEmailConfirm: true
    };
  }

  async function staffSendMagicLink(email) {
    const normalized = normalizeEmail(email);
    if (!normalized) throw new Error("أدخل البريد الإلكتروني.");

    const candidate = await fetchStaffCandidateByEmail(normalized);
    if (!candidate) {
      throw new Error("لا يوجد سجل كادر معتمد بهذا البريد.");
    }

    const client = getAuthClient();
    const { activationRedirect } = getStaffConfig();
    const { error } = await client.auth.signInWithOtp({
      email: normalized,
      options: { emailRedirectTo: activationRedirect }
    });
    if (error) {
      const wrapped = new Error(formatAuthError(error));
      wrapped.cause = error;
      throw wrapped;
    }
    return true;
  }

  async function staffLogout(redirect) {
    const shouldRedirect = redirect !== false;
    try {
      const client = getAuthClient();
      await client.auth.signOut();
    } catch (e) {}
    window.STAFF_PROFILE = null;
    window.STAFF_USER = null;
    if (shouldRedirect) window.location.href = LOGIN_PAGE;
  }

  async function redirectIfStaffLoggedIn(targetPage) {
    if (await isStaffLoggedIn()) {
      window.location.replace(targetPage || DASHBOARD_PAGE);
      return true;
    }
    return false;
  }

  function getStaffDisplayIdentity(profile, user) {
    const p = profile || window.STAFF_PROFILE || {};
    const u = user || window.STAFF_USER || {};
    const AR = window.ACADEMY_ROLES || {};
    let jobTitle = "";
    if (typeof getStaffJobTitle === "function") {
      jobTitle = getStaffJobTitle(p);
    } else if (typeof AR.getRoleLabel === "function") {
      jobTitle = AR.getRoleLabel(p.staff_type) || "";
      if (jobTitle === p.staff_type) jobTitle = "";
    }
    if (!jobTitle && p.job_title) jobTitle = String(p.job_title).trim();
    const domainLabel =
      typeof AR.getDomainLabel === "function"
        ? AR.getDomainLabel(p.staff_category) || ""
        : String(p.staff_category || "").trim();
    const name = p.full_name || u.email || "كادر";
    const email = p.email || u.email || "";
    const subtitle = [domainLabel, jobTitle].filter(Boolean).join(" · ");
    return {
      name,
      title: jobTitle || "كادر",
      domainLabel,
      jobTitle: jobTitle || "كادر",
      email,
      subtitle,
      welcome: "مرحباً " + name
    };
  }

  window.STAFF_LOGIN_PAGE = LOGIN_PAGE;
  window.STAFF_DASHBOARD_PAGE = DASHBOARD_PAGE;
  window.getStaffSession = getSession;
  window.linkStaffProfile = linkStaffProfile;
  window.loadStaffProfile = loadStaffProfile;
  window.isStaffLoggedIn = isStaffLoggedIn;
  window.requireStaff = requireStaff;
  window.staffLogin = staffLogin;
  window.staffActivate = staffActivate;
  window.staffSendMagicLink = staffSendMagicLink;
  window.staffLogout = staffLogout;
  window.redirectIfStaffLoggedIn = redirectIfStaffLoggedIn;
  window.formatStaffAuthError = formatAuthError;
  window.getStaffDisplayIdentity = getStaffDisplayIdentity;
})();
