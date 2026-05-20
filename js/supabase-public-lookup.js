(function () {
  async function rpc(name, params) {
    if (typeof createSupabaseClient !== "function") {
      throw new Error("Load supabase-config.js and js/supabase-client.js first.");
    }
    const client = createSupabaseClient();
    const { data, error } = await client.rpc(name, params || {});
    if (error) throw error;
    return data;
  }

  function isMissingRpc(error) {
    const code = error && (error.code || error.details);
    return /PGRST202|42883/i.test(String(code || "")) || /Could not find the function/i.test(String(error?.message || ""));
  }

  async function lookupJoinRequestByRefPhone(ref, phone) {
    const pRef = String(ref || "").trim();
    const pPhone = String(phone || "").trim();
    try {
      const rows = await rpc("lookup_join_request_by_ref_phone", { p_ref: pRef, p_phone: pPhone });
      return Array.isArray(rows) && rows.length ? rows[0] : null;
    } catch (error) {
      if (!isMissingRpc(error)) throw error;
    }
    const client = createSupabaseClient();
    const { data, error } = await client
      .from("join_requests")
      .select("*")
      .eq("reference_code", pRef)
      .eq("phone", pPhone)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async function lookupJoinRequestsByContact(phone, email) {
    const pPhone = String(phone || "").trim();
    const pEmail = String(email || "").trim().toLowerCase();
    try {
      const rows = await rpc("lookup_join_requests_by_contact", { p_phone: pPhone, p_email: pEmail });
      return Array.isArray(rows) ? rows : [];
    } catch (error) {
      if (!isMissingRpc(error)) throw error;
    }
    const client = createSupabaseClient();
    const { data, error: qErr } = await client
      .from("join_requests")
      .select("*")
      .eq("phone", pPhone)
      .eq("email", pEmail)
      .order("created_at", { ascending: false })
      .limit(20);
    if (qErr) throw qErr;
    return Array.isArray(data) ? data : [];
  }

  async function markJoinRequestReviewing(requestId, ref, phone) {
    const pRef = String(ref || "").trim();
    const pPhone = String(phone || "").trim();
    try {
      return await rpc("submit_join_request_review", {
        p_request_id: requestId,
        p_ref: pRef,
        p_phone: pPhone
      });
    } catch (error) {
      if (!isMissingRpc(error)) throw error;
    }
    const client = createSupabaseClient();
    const { error: updErr } = await client
      .from("join_requests")
      .update({ status: "reviewing", updated_at: new Date().toISOString() })
      .eq("id", requestId);
    if (updErr) throw updErr;
    return true;
  }

  async function searchPlayersPublic(term) {
    const safe = String(term || "").trim().replace(/[%,]/g, "");
    if (!safe) return [];
    try {
      const rows = await rpc("search_players_public", { p_term: safe });
      return Array.isArray(rows) ? rows : [];
    } catch (error) {
      if (!isMissingRpc(error)) throw error;
    }
    const client = createSupabaseClient();
    const { data, error: qErr } = await client
      .from("players")
      .select("id,full_name,code,phone,category,position,team")
      .or(`full_name.ilike.%${safe}%,code.ilike.%${safe}%,phone.ilike.%${safe}%`)
      .limit(8);
    if (qErr) throw qErr;
    return Array.isArray(data) ? data : [];
  }

  window.lookupJoinRequestByRefPhone = lookupJoinRequestByRefPhone;
  window.lookupJoinRequestsByContact = lookupJoinRequestsByContact;
  window.markJoinRequestReviewing = markJoinRequestReviewing;
  window.searchPlayersPublic = searchPlayersPublic;
})();
