(function () {
  if (typeof createSupabaseClient !== "function") return;
  const supabaseClient = createSupabaseClient();

  const els = {
    form: document.getElementById("ticketForm"),
    ticketId: document.getElementById("ticketId"),
    title: document.getElementById("ticketTitle"),
    description: document.getElementById("ticketDescription"),
    category: document.getElementById("ticketCategory"),
    priority: document.getElementById("ticketPriority"),
    reporterName: document.getElementById("ticketReporterName"),
    reporterPhone: document.getElementById("ticketReporterPhone"),
    reporterEmail: document.getElementById("ticketReporterEmail"),
    adminNote: document.getElementById("ticketAdminNote"),
    submitBtn: document.getElementById("ticketSubmitBtn"),
    resetBtn: document.getElementById("resetTicketFormBtn"),
    tbody: document.getElementById("ticketsTableBody"),
    empty: document.getElementById("emptyTicketsState"),
    total: document.getElementById("totalTickets"),
    openCount: document.getElementById("openTicketsCount"),
    progressCount: document.getElementById("progressTicketsCount"),
    filter: document.getElementById("ticketStatusFilter"),
    refreshBtn: document.getElementById("refreshTicketsBtn")
  };

  let rows = [];
  let ticketsCreate = false;
  let ticketsUpdate = false;
  let ticketsDelete = false;

  const CATEGORY_LABELS = {
    technical: "تقني",
    account: "حساب / دخول",
    website: "الموقع",
    access: "صلاحيات",
    general: "عام"
  };

  const PRIORITY_LABELS = {
    low: "منخفضة",
    normal: "عادية",
    high: "عالية",
    urgent: "عاجلة"
  };

  const STATUS_LABELS = {
    open: "مفتوحة",
    in_progress: "قيد المعالجة",
    waiting: "بانتظار رد",
    resolved: "محلولة",
    closed: "مغلقة"
  };

  function ticketNotify(msg) {
    if (typeof flashPanelDenied === "function") flashPanelDenied(msg);
    else alert(msg);
  }

  function applyTicketsUi() {
    ticketsCreate =
      typeof window.canCreateSupportTicketsNow === "function" && window.canCreateSupportTicketsNow();
    ticketsUpdate =
      typeof window.canUpdateSupportTicketsNow === "function" && window.canUpdateSupportTicketsNow();
    ticketsDelete =
      typeof window.canDeleteSupportTicketsNow === "function" && window.canDeleteSupportTicketsNow();

    const canUseForm = ticketsCreate || ticketsUpdate;
    [els.title, els.description, els.category, els.priority, els.reporterName, els.reporterPhone, els.reporterEmail, els.adminNote].forEach(
      (input) => {
        if (!input) return;
        input.disabled = !canUseForm;
      }
    );
    if (els.submitBtn) {
      els.submitBtn.disabled = !canUseForm;
      els.submitBtn.textContent = els.ticketId?.value ? "حفظ التعديلات" : "فتح تذكرة";
    }
    if (els.resetBtn) els.resetBtn.disabled = !canUseForm;

    let note = document.getElementById("supportTicketsRbacNote");
    if (!ticketsCreate && ticketsUpdate) {
      if (!note && els.form) {
        note = document.createElement("p");
        note.id = "supportTicketsRbacNote";
        note.className = "lead";
        note.style.cssText = "color:#ffe79c;font-weight:800;margin:0 0 14px";
        note.textContent = "يمكنك تحديث حالة التذاكر — فتح تذكرة جديدة للمستوى L3 فما فوق.";
        els.form.parentElement?.insertBefore(note, els.form);
      }
    } else if (note) {
      note.remove();
    }
  }

  function esc(v) {
    return String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function fmtDate(v) {
    if (!v) return "—";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("ar-SA", { dateStyle: "short", timeStyle: "short" });
  }

  function makeRef() {
    const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `TKT-${ymd}-${rand}`;
  }

  function resetForm() {
    if (els.ticketId) els.ticketId.value = "";
    els.form?.reset();
    if (els.priority) els.priority.value = "normal";
    if (els.category) els.category.value = "general";
    applyTicketsUi();
  }

  function renderStats() {
    if (els.total) els.total.textContent = rows.length;
    if (els.openCount) els.openCount.textContent = rows.filter((r) => r.status === "open").length;
    if (els.progressCount) {
      els.progressCount.textContent = rows.filter((r) => r.status === "in_progress" || r.status === "waiting").length;
    }
  }

  function statusSelectHtml(t) {
    if (!ticketsUpdate) {
      return `<span class="status-pill status-${esc(t.status)}">${esc(STATUS_LABELS[t.status] || t.status)}</span>`;
    }
    const opts = Object.entries(STATUS_LABELS)
      .map(
        ([value, label]) =>
          `<option value="${value}" ${t.status === value ? "selected" : ""}>${label}</option>`
      )
      .join("");
    return `<select class="mini-select" data-status="${esc(t.id)}">${opts}</select>`;
  }

  function renderTable() {
    if (!els.tbody) return;
    const filter = els.filter?.value || "all";
    const list = filter === "all" ? rows : rows.filter((r) => r.status === filter);
    if (!list.length) {
      els.tbody.innerHTML = "";
      if (els.empty) els.empty.style.display = "block";
      return;
    }
    if (els.empty) els.empty.style.display = "none";
    els.tbody.innerHTML = list
      .map(
        (t) => `<tr>
      <td><code>${esc(t.reference_code)}</code></td>
      <td><b>${esc(t.title)}</b><br><span style="color:#9fb0d1;font-size:12px">${esc((t.description || "").slice(0, 80))}${(t.description || "").length > 80 ? "…" : ""}</span></td>
      <td>${esc(CATEGORY_LABELS[t.category] || t.category)}</td>
      <td><span class="status-pill priority-${esc(t.priority)}">${esc(PRIORITY_LABELS[t.priority] || t.priority)}</span></td>
      <td><span class="status-pill status-${esc(t.status)}">${esc(STATUS_LABELS[t.status] || t.status)}</span></td>
      <td>${esc(fmtDate(t.created_at))}</td>
      <td><div class="table-actions">
        ${statusSelectHtml(t)}
        ${ticketsUpdate ? `<button type="button" class="mini-btn" data-edit="${esc(t.id)}">تعديل</button>` : ""}
        ${ticketsDelete ? `<button type="button" class="mini-btn" data-del="${esc(t.id)}">حذف</button>` : ""}
        ${!ticketsUpdate && !ticketsDelete ? `<span class="subtext">عرض فقط</span>` : ""}
      </div></td>
    </tr>`
      )
      .join("");

    els.tbody.querySelectorAll("[data-status]").forEach((sel) => {
      sel.addEventListener("change", () => updateStatus(sel.getAttribute("data-status"), sel.value));
    });
    els.tbody.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => editRow(btn.getAttribute("data-edit")));
    });
    els.tbody.querySelectorAll("[data-del]").forEach((btn) => {
      btn.addEventListener("click", () => deleteRow(btn.getAttribute("data-del")));
    });
  }

  function editRow(id) {
    if (typeof guardSupportTicketsUpdate === "function" && !guardSupportTicketsUpdate(ticketNotify)) return;
    const t = rows.find((r) => String(r.id) === String(id));
    if (!t) return;
    els.ticketId.value = t.id;
    els.title.value = t.title || "";
    els.description.value = t.description || "";
    els.category.value = t.category || "general";
    els.priority.value = t.priority || "normal";
    els.reporterName.value = t.reporter_name || "";
    els.reporterPhone.value = t.reporter_phone || "";
    els.reporterEmail.value = t.reporter_email || "";
    els.adminNote.value = t.admin_note || "";
    applyTicketsUi();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function loadRows() {
    const { data, error } = await supabaseClient
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      rows = [];
      if (els.tbody) {
        els.tbody.innerHTML = `<tr><td colspan="7" class="empty-state">تعذر التحميل — نفّذ docs/SUPPORT_TICKETS_SCHEMA.sql في Supabase</td></tr>`;
      }
      return;
    }
    rows = Array.isArray(data) ? data : [];
    renderStats();
    renderTable();
  }

  async function getActorMeta() {
    const session = typeof getAdminSession === "function" ? await getAdminSession() : null;
    const user = session?.user;
    return {
      created_by_user_id: user?.id || null,
      created_by_email: user?.email || null
    };
  }

  async function saveRow(e) {
    e.preventDefault();
    const id = els.ticketId.value.trim();
    if (id) {
      if (typeof guardSupportTicketsUpdate === "function" && !guardSupportTicketsUpdate(ticketNotify)) return;
    } else if (typeof guardSupportTicketsCreate === "function" && !guardSupportTicketsCreate(ticketNotify)) {
      return;
    }

    const payload = {
      title: els.title.value.trim(),
      description: els.description.value.trim(),
      category: els.category.value,
      priority: els.priority.value,
      reporter_name: els.reporterName.value.trim() || null,
      reporter_phone: els.reporterPhone.value.trim() || null,
      reporter_email: els.reporterEmail.value.trim() || null,
      admin_note: els.adminNote.value.trim() || null,
      updated_at: new Date().toISOString()
    };

    if (!payload.title || !payload.description) {
      alert("أدخل العنوان والوصف.");
      return;
    }

    let error;
    if (id) {
      ({ error } = await supabaseClient.from("support_tickets").update(payload).eq("id", id));
      if (!error && typeof logPanelAudit === "function") {
        void logPanelAudit({
          domain: "support",
          action: window.PANEL_AUDIT?.SUPPORT_TICKET_UPDATE || "support.ticket_update",
          entityType: "support_ticket",
          entityId: id,
          summary: `تحديث تذكرة: ${payload.title}`,
          meta: { category: payload.category, priority: payload.priority }
        });
      }
    } else {
      const actor = await getActorMeta();
      ({ error } = await supabaseClient.from("support_tickets").insert([
        {
          ...payload,
          reference_code: makeRef(),
          status: "open",
          created_by_user_id: actor.created_by_user_id,
          created_by_email: actor.created_by_email
        }
      ]));
      if (!error && typeof logPanelAudit === "function") {
        void logPanelAudit({
          domain: "support",
          action: window.PANEL_AUDIT?.SUPPORT_TICKET_CREATE || "support.ticket_create",
          entityType: "support_ticket",
          summary: `فتح تذكرة: ${payload.title}`,
          meta: { category: payload.category, priority: payload.priority }
        });
      }
    }

    if (error) {
      console.error(error);
      alert("تعذر الحفظ.");
      return;
    }
    resetForm();
    await loadRows();
    if (typeof window.refreshAdminSidebarBadges === "function") window.refreshAdminSidebarBadges();
  }

  async function updateStatus(id, status) {
    if (typeof guardSupportTicketsUpdate === "function" && !guardSupportTicketsUpdate(ticketNotify)) {
      await loadRows();
      return;
    }
    const t = rows.find((r) => String(r.id) === String(id));
    const { error } = await supabaseClient
      .from("support_tickets")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      alert("تعذر تحديث الحالة.");
      return;
    }
    if (typeof logPanelAudit === "function") {
      void logPanelAudit({
        domain: "support",
        action: window.PANEL_AUDIT?.SUPPORT_TICKET_UPDATE || "support.ticket_update",
        entityType: "support_ticket",
        entityId: id,
        summary: `تغيير حالة تذكرة ${t?.reference_code || id} → ${STATUS_LABELS[status] || status}`,
        meta: { status }
      });
    }
    await loadRows();
    if (typeof window.refreshAdminSidebarBadges === "function") window.refreshAdminSidebarBadges();
  }

  async function deleteRow(id) {
    if (typeof guardSupportTicketsDelete === "function" && !guardSupportTicketsDelete(ticketNotify)) return;
    const t = rows.find((r) => String(r.id) === String(id));
    if (!id || !confirm("حذف هذه التذكرة؟")) return;
    const { error } = await supabaseClient.from("support_tickets").delete().eq("id", id);
    if (error) {
      alert("تعذر الحذف.");
      return;
    }
    if (typeof logPanelAudit === "function") {
      void logPanelAudit({
        domain: "support",
        action: window.PANEL_AUDIT?.SUPPORT_TICKET_DELETE || "support.ticket_delete",
        entityType: "support_ticket",
        entityId: id,
        summary: `حذف تذكرة ${t?.reference_code || id}`
      });
    }
    await loadRows();
    if (typeof window.refreshAdminSidebarBadges === "function") window.refreshAdminSidebarBadges();
  }

  document.addEventListener("DOMContentLoaded", async () => {
    try {
      if (typeof ensureSupportRbacReady === "function") await ensureSupportRbacReady();
    } catch (e) {
      console.warn("[support-tickets-rbac]", e);
    }
    applyTicketsUi();
    els.form?.addEventListener("submit", saveRow);
    els.resetBtn?.addEventListener("click", resetForm);
    els.filter?.addEventListener("change", renderTable);
    els.refreshBtn?.addEventListener("click", loadRows);
    await loadRows();
  });
})();
