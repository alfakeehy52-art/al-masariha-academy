(function () {
  if (typeof createSupabaseClient !== "function") return;
  const supabaseClient = createSupabaseClient();

  const els = {
    tbody: document.getElementById("ordersTableBody"),
    empty: document.getElementById("emptyOrdersState"),
    total: document.getElementById("totalOrders"),
    newCount: document.getElementById("newOrdersCount"),
    filter: document.getElementById("orderStatusFilter"),
    refreshBtn: document.getElementById("refreshOrdersBtn")
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
    return (
      typeof orderStatusLabel === "function"
        ? orderStatusLabel(s)
        : { new: "جديد", confirmed: "مؤكد", preparing: "قيد التجهيز", shipped: "تم الشحن", cancelled: "ملغى", done: "مكتمل" }[s]
    );
  }

  function lineTotal(o) {
    return (Number(o.product_price || 0) * Number(o.quantity || 1)).toFixed(2);
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
        (o) => `<tr>
      <td><code>${esc(o.reference_code)}</code></td>
      <td><b>${esc(o.product_name)}</b><br><span style="color:#9fb0d1;font-size:12px">${esc(o.product_price)} ر.س × ${esc(o.quantity)} = ${esc(lineTotal(o))} ر.س</span></td>
      <td>${esc(o.customer_name)}<br><span style="color:#9fb0d1;font-size:12px">${esc(o.phone)}</span></td>
      <td><span class="status-pill status-${esc(o.status)}">${esc(statusLabel(o.status))}</span></td>
      <td>${esc(fmtDate(o.created_at))}</td>
      <td><div class="table-actions">
        <select class="mini-select" data-status="${esc(o.id)}">
          <option value="new" ${o.status === "new" ? "selected" : ""}>جديد</option>
          <option value="confirmed" ${o.status === "confirmed" ? "selected" : ""}>مؤكد</option>
          <option value="preparing" ${o.status === "preparing" ? "selected" : ""}>قيد التجهيز</option>
          <option value="shipped" ${o.status === "shipped" ? "selected" : ""}>تم الشحن</option>
          <option value="done" ${o.status === "done" ? "selected" : ""}>مكتمل</option>
          <option value="cancelled" ${o.status === "cancelled" ? "selected" : ""}>ملغى</option>
        </select>
        <button type="button" class="mini-btn" data-del="${esc(o.id)}">حذف</button>
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
      .from("store_orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      rows = [];
      if (els.tbody) els.tbody.innerHTML = `<tr><td colspan="6" class="empty-state">تعذر التحميل — نفّذ STORE_ORDERS_RLS.sql</td></tr>`;
      return;
    }
    rows = Array.isArray(data) ? data : [];
    renderStats();
    renderTable();
  }

  async function updateStatus(id, status) {
    const { error } = await supabaseClient.from("store_orders").update({ status }).eq("id", id);
    if (error) {
      alert("تعذر تحديث الحالة.");
      return;
    }
    await loadRows();
  }

  async function deleteRow(id) {
    if (!id || !confirm("حذف هذا الطلب؟")) return;
    const { error } = await supabaseClient.from("store_orders").delete().eq("id", id);
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
