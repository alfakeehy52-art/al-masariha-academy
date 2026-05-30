(function () {
  let staffId = null;

  const STAFF_FIELDS =
    "id,full_name,email,phone,staff_type,staff_category,role,status,auth_user_id,panel_level,panel_domains,job_title_ar";

  function $(id) {
    return document.getElementById(id);
  }

  function showStatus(msg, type) {
    const el = $("saveStatus");
    if (!el) return;
    el.textContent = msg || "";
    el.className = "status-bar " + (type === "error" ? "err" : "ok");
    el.style.display = msg ? "block" : "none";
  }

  function normalizeEmail(value) {
    return String(value || "").trim().toLowerCase();
  }

  function emailLocalPart(email) {
    const e = normalizeEmail(email);
    const i = e.indexOf("@");
    return i > 0 ? e.slice(0, i) : e;
  }

  function isPlaceholderName(name, email) {
    const n = String(name || "").trim().toLowerCase();
    if (!n) return true;
    const local = emailLocalPart(email);
    if (local && n === local) return true;
    if (n === "المدير العام") return true;
    return false;
  }

  function isPlaceholderPhone(phone) {
    const p = String(phone || "").trim();
    if (!p) return true;
    if (p.startsWith("panel-")) return true;
    if (p === "0500000000") return true;
    return false;
  }

  async function loadAcademySettingsSafe() {
    try {
      if (typeof loadAcademySettings === "function") {
        return (await loadAcademySettings()) || window.ACADEMY_SETTINGS || {};
      }
    } catch (_e) {}
    return window.ACADEMY_SETTINGS || {};
  }

  function resolvePersonalName(user, profile, settings) {
    const fromProfile = String(profile?.full_name || "").trim();
    const fromMeta = String(user?.user_metadata?.full_name || "").trim();
    const fromSignatory = String(settings?.official_signatory_name_ar || "").trim();
    const email = user?.email || "";

    if (fromProfile && !isPlaceholderName(fromProfile, email)) return fromProfile;
    if (fromMeta && !isPlaceholderName(fromMeta, email)) return fromMeta;
    if (fromSignatory) return fromSignatory;
    if (fromProfile) return fromProfile;
    if (fromMeta) return fromMeta;
    return emailLocalPart(email) || "";
  }

  function resolvePhone(profile, user, settings) {
    const fromProfile = String(profile?.phone || "").trim();
    const fromMeta = String(user?.user_metadata?.phone || "").trim();
    const fromAcademy = String(settings?.contact_phone || "").trim();
    if (fromProfile && !isPlaceholderPhone(fromProfile)) return fromProfile;
    if (fromMeta) return fromMeta;
    if (fromAcademy) return fromAcademy;
    return "";
  }

  function bootstrapPhone(user, settings) {
    const fromMeta = String(user?.user_metadata?.phone || "").trim();
    if (fromMeta) return fromMeta;
    const fromAcademy = String(settings?.contact_phone || "").trim();
    if (fromAcademy) return fromAcademy;
    return "panel-" + String(user?.id || "user").replace(/-/g, "").slice(0, 18);
  }

  async function fetchStaffByAuthUserId(sb, userId) {
    const { data, error } = await sb.from("academy_staff").select(STAFF_FIELDS).eq("auth_user_id", userId).maybeSingle();
    if (error) throw error;
    return data;
  }

  async function linkPendingStaff(sb, user) {
    if (!user?.id) return null;
    const existing = await fetchStaffByAuthUserId(sb, user.id);
    if (existing) return existing;

    const email = normalizeEmail(user.email);
    if (!email) return null;

    const { data: candidate, error: selErr } = await sb
      .from("academy_staff")
      .select(STAFF_FIELDS)
      .ilike("email", email)
      .maybeSingle();
    if (selErr) throw selErr;
    if (!candidate) return null;
    if (candidate.auth_user_id && String(candidate.auth_user_id) !== String(user.id)) {
      throw new Error("هذا البريد مربوط بحساب آخر.");
    }
    if (String(candidate.status || "").toLowerCase() !== "active") {
      throw new Error("سجل الكادر غير نشط.");
    }
    if (candidate.auth_user_id) return candidate;

    const { data, error } = await sb
      .from("academy_staff")
      .update({ auth_user_id: user.id, updated_at: new Date().toISOString() })
      .eq("id", candidate.id)
      .is("auth_user_id", null)
      .select(STAFF_FIELDS)
      .maybeSingle();
    if (error) throw error;
    return data || (await fetchStaffByAuthUserId(sb, user.id));
  }

  async function bootstrapStaffRow(sb, user, settings) {
    const email = normalizeEmail(user.email);
    if (!email) throw new Error("لا يوجد بريد في الجلسة.");
    const isGm = typeof isAdminUser === "function" && isAdminUser(user);
    const insert = {
      full_name: resolvePersonalName(user, null, settings) || email.split("@")[0],
      email,
      phone: bootstrapPhone(user, settings),
      staff_type: isGm ? "general_manager" : "staff",
      staff_category: "admin",
      status: "active",
      role: isGm ? "admin" : "staff",
      auth_user_id: user.id
    };
    if (isGm) {
      insert.panel_level = "L1";
      insert.panel_domains = ["*"];
      insert.job_title_ar = "المدير العام";
    }

    let { data, error } = await sb.from("academy_staff").insert([insert]).select(STAFF_FIELDS).single();
    if (error && /column|panel_|job_title/i.test(String(error.message || ""))) {
      const minimal = {
        full_name: insert.full_name,
        email: insert.email,
        phone: insert.phone,
        staff_type: insert.staff_type,
        staff_category: insert.staff_category,
        status: insert.status,
        role: insert.role,
        auth_user_id: insert.auth_user_id
      };
      const retry = await sb.from("academy_staff").insert([minimal]).select(STAFF_FIELDS).single();
      data = retry.data;
      error = retry.error;
    }
    if (error) throw error;
    return data;
  }

  async function ensureStaffRow(user, settings) {
    const sb = createSupabaseClient();

    let profile = await fetchStaffByAuthUserId(sb, user.id).catch(() => null);
    if (profile) {
      if (String(profile.status || "").toLowerCase() !== "active") {
        throw new Error("سجل الكادر غير نشط. تواصل مع المدير العام.");
      }
      staffId = profile.id;
      return profile;
    }

    profile = await linkPendingStaff(sb, user);
    if (profile) {
      staffId = profile.id;
      return profile;
    }

    if (typeof fetchStaffProfileByEmail === "function") {
      profile = await fetchStaffProfileByEmail(user.email);
      if (profile && String(profile.status || "").toLowerCase() !== "active") {
        throw new Error("سجل الكادر غير نشط. تواصل مع المدير العام.");
      }
      if (profile) {
        profile = (await linkPendingStaff(sb, user)) || profile;
        if (profile?.id) {
          staffId = profile.id;
          return profile;
        }
      }
    }

    const isGm = typeof isAdminUser === "function" && isAdminUser(user);
    if (isGm) {
      profile = await bootstrapStaffRow(sb, user, settings);
      staffId = profile.id;
      return profile;
    }

    throw new Error(
      "لا يوجد سجل كادر نشط لهذا البريد. اطلب من المدير العام إضافتك من «الموظفون والصلاحيات»."
    );
  }

  function fillForm(user, profile, identity, settings) {
    $("accEmail").value = user.email || "";
    $("accRole").value = identity?.title || profile?.job_title_ar || "—";
    $("accName").value = resolvePersonalName(user, profile, settings);
    $("accPhone").value = resolvePhone(profile, user, settings);
    applyAccountFormState(!!profile?.id);
  }

  function applyAccountFormState(linked) {
    const canSaveProfile = !!linked;
    if ($("accName")) $("accName").disabled = !canSaveProfile;
    if ($("accPhone")) $("accPhone").disabled = !canSaveProfile;
    if ($("saveProfileBtn")) $("saveProfileBtn").disabled = !canSaveProfile;
  }

  async function loadForm() {
    const session = await getAdminSession();
    const user = session?.user;
    if (!user) return;

    try {
      if (typeof ensurePanelAccessLoaded === "function") await ensurePanelAccessLoaded();
      if (typeof resolvePanelAccessContext === "function") {
        window.__panelAccessContext = await resolvePanelAccessContext(user);
      }
    } catch (e) {
      console.warn("[admin-account] rbac:", e);
    }

    const settings = await loadAcademySettingsSafe();
    const identity =
      typeof resolvePanelIdentity === "function" ? await resolvePanelIdentity(user) : { title: "مسؤول" };

    try {
      const profile = await ensureStaffRow(user, settings);
      fillForm(user, profile, identity, settings);
      showStatus("", "ok");
    } catch (e) {
      console.error("[admin-account]", e);
      fillForm(user, null, identity, settings);
      showStatus(
        e?.message ||
          "تعذر ربط حسابك بجدول الكوادر. يمكنك تحديث كلمة المرور؛ لحفظ الاسم والجوال تواصل مع المدير العام.",
        "error"
      );
    }
  }

  async function saveProfile() {
    if (!staffId) {
      showStatus("لا يمكن الحفظ قبل ربط الحساب بجدول الكوادر.", "error");
      return;
    }
    showStatus("جاري الحفظ...", "ok");
    try {
      const sb = createSupabaseClient();
      const payload = {
        full_name: String($("accName").value || "").trim() || null,
        phone: String($("accPhone").value || "").trim() || bootstrapPhone({ id: staffId }, {}),
        updated_at: new Date().toISOString()
      };
      const { error } = await sb.from("academy_staff").update(payload).eq("id", staffId);
    if (error) throw error;
    showStatus("تم حفظ بياناتك.", "ok");
    if (typeof logPanelAudit === "function") {
      void logPanelAudit({
        domain: "account",
        action: window.PANEL_AUDIT?.ACCOUNT_PROFILE || "account.profile_update",
        entityType: "academy_staff",
        entityId: staffId,
        summary: "تحديث الاسم والجوال من صفحة حسابي"
      });
    }
    } catch (e) {
      console.error(e);
      showStatus("تعذر الحفظ: " + (e.message || ""), "error");
    }
  }

  async function savePassword() {
    const p1 = String($("accPass").value || "");
    const p2 = String($("accPass2").value || "");
    if (p1.length < 8) {
      showStatus("كلمة المرور قصيرة — 8 أحرف على الأقل.", "error");
      return;
    }
    if (p1 !== p2) {
      showStatus("تأكيد كلمة المرور غير متطابق.", "error");
      return;
    }
    showStatus("جاري التحديث...", "ok");
    try {
      const sb = createSupabaseClient();
      const { error } = await sb.auth.updateUser({ password: p1 });
      if (error) throw error;
      $("accPass").value = "";
      $("accPass2").value = "";
      showStatus("تم تحديث كلمة المرور.", "ok");
      if (typeof logPanelAudit === "function") {
        void logPanelAudit({
          domain: "auth",
          action: window.PANEL_AUDIT?.AUTH_PASSWORD || "auth.password_change",
          summary: "تحديث كلمة المرور من صفحة حسابي"
        });
      }
    } catch (e) {
      console.error(e);
      showStatus("تعذر تحديث كلمة المرور: " + (e.message || ""), "error");
    }
  }

  function bind() {
    $("saveProfileBtn")?.addEventListener("click", saveProfile);
    $("savePassBtn")?.addEventListener("click", savePassword);
  }

  async function boot() {
    bind();
    await loadForm();
  }

  window.adminAccountBoot = boot;
  window.adminLinkStaffOnLogin = async function (user) {
    if (!user?.id || typeof createSupabaseClient !== "function") return null;
    const sb = createSupabaseClient();
    return linkPendingStaff(sb, user);
  };
  window.resolveStaffPersonalName = resolvePersonalName;
})();
