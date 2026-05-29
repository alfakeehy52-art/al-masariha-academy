/**
 * إدارة الموظفين والصلاحيات — RBAC v1
 */
(function () {
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

  function rbac() {
    return window.PanelRBAC || {};
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
        '<li class="warn">لا توجد عناوين مسموحة — أضف البريد في supabase-config.js ثم ارفع الموقع.</li>';
      return;
    }
    list.innerHTML = emails.map((e) => `<li><strong>${esc(e)}</strong> — مسموح بدخول لوحة الإدارة</li>`).join("");
  }

  function domainCheckboxes(row) {
    const domains = rbac().normalizeDomains?.(row.panel_domains) || ["requests"];
    const all = rbac().DOMAINS || {};
    return Object.values(all)
      .map(
        (d) =>
          `<label class="domain-chip"><input type="checkbox" class="perm-domain-cb" data-id="${esc(row.id)}" value="${esc(d.id)}"${
            domains.includes("*") || domains.includes(d.id) ? " checked" : ""
          } /> ${esc(d.label)}</label>`
      )
      .join("");
  }

  function templateSelectHtml(row) {
    const templates = rbac().ROLE_TEMPLATES || [];
    const cur = String(row.panel_template || "");
    return (
      '<select class="perm-template-select" data-id="' +
      esc(row.id) +
      '">' +
      '<option value="">— اختر قالبًا —</option>' +
      templates
        .map(
          (t) =>
            `<option value="${esc(t.id)}"${t.id === cur ? " selected" : ""}>${esc(t.label)}</option>`
        )
        .join("") +
      "</select>"
    );
  }

  function levelSelectHtml(row) {
    const levels = rbac().LEVELS || {};
    const cur = String(row.panel_level || "L4").toUpperCase();
    return (
      '<select class="perm-level-select" data-id="' +
      esc(row.id) +
      '">' +
      Object.values(levels)
        .map((l) => `<option value="${esc(l.id)}"${l.id === cur ? " selected" : ""}>${esc(l.label)}</option>`)
        .join("") +
      "</select>"
    );
  }

  function statusSelectHtml(row) {
    const st = String(row.status || "active").toLowerCase();
    return (
      '<select class="perm-status-select" data-id="' +
      esc(row.id) +
      '">' +
      `<option value="active"${st === "active" ? " selected" : ""}>نشط</option>` +
      `<option value="suspended"${st === "suspended" ? " selected" : ""}>موقوف</option>` +
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
    if (filter === "suspended") rows = rows.filter((r) => String(r.status || "").toLowerCase() === "suspended");
    if (q) {
      rows = rows.filter((r) => {
        const hay = [r.full_name, r.email, r.phone, r.job_title_ar, r.panel_template, r.role]
          .concat(rbac().normalizeDomains?.(r.panel_domains) || [])
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }

    if (!tbody) return;
    if (!rows.length) {
      tbody.innerHTML =
        '<tr><td colspan="8" class="empty-cell">لا توجد سجلات. أضف كوادر من «الكوادر (موحّد)» أو طلبات الانضمام.</td></tr>';
      return;
    }

    tbody.innerHTML = rows
      .map((row) => {
        const access = hasPanelAccess(row.email);
        const authOk = !!row.auth_user_id;
        const title = row.job_title_ar || row.job_title || "—";
        return (
          "<tr>" +
          "<td><strong>" +
          esc(row.full_name) +
          "</strong><div class=\"subtext\">" +
          esc(title) +
          "</div></td>" +
          "<td>" +
          esc(row.email || "—") +
          "</td>" +
          "<td>" +
          templateSelectHtml(row) +
          "</td>" +
          "<td>" +
          levelSelectHtml(row) +
          "</td>" +
          '<td><div class="domain-wrap">' +
          domainCheckboxes(row) +
          "</div></td>" +
          "<td>" +
          statusSelectHtml(row) +
          "</td>" +
          '<td><span class="tag ' +
          (access ? "tag-ok" : "tag-muted") +
          '">' +
          (access ? "مسموح" : "غير مضاف") +
          "</span></td>" +
          '<td><span class="tag ' +
          (authOk ? "tag-ok" : "tag-warn") +
          '">' +
          (authOk ? "مفعّل" : "بانتظار") +
          "</span></td>" +
          "</tr>"
        );
      })
      .join("");
  }

  async function loadStaff() {
    const sb = createSupabaseClient();
    const fields = rbac().staffSelectFields?.() || "id,full_name,email,phone,role,status,auth_user_id";
    let { data, error } = await sb
      .from("academy_staff")
      .select(fields)
      .not("email", "is", null)
      .order("full_name", { ascending: true });
    if (error && /column|panel_|job_title/i.test(String(error.message || ""))) {
      const retry = await sb
        .from("academy_staff")
        .select("id,full_name,email,phone,role,status,auth_user_id")
        .not("email", "is", null)
        .order("full_name", { ascending: true });
      data = retry.data;
      error = retry.error;
    }
    if (error) throw error;
    staffRows = data || [];
    const stat = $("permCount");
    if (stat) stat.textContent = String(staffRows.length);
    renderTable();
  }

  async function saveStaffRow(staffId, patch) {
    const sb = createSupabaseClient();
    const payload = { ...patch, updated_at: new Date().toISOString() };
    const { error } = await sb.from("academy_staff").update(payload).eq("id", staffId);
    if (error) throw error;
    const row = staffRows.find((r) => String(r.id) === String(staffId));
    if (row) Object.assign(row, patch);
  }

  function domainsFromRowCheckboxes(staffId) {
    const boxes = document.querySelectorAll(`.perm-domain-cb[data-id="${staffId}"]`);
    const selected = [];
    boxes.forEach((cb) => {
      if (cb.checked) selected.push(cb.value);
    });
    return selected.length ? selected : ["requests"];
  }

  function applyTemplateToRow(staffId, templateId) {
    const tpl = rbac().templateById?.(templateId);
    if (!tpl) return null;
    return {
      panel_template: tpl.id,
      panel_level: tpl.level,
      panel_domains: tpl.domains,
      job_title_ar: tpl.jobTitle,
      role: tpl.legacyRole || "staff"
    };
  }

  function bindTableEvents() {
    const tbody = $("permTableBody");
    if (!tbody) return;

    tbody.addEventListener("change", async function (e) {
      const tpl = e.target.closest(".perm-template-select");
      const lvl = e.target.closest(".perm-level-select");
      const st = e.target.closest(".perm-status-select");
      const dom = e.target.closest(".perm-domain-cb");
      if (!tpl && !lvl && !st && !dom) return;

      const el = tpl || lvl || st || dom;
      const id = el.getAttribute("data-id");
      if (!id) return;

      el.disabled = true;
      showStatus("جاري الحفظ...", "ok");
      try {
        if (tpl) {
          const patch = applyTemplateToRow(id, tpl.value);
          if (patch) {
            await saveStaffRow(id, patch);
            renderTable();
            showStatus("تم تطبيق القالب وحفظ الصلاحيات.", "ok");
            return;
          }
        }
        if (lvl) {
          await saveStaffRow(id, { panel_level: lvl.value });
        }
        if (st) {
          await saveStaffRow(id, { status: st.value });
        }
        if (dom) {
          await saveStaffRow(id, { panel_domains: domainsFromRowCheckboxes(id) });
        }
        showStatus("تم الحفظ. اطلب من الموظف إعادة تسجيل الدخول لتحديث القائمة.", "ok");
      } catch (err) {
        console.error(err);
        const msg = String(err.message || "");
        if (/panel_level|panel_domains|column/i.test(msg)) {
          showStatus("نفّذ سكربت RBAC_PANEL_GRANTS.sql في Supabase ثم أعد المحاولة.", "error");
        } else {
          showStatus("تعذر الحفظ: " + (msg || "تحقق من RLS"), "error");
        }
      } finally {
        el.disabled = false;
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
