(function () {
  async function submitContactMessage(payload) {
    const body = {
      p_full_name: String(payload.fullName || "").trim(),
      p_phone: String(payload.phone || "").trim(),
      p_email: String(payload.email || "").trim(),
      p_subject: String(payload.subject || "").trim(),
      p_message: String(payload.message || "").trim()
    };
    if (typeof createSupabaseClient !== "function") {
      throw new Error("Load supabase-config.js and js/supabase-client.js first.");
    }
    const client = createSupabaseClient();
    const { data, error } = await client.rpc("submit_contact_message", body);
    if (error) throw error;
    const row = Array.isArray(data) && data.length ? data[0] : data;
    return row || null;
  }

  window.submitContactMessage = submitContactMessage;
})();
