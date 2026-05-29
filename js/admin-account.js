(function () {
  let staffId = null;

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

  async function ensureStaffRow(user) {
    const sb = createSupabaseClient();
    const email = String(user.email || "").trim();
    let profile = null;
    if (typeof fetchStaffProfileByEmail === "function") {
      profile = await fetchStaffProfileByEmail(email);
    }
    if (profile) {
      staffId = profile.id;
      return profile;
    }
    const insert = {
      full_name: user.user_metadata?.full_name || email.split("@")[0],
      email,
      phone: user.user_metadata?.phone || null,
      status: "active",
      role: typeof isAdminUser === "function" && isAdminUser(user) ? "admin" : "staff",
      panel_level: typeof isAdminUser === "function" && isAdminUser(user) ? "L1" : "L4",
      panel_domains: typeof isAdminUser === "function" && isAdminUser(user) ? ["*"] : ["requests"],
      job_title_ar: typeof isAdminUser === "function" && isAdminUser(user) ? "المدير العام" : "موظف",
      auth_user_id: user.id
    };
    const { data, error } = await sb.from("academy_staff").insert([insert]).select("*").single();
    if (error) throw error;
    staffId = data.id;
    return data;
  }

  async function loadForm() {
    const session = await getAdminSession();
    const user = session?.user;
    if (!user) return;
    const profile = await ensureStaffRow(user);
    const identity =
      typeof resolvePanelIdentity === "function" ? await resolvePanelIdentity(user) : { title: "مسؤول" };
    $("accEmail").value = user.email || "";
    $("accRole").value = identity.title || profile.job_title_ar || "—";
    $("accName").value = profile.full_name || "";
    $("accPhone").value = profile.phone || "";
  }

  async function saveProfile() {
    if (!staffId) return;
    showStatus("جاري الحفظ...", "ok");
    try {
      const sb = createSupabaseClient();
      const payload = {
        full_name: String($("accName").value || "").trim() || null,
        phone: String($("accPhone").value || "").trim() || null,
        updated_at: new Date().toISOString()
      };
      const { error } = await sb.from("academy_staff").update(payload).eq("id", staffId);
      if (error) throw error;
      showStatus("تم حفظ بياناتك.", "ok");
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
    try {
      await loadForm();
    } catch (e) {
      console.error(e);
      showStatus("تعذر تحميل الحساب.", "error");
    }
  }

  window.adminAccountBoot = boot;
})();
