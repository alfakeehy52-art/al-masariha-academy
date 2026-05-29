/**
 * استعادة كلمة المرور — Supabase resetPasswordForEmail
 */
(function () {
  const PORTAL_KEY = "pw_reset_portal";

  function normalizeEmail(value) {
    return String(value || "").trim().toLowerCase();
  }

  function getSiteBase() {
    const cfg = window.SUPABASE_CONFIG || {};
    const fromCfg = String(cfg.siteUrl || "").replace(/\/$/, "");
    if (fromCfg) return fromCfg;
    return String(window.location.origin || "").replace(/\/$/, "");
  }

  function getPasswordResetRedirectUrl(kind) {
    const cfg = window.SUPABASE_CONFIG || {};
    const custom =
      kind === "staff" ? cfg.staffPasswordResetRedirect : cfg.adminPasswordResetRedirect;
    if (custom) return String(custom).trim();

    const base = getSiteBase();
    if (base) return `${base}/reset_password.html`;
    return new URL("reset_password.html", window.location.href).href;
  }

  function rememberResetPortal(kind) {
    try {
      localStorage.setItem(PORTAL_KEY, kind === "staff" ? "staff" : "admin");
    } catch (_e) {}
  }

  function readResetPortal() {
    try {
      const v = localStorage.getItem(PORTAL_KEY);
      return v === "staff" ? "staff" : "admin";
    } catch (_e) {
      return "admin";
    }
  }

  function clearResetPortal() {
    try {
      localStorage.removeItem(PORTAL_KEY);
    } catch (_e) {}
  }

  function formatResetError(error) {
    const msg = (error && error.message) || "";
    if (/rate limit/i.test(msg)) return "محاولات كثيرة — انتظر دقائق ثم حاول.";
    if (/invalid email/i.test(msg)) return "البريد غير صالح.";
    return msg || "تعذر إرسال رابط الاستعادة.";
  }

  async function requestPasswordResetEmail(email, kind) {
    if (typeof createSupabaseClient !== "function") {
      throw new Error("Supabase غير مهيأ.");
    }
    const normalized = normalizeEmail(email);
    if (!normalized) throw new Error("أدخل البريد الإلكتروني.");

    rememberResetPortal(kind);
    const client = createSupabaseClient();
    const redirectTo = getPasswordResetRedirectUrl(kind);
    const { error } = await client.auth.resetPasswordForEmail(normalized, { redirectTo });
    if (error) {
      const wrapped = new Error(formatResetError(error));
      wrapped.cause = error;
      throw wrapped;
    }
    return true;
  }

  async function validateStaffEmailForReset(email) {
    const normalized = normalizeEmail(email);
    if (!normalized) throw new Error("أدخل البريد الإلكتروني.");
    if (typeof fetchStaffCandidateByEmail === "function") {
      const row = await fetchStaffCandidateByEmail(normalized);
      if (!row) throw new Error("لا يوجد سجل كادر معتمد بهذا البريد.");
      if (String(row.status || "").toLowerCase() !== "active") {
        throw new Error("سجل الكادر غير نشط. تواصل مع الإدارة.");
      }
      return row;
    }
    const sb = createSupabaseClient();
    const { data, error } = await sb
      .from("academy_staff")
      .select("id,status,auth_user_id,email")
      .ilike("email", normalized)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("لا يوجد سجل كادر معتمد بهذا البريد.");
    if (String(data.status || "").toLowerCase() !== "active") {
      throw new Error("سجل الكادر غير نشط. تواصل مع الإدارة.");
    }
    return data;
  }

  async function adminRequestPasswordReset(email) {
    await requestPasswordResetEmail(email, "admin");
    return true;
  }

  async function staffRequestPasswordReset(email) {
    await validateStaffEmailForReset(email);
    await requestPasswordResetEmail(email, "staff");
    return true;
  }

  function panelResetKindForRow(row) {
    const cfg = window.SUPABASE_CONFIG || {};
    const emails = (cfg.adminEmails || []).map((e) => String(e).trim().toLowerCase()).filter(Boolean);
    const em = normalizeEmail(row?.email);
    if (em && emails.includes(em)) return "admin";
    if (row?.panel_level && String(row.panel_level).toUpperCase() !== "L5") return "admin";
    const role = String(row?.role || "").toLowerCase();
    if (role === "admin" || role === "manager") return "admin";
    return "staff";
  }

  async function sendStaffPasswordResetByRow(row) {
    if (!row?.email) throw new Error("لا يوجد بريد لهذا الكادر.");
    await validateStaffEmailForReset(row.email);
    const kind = panelResetKindForRow(row);
    await requestPasswordResetEmail(row.email, kind);
    return { kind };
  }

  async function exchangeRecoveryCodeIfPresent() {
    const client = createSupabaseClient();
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) return null;

    const { data, error } = await client.auth.exchangeCodeForSession(code);
    if (error) {
      console.warn("[auth-reset] code exchange:", error.message);
      return null;
    }
    return data?.session || null;
  }

  async function waitForRecoverySession(timeoutMs) {
    if (typeof createSupabaseClient !== "function") return null;
    const client = createSupabaseClient();
    const max = timeoutMs || 12000;

    const fromCode = await exchangeRecoveryCodeIfPresent();
    if (fromCode) return fromCode;

    const hash = String(window.location.hash || "").replace(/^#/, "");
    if (hash && /access_token=/i.test(hash)) {
      const { data, error } = await client.auth.getSession();
      if (!error && data?.session) return data.session;
    }

    const existing = await client.auth.getSession();
    if (existing.data?.session) return existing.data.session;

    return new Promise((resolve) => {
      let done = false;
      let subscription = null;
      const finish = (session) => {
        if (done) return;
        done = true;
        try {
          subscription?.unsubscribe();
        } catch (_e) {}
        clearTimeout(timer);
        resolve(session || null);
      };

      const listener = client.auth.onAuthStateChange((event, session) => {
        if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") finish(session);
      });
      subscription = listener?.data?.subscription || listener?.subscription || null;

      const timer = setTimeout(async () => {
        const { data } = await client.auth.getSession();
        finish(data?.session || null);
      }, max);
    });
  }

  async function completePasswordReset(newPassword) {
    const p = String(newPassword || "");
    if (p.length < 8) throw new Error("كلمة المرور قصيرة — 8 أحرف على الأقل.");
    const client = createSupabaseClient();
    const { error } = await client.auth.updateUser({ password: p });
    if (error) throw new Error(formatResetError(error));
    clearResetPortal();
    return true;
  }

  window.getPasswordResetRedirectUrl = getPasswordResetRedirectUrl;
  window.requestPasswordResetEmail = requestPasswordResetEmail;
  window.adminRequestPasswordReset = adminRequestPasswordReset;
  window.staffRequestPasswordReset = staffRequestPasswordReset;
  window.sendStaffPasswordResetByRow = sendStaffPasswordResetByRow;
  window.panelResetKindForRow = panelResetKindForRow;
  window.waitForRecoverySession = waitForRecoverySession;
  window.completePasswordReset = completePasswordReset;
  window.readResetPortal = readResetPortal;
})();
