(function () {
  async function submitStoreOrder(payload) {
    if (typeof createSupabaseClient !== "function") {
      throw new Error("Load supabase-config.js and js/supabase-client.js first.");
    }
    const client = createSupabaseClient();
    const body = {
      p_product_id: payload.productId,
      p_customer_name: String(payload.customerName || "").trim(),
      p_phone: String(payload.phone || "").trim(),
      p_email: String(payload.email || "").trim(),
      p_quantity: Math.max(1, Number(payload.quantity) || 1),
      p_notes: String(payload.notes || "").trim()
    };
    const { data, error } = await client.rpc("submit_store_order", body);
    if (error) throw error;
    const row = Array.isArray(data) && data.length ? data[0] : data;
    return row || null;
  }

  async function lookupStoreOrderPublic(ref, phone) {
    const pRef = String(ref || "").trim();
    const pPhone = String(phone || "").trim();
    if (typeof createSupabaseClient !== "function") return null;
    const client = createSupabaseClient();
    try {
      const { data, error } = await client.rpc("lookup_store_order_public", {
        p_ref: pRef,
        p_phone: pPhone
      });
      if (error) throw error;
      return Array.isArray(data) && data.length ? data[0] : null;
    } catch (error) {
      const code = error && (error.code || error.details);
      if (!/PGRST202|42883/i.test(String(code || "")) && !/Could not find the function/i.test(String(error?.message || ""))) {
        throw error;
      }
    }
    return null;
  }

  function orderStatusLabel(status) {
    const map = {
      new: "جديد",
      confirmed: "مؤكد",
      preparing: "قيد التجهيز",
      shipped: "تم الشحن",
      cancelled: "ملغى",
      done: "مكتمل"
    };
    return map[String(status || "")] || status || "—";
  }

  window.submitStoreOrder = submitStoreOrder;
  window.lookupStoreOrderPublic = lookupStoreOrderPublic;
  window.orderStatusLabel = orderStatusLabel;
})();
