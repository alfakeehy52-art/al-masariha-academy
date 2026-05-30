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
  let storeOrdersUpdate = false;
  let storeOrdersDelete = false;

  function storeNotify(msg) {
    if (typeof flashPanelDenied === "function") flashPanelDenied(msg);
    else alert(msg);
  }

  function applyStoreOrdersUi() {
    storeOrdersUpdate =
      typeof window.canUpdateStoreOrdersNow === "function" && window.canUpdateStoreOrdersNow();
    storeOrdersDelete =
      typeof window.canDeleteStoreOrdersNow === "function" && window.canDeleteStoreOrdersNow();
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

  function statusSelectHtml(o) {
    const opts = [
      ["new", "جديد"],
      ["confirmed", "مؤكد"],
      ["preparing", "قيد التجهيز"],
      ["shipped", "تم الشحن"],
      ["done", "مكتمل"],
      ["cancelled", "ملغى"]
    ];
    if (!storeOrdersUpdate) {
      return "";
    }
    const options = opts
      .map(
        ([value, label]) =>
          `<option value="${value}" ${o.status === value ? "selected" : ""}>${label}</option>`
      )
      .join("");
    return `<select class="mini-select" data-status="${esc(o.id)}">${options}</select>`;
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
        ${statusSelectHtml(o)}
        ${storeOrdersDelete ? `<button type="button" class="mini-btn" data-del="${esc(o.id)}">حذف</button>` : ""}
        ${!storeOrdersUpdate && !storeOrdersDelete ? `<span class="subtext">عرض فقط</span>` : ""}
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
      if (els.tbody) els.tbody.innerHTML = `<tr><td colspan="6" class="empty-state">تعذر التحميل</td></tr>`;
      return;
    }
    rows = Array.isArray(data) ? data : [];
    renderStats();
    renderTable();
  }

  async function updateStatus(id, status) {
    if (typeof guardStoreOrdersUpdate === "function" && !guardStoreOrdersUpdate(storeNotify)) {
      await loadRows();
      return;
    }
    const { error } = await supabaseClient.from("store_orders").update({ status }).eq("id", id);
    if (error) {
      alert("تعذر تحديث الحالة.");
      return;
    }
    await loadRows();
  }

  async function deleteRow(id) {
    if (typeof guardStoreOrdersDelete === "function" && !guardStoreOrdersDelete(storeNotify)) return;
    if (!id || !confirm("حذف هذا الطلب؟")) return;
    const { error } = await supabaseClient.from("store_orders").delete().eq("id", id);
    if (error) {
      alert("تعذر الحذف.");
      return;
    }
    if (typeof logPanelAudit === "function") {
      void logPanelAudit({
        domain: "store",
        action: window.PANEL_AUDIT?.STORE_ORDER_DELETE || "store.order_delete",
        entityType: "store_order",
        entityId: id,
        summary: "حذف طلب متجر"
      });
    }
    await loadRows();
  }

  document.addEventListener("DOMContentLoaded", async () => {
    try {
      if (typeof ensureStoreRbacReady === "function") await ensureStoreRbacReady();
    } catch (e) {
      console.warn("[store-orders-rbac]", e);
    }
    applyStoreOrdersUi();
    els.filter?.addEventListener("change", renderTable);
    els.refreshBtn?.addEventListener("click", loadRows);
    await loadRows();
  });
})();
