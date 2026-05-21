(function () {
  if (typeof createSupabaseClient !== "function") return;
  const supabaseClient = createSupabaseClient();

  const els = {
    tbody: document.getElementById("messagesTableBody"),
    empty: document.getElementById("emptyMessagesState"),
    total: document.getElementById("totalMessages"),
    newCount: document.getElementById("newMessagesCount"),
    filter: document.getElementById("statusFilter"),
    refreshBtn: document.getElementById("refreshMessagesBtn")
  };

  let rows = [];

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

  function statusLabel(s) {
    return { new: "جديدة", read: "مقروءة", replied: "تم الرد", archived: "مؤرشفة" }[String(s || "")] || s;
  }

  function renderStats() {
    if (els.total) els.total.textContent = rows.length;
    if (els.newCount) els.newCount.textContent = rows.filter((r) => r.status === "new").length;
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
        (m) => `<tr>
      <td><code>${esc(m.reference_code)}</code></td>
      <td><b>${esc(m.full_name)}</b><br><span style="color:#9fb0d1;font-size:12px">${esc(m.phone || "—")} · ${esc(m.email || "—")}</span></td>
      <td>${esc(m.subject)}</td>
      <td style="max-width:280px;white-space:pre-wrap">${esc((m.message || "").slice(0, 120))}${(m.message || "").length > 120 ? "…" : ""}</td>
      <td><span class="status-pill status-${esc(m.status)}">${esc(statusLabel(m.status))}</span></td>
      <td>${esc(fmtDate(m.created_at))}</td>
      <td><div class="table-actions">
        <select class="mini-select" data-status="${esc(m.id)}">
          <option value="new" ${m.status === "new" ? "selected" : ""}>جديدة</option>
          <option value="read" ${m.status === "read" ? "selected" : ""}>مقروءة</option>
          <option value="replied" ${m.status === "replied" ? "selected" : ""}>تم الرد</option>
          <option value="archived" ${m.status === "archived" ? "selected" : ""}>مؤرشفة</option>
        </select>
        <button type="button" class="mini-btn" data-del="${esc(m.id)}">حذف</button>
      </div></td>
    </tr>`
      )
      .join("");

    els.tbody.querySelectorAll("[data-status]").forEach((sel) => {
      sel.addEventListener("change", () => updateStatus(sel.getAttribute("data-status"), sel.value));
    });
    els.tbody.querySelectorAll("[data-del]").forEach((btn) => {
      btn.addEventListener("click", () => deleteRow(btn.getAttribute("data-del")));
    });
  }

  async function loadRows() {
    const { data, error } = await supabaseClient
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      rows = [];
      if (els.tbody) els.tbody.innerHTML = `<tr><td colspan="7" class="empty-state">تعذر التحميل — نفّذ CONTACT_MESSAGES_RLS.sql</td></tr>`;
      return;
    }
    rows = Array.isArray(data) ? data : [];
    renderStats();
    renderTable();
  }

  async function updateStatus(id, status) {
    if (!id) return;
    const { error } = await supabaseClient.from("contact_messages").update({ status }).eq("id", id);
    if (error) {
      alert("تعذر تحديث الحالة.");
      return;
    }
    await loadRows();
  }

  async function deleteRow(id) {
    if (!id || !confirm("حذف هذه الرسالة؟")) return;
    const { error } = await supabaseClient.from("contact_messages").delete().eq("id", id);
    if (error) {
      alert("تعذر الحذف.");
      return;
    }
    await loadRows();
  }

  document.addEventListener("DOMContentLoaded", () => {
    els.filter?.addEventListener("change", renderTable);
    els.refreshBtn?.addEventListener("click", loadRows);
    loadRows();
  });
})();
