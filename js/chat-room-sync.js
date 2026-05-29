/**
 * إغلاق محادثات الطلبات عند انتهاء الطلب (قبول / رفض).
 */
(function (global) {
  async function closeChatRoomsForJoinRequest(client, requestId, finalStatus) {
    if (!client || !requestId) return false;
    const roomStatus = finalStatus === "rejected" ? "archived" : "closed";
    try {
      const { error } = await client
        .from("chat_rooms")
        .update({ status: roomStatus, updated_at: new Date().toISOString() })
        .eq("related_entity_table", "join_requests")
        .eq("related_entity_id", requestId)
        .eq("status", "open");
      if (error) console.warn("chat room close", error);
      return !error;
    } catch (e) {
      console.warn("chat room close", e);
      return false;
    }
  }

  async function syncOpenChatRoomsForFinishedRequests(client) {
    if (!client) return { closed: 0 };
    const { data: rooms, error } = await client
      .from("chat_rooms")
      .select("related_entity_id")
      .eq("related_entity_table", "join_requests")
      .eq("status", "open");
    if (error || !rooms?.length) return { closed: 0 };

    const ids = [...new Set(rooms.map((r) => r.related_entity_id).filter(Boolean))];
    if (!ids.length) return { closed: 0 };

    const { data: finished, error: reqErr } = await client
      .from("join_requests")
      .select("id, status")
      .in("id", ids)
      .in("status", ["approved", "rejected"]);
    if (reqErr) {
      console.warn("chat room sync", reqErr);
      return { closed: 0 };
    }

    let closed = 0;
    for (const row of finished || []) {
      const ok = await closeChatRoomsForJoinRequest(client, row.id, row.status);
      if (ok) closed += 1;
    }
    return { closed };
  }

  global.ChatRoomSync = {
    closeChatRoomsForJoinRequest,
    syncOpenChatRoomsForFinishedRequests
  };
})(typeof window !== "undefined" ? window : globalThis);
