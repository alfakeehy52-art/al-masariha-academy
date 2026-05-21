/**
 * إدارة صلاحيات دخول لوحة الإدارة — مرحلة R2-lite
 */
(function () {
  function getRoleOptions() {
    return (
      window.PANEL_ROLE_OPTIONS || [
        { value: "staff", label: "موظف" },
        { value: "manager", label: "مدير عمليات" },
        { value: "admin", label: "المدير العام" }
      ]
    );
  }

  let staffRows = [];

  function $(id) {
    return document.getElementById(id);
  }

  function esc(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function getAdminEmailList() {
    const cfg = window.SUPABASE_CONFIG || {};
    return (cfg.adminEmails || []).map((e) => String(e).trim().toLowerCase()).filter(Boolean);
  }

  function hasPanelAccess(email) {
    const list = getAdminEmailList();
    if (!list.length) return false;
    return list.includes(String(email || "").trim().toLowerCase());
  }

  function roleLabel(value) {
    const labels = window.PANEL_ROLE_LABELS || {};
    return labels[String(value || "").toLowerCase()] || value || "—";
  }

  function jobLabel(row) {
    const AR = window.ACADEMY_ROLES;
    if (AR && typeof AR.getRoleLabel === "function") {
      const l = AR.getRoleLabel(row.staff_type);
      if (l && l !== row.staff_type) return l;
    }
    return row.staff_type || "—";
  }

  function showStatus(message, type) {
    const el = $("saveStatus");
    if (!el) return;
    el.textContent = message;
    el.className = "status-bar " + (type === "error" ? "err" : "ok");
    el.style.display = message ? "block" : "none";
  }

  function renderAdminEmails() {
    const list = $("adminEmailsList");
    if (!list) return;
    const emails = getAdminEmailList();
    if (!emails.length) {
      list.innerHTML =
        '<li class="warn">لا توجد عناوين في <code>adminEmails</code> — أضف البريد في <code>supabase-config.js</code> ثم ارفع الموقع.</li>';
      return;
    }
    list.innerHTML = emails.map((e) => `<li><strong>${esc(e)}</strong> — مسموح بدخول لوحة الإدارة</li>`).join("");
  }

  function roleSelectHtml(row) {
    const current = String(row.role || "staff").toLowerCase();
    return (
      '<select class="perm-role-select" data-id="' +
      esc(row.id) +
      '" aria-label="صلاحية النظام">' +
      getRoleOptions().map(
        (o) =>
          '<option value="' +
          esc(o.value) +
          '"' +
          (o.value === current ? " selected" : "") +
          ">" +
          esc(o.label) +
          "</option>"
      ).join("") +
      "</select>"
    );
  }

  function renderTable() {
    const tbody = $("permTableBody");
    const q = String(($("permSearch") && $("permSearch").value) || "")
      .trim()
      .toLowerCase();
    const filter = $("permFilter") ? $("permFilter").value : "all";

    let rows = staffRows.slice();
    if (filter === "panel") rows = rows.filter((r) => hasPanelAccess(r.email));
    if (filter === "no_panel") rows = rows.filter((r) => r.email && !hasPanelAccess(r.email));
    if (q) {
      rows = rows.filter((r) => {
        const hay = [
          r.full_name,
          r.email,
          r.phone,
          r.role,
          jobLabel(r),
          r.staff_category
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }

    if (!tbody) return;
    if (!rows.length) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="empty-cell">لا توجد سجلات. أضف كوادر من «الكوادر (موحّد)» أو طلبات الانضمام.</td></tr>';
      return;
    }

    tbody.innerHTML = rows
      .map((row) => {
        const access = hasPanelAccess(row.email);
        const authOk = !!row.auth_user_id;
        return (
          "<tr>" +
          "<td><strong>" +
          esc(row.full_name) +
          "</strong></td>" +
          "<td>" +
          esc(row.email || "—") +
          "</td>" +
          "<td>" +
          esc(jobLabel(row)) +
          "</td>" +
          "<td>" +
          roleSelectHtml(row) +
          "</td>" +
          '<td><span class="tag ' +
          (access ? "tag-ok" : "tag-muted") +
          '">' +
          (access ? "مسموح" : "غير مضاف") +
          "</span></td>" +
          '<td><span class="tag ' +
          (authOk ? "tag-ok" : "tag-warn") +
          '">' +
          (authOk ? "حساب مفعّل" : "بانتظار التفعيل") +
          "</span></td>" +
          "</tr>"
        );
      })
      .join("");
  }

  async function loadStaff() {
    const sb = createSupabaseClient();
    const { data, error } = await sb
      .from("academy_staff")
      .select("id,full_name,email,phone,staff_type,staff_category,role,status,auth_user_id")
      .not("email", "is", null)
      .order("full_name", { ascending: true });
    if (error) throw error;
    staffRows = data || [];
    const stat = $("permCount");
    if (stat) stat.textContent = String(staffRows.length);
    renderTable();
  }

  async function saveRole(staffId, role) {
    const sb = createSupabaseClient();
    const { error } = await sb
      .from("academy_staff")
      .update({ role: role, updated_at: new Date().toISOString() })
      .eq("id", staffId);
    if (error) throw error;
    const row = staffRows.find((r) => r.id === staffId);
    if (row) row.role = role;
  }

  function bindTableEvents() {
    const tbody = $("permTableBody");
    if (!tbody) return;
    tbody.addEventListener("change", async function (e) {
      const sel = e.target.closest(".perm-role-select");
      if (!sel) return;
      const id = sel.getAttribute("data-id");
      const role = sel.value;
      sel.disabled = true;
      showStatus("جاري الحفظ...", "ok");
      try {
        await saveRole(id, role);
        showStatus("تم حفظ الصلاحية. القائمة الجانبية تتحدث عند إعادة تسجيل الدخول.", "ok");
      } catch (err) {
        console.error(err);
        const msg = String(err.message || "");
        if (/academy_staff_role_check/i.test(msg)) {
          showStatus(
            "قاعدة البيانات لا تقبل هذا الدور بعد. نفّذ ملف docs/STAFF_PANEL_ROLES.sql في Supabase → SQL Editor ثم أعد المحاولة.",
            "error"
          );
        } else {
          showStatus("تعذر الحفظ: " + (msg || "تحقق من RLS والاتصال"), "error");
        }
      } finally {
        sel.disabled = false;
      }
    });
  }

  async function boot() {
    renderAdminEmails();
    bindTableEvents();
    const search = $("permSearch");
    const filter = $("permFilter");
    if (search) search.addEventListener("input", renderTable);
    if (filter) filter.addEventListener("change", renderTable);
    showStatus("جاري التحميل...", "ok");
    try {
      await loadStaff();
      showStatus("", "ok");
    } catch (err) {
      console.error(err);
      showStatus("تعذر تحميل الكوادر: " + (err.message || ""), "error");
    }
  }

  window.adminPermissionsBoot = boot;
})();
