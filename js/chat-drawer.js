/**
 * درج تواصل تشغيلي — إدارة ↔ طلب انضمام / ولي أمر (ref+phone)
 * Realtime فقط أثناء فتح الدرج.
 */
(function () {
  const POLL_MS = 12000;
  let root = null;
  let backdrop = null;
  let messagesEl = null;
  let inputEl = null;
  let sendBtn = null;
  let statusEl = null;
  let titleEl = null;
  let subtitleEl = null;

  const state = {
    open: false,
    mode: "admin",
    room: null,
    guestCtx: null,
    channel: null,
    pollTimer: null,
    sending: false
  };

  function client() {
    if (typeof createSupabaseClient !== "function") {
      throw new Error("Supabase client غير متوفر");
    }
    return createSupabaseClient();
  }

  function esc(v) {
    return String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatTime(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("ar-SA", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function friendlyError(err) {
    const msg = String(err?.message || err || "");
    if (msg.includes("no chat room")) {
      return "تعذر فتح المحادثة. تأكد من رقم المرجع والجوال، أو حدّث الصفحة بعد دقائق.";
    }
    if (msg.includes("request not found")) {
      return "لم يُعثر على الطلب. تحقق من رقم المرجع ورقم الجوال المسجّلين في الطلب.";
    }
    if (msg.includes("admin only")) return "يلزم تسجيل دخول إداري.";
    if (msg.includes("access denied")) return "لا صلاحية للوصول لهذه المحادثة.";
    if (msg.includes("room is not open")) return "الغرفة مغلقة.";
    return msg || "تعذر تنفيذ العملية.";
  }

  function ensureDom() {
    if (root) return;
    const style = document.createElement("style");
    style.id = "chat-drawer-styles";
    style.textContent = `
      .chat-drawer-backdrop{position:fixed;inset:0;background:rgba(3,8,18,.55);backdrop-filter:blur(4px);z-index:15000;opacity:0;pointer-events:none;transition:opacity .22s ease}
      .chat-drawer-backdrop.show{opacity:1;pointer-events:auto}
      .chat-drawer{position:fixed;top:0;bottom:0;inset-inline-start:0;width:min(440px,100vw);background:linear-gradient(180deg,#0f1a2e,#0a1220);border-inline-end:1px solid rgba(255,255,255,.10);box-shadow:12px 0 48px rgba(0,0,0,.45);z-index:15001;display:flex;flex-direction:column;transform:translateX(-102%);transition:transform .28s ease;font-family:'Cairo',system-ui,sans-serif;color:#ecf2ff}
      [dir="rtl"] .chat-drawer{transform:translateX(102%)}
      .chat-drawer.show{transform:translateX(0)}
      .chat-drawer-head{padding:18px 18px 14px;border-bottom:1px solid rgba(255,255,255,.08);display:flex;gap:12px;align-items:flex-start}
      .chat-drawer-head h3{margin:0;font-size:20px;font-weight:900;color:#f5d46b}
      .chat-drawer-head p{margin:6px 0 0;font-size:13px;color:#9fb0d1;line-height:1.7}
      .chat-drawer-close{margin-inline-start:auto;width:42px;height:42px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:#fff;font-size:22px;cursor:pointer;font-weight:900}
      .chat-drawer-status{padding:8px 18px;font-size:12px;color:#9fb0d1;border-bottom:1px solid rgba(255,255,255,.06)}
      .chat-drawer-messages{flex:1;overflow:auto;padding:16px 18px;display:flex;flex-direction:column;gap:10px}
      .chat-msg{max-width:88%;padding:12px 14px;border-radius:16px;line-height:1.75;font-size:14px;font-weight:700;word-break:break-word}
      .chat-msg.admin{align-self:flex-end;background:rgba(212,175,55,.18);border:1px solid rgba(212,175,55,.28);color:#fff6d0}
      .chat-msg.guest{align-self:flex-start;background:rgba(55,125,255,.14);border:1px solid rgba(55,125,255,.24);color:#dfeaff}
      .chat-msg.system{align-self:center;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);color:#9fb0d1;font-size:12px;max-width:95%;text-align:center}
      .chat-msg time{display:block;margin-top:6px;font-size:11px;font-weight:600;opacity:.75}
      .chat-drawer-compose{padding:14px 18px 18px;border-top:1px solid rgba(255,255,255,.08);display:flex;flex-direction:column;gap:10px}
      .chat-drawer-compose textarea{min-height:72px;resize:vertical;background:rgba(7,12,22,.85);color:#ecf2ff;border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:12px 14px;font-family:inherit;font-size:14px;font-weight:700;outline:none}
      .chat-drawer-compose textarea:focus{border-color:rgba(212,175,55,.4)}
      .chat-drawer-send{align-self:flex-end;min-height:46px;padding:0 22px;border-radius:14px;border:none;background:linear-gradient(135deg,#d4af37,#f5d46b);color:#1a1a1a;font-weight:900;font-family:inherit;cursor:pointer;font-size:14px}
      .chat-drawer-send:disabled{opacity:.55;cursor:not-allowed}
      .chat-drawer-empty{text-align:center;color:#9fb0d1;padding:24px 8px;font-size:14px;line-height:1.8}
      @media(max-width:520px){.chat-drawer{width:100vw}}
    `;
    document.head.appendChild(style);

    backdrop = document.createElement("div");
    backdrop.className = "chat-drawer-backdrop";
    backdrop.addEventListener("click", close);

    root = document.createElement("aside");
    root.className = "chat-drawer";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-label", "محادثة الطلب");
    root.innerHTML = `
      <div class="chat-drawer-head">
        <div>
          <h3 id="chatDrawerTitle">تواصل</h3>
          <p id="chatDrawerSubtitle">—</p>
        </div>
        <button type="button" class="chat-drawer-close" id="chatDrawerClose" aria-label="إغلاق">×</button>
      </div>
      <div class="chat-drawer-status" id="chatDrawerStatus">جاري التحميل...</div>
      <div class="chat-drawer-messages" id="chatDrawerMessages"></div>
      <div class="chat-drawer-compose">
        <textarea id="chatDrawerInput" placeholder="اكتب رسالتك..." maxlength="2000"></textarea>
        <button type="button" class="chat-drawer-send" id="chatDrawerSend">إرسال</button>
      </div>
    `;

    document.body.appendChild(backdrop);
    document.body.appendChild(root);

    titleEl = document.getElementById("chatDrawerTitle");
    subtitleEl = document.getElementById("chatDrawerSubtitle");
    statusEl = document.getElementById("chatDrawerStatus");
    messagesEl = document.getElementById("chatDrawerMessages");
    inputEl = document.getElementById("chatDrawerInput");
    sendBtn = document.getElementById("chatDrawerSend");

    document.getElementById("chatDrawerClose").addEventListener("click", close);
    sendBtn.addEventListener("click", sendCurrent);
    inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendCurrent();
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && state.open) close();
    });
  }

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text;
  }

  function renderMessages(list) {
    if (!messagesEl) return;
    if (!list || !list.length) {
      messagesEl.innerHTML =
        '<div class="chat-drawer-empty">لا رسائل بعد. ابدأ المحادثة برسالة قصيرة وواضحة.</div>';
      return;
    }
    messagesEl.innerHTML = list
      .map((m) => {
        const type = m.sender_type === "admin" ? "admin" : m.sender_type === "guest" ? "guest" : "system";
        const label =
          type === "admin"
            ? "الإدارة"
            : type === "guest"
              ? "مقدّم الطلب"
              : esc(m.sender_ref || "—");
        return `<div class="chat-msg ${type}"><div>${esc(m.body || "")}</div><time>${esc(label)} · ${esc(formatTime(m.created_at))}</time></div>`;
      })
      .join("");
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function teardownRealtime() {
    if (state.channel) {
      try {
        client().removeChannel(state.channel);
      } catch (e) {}
      state.channel = null;
    }
    if (state.pollTimer) {
      clearInterval(state.pollTimer);
      state.pollTimer = null;
    }
  }

  function setupRealtime(roomId) {
    teardownRealtime();
    const ch = client()
      .channel("chat-room-" + roomId)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: "room_id=eq." + roomId
        },
        () => refreshMessages()
      )
      .subscribe();
    state.channel = ch;
    state.pollTimer = setInterval(refreshMessages, POLL_MS);
  }

  async function ensureAdminRoom(joinRequestId) {
    const { data, error } = await client().rpc("chat_admin_ensure_join_room", {
      p_join_request_id: joinRequestId
    });
    if (error) throw error;
    return data;
  }

  async function ensureGuestRoom(ref, phone) {
    const { data, error } = await client().rpc("chat_guest_open_join_room", {
      p_ref: ref,
      p_phone: phone
    });
    if (error) throw error;
    return data;
  }

  async function fetchMessages() {
    if (!state.room?.id) return [];
    if (state.mode === "guest") {
      const { data, error } = await client().rpc("chat_list_messages", {
        p_room_id: state.room.id,
        p_ref: state.guestCtx.ref,
        p_phone: state.guestCtx.phone,
        p_limit: 100
      });
      if (error) throw error;
      return data || [];
    }
    const { data, error } = await client()
      .from("chat_messages")
      .select("id,sender_type,sender_ref,body,created_at")
      .eq("room_id", state.room.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .limit(100);
    if (error) throw error;
    return data || [];
  }

  async function refreshMessages() {
    try {
      const list = await fetchMessages();
      renderMessages(list);
    } catch (e) {
      console.warn("[chat-drawer] refresh", e);
    }
  }

  async function sendCurrent() {
    if (state.sending || !state.room?.id) return;
    const body = (inputEl?.value || "").trim();
    if (!body) return;
    state.sending = true;
    sendBtn.disabled = true;
    try {
      if (state.mode === "guest") {
        const { error } = await client().rpc("chat_send_message", {
          p_room_id: state.room.id,
          p_body: body,
          p_sender_label: null,
          p_ref: state.guestCtx.ref,
          p_phone: state.guestCtx.phone
        });
        if (error) throw error;
      } else {
        const {
          data: { user }
        } = await client().auth.getUser();
        const { error } = await client().from("chat_messages").insert({
          room_id: state.room.id,
          sender_type: "admin",
          sender_ref: user?.id || "admin",
          body
        });
        if (error) throw error;
      }
      inputEl.value = "";
      await refreshMessages();
    } catch (e) {
      setStatus(friendlyError(e));
    } finally {
      state.sending = false;
      sendBtn.disabled = false;
    }
  }

  async function openInternal(opts) {
    ensureDom();
    state.mode = opts.mode;
    state.guestCtx = opts.guestCtx || null;
    state.room = null;

    titleEl.textContent = opts.title || "تواصل";
    subtitleEl.textContent = opts.subtitle || "";
    setStatus("جاري فتح المحادثة...");
    messagesEl.innerHTML = '<div class="chat-drawer-empty">...</div>';
    inputEl.value = "";
    inputEl.disabled = true;
    sendBtn.disabled = true;

    backdrop.classList.add("show");
    root.classList.add("show");
    state.open = true;
    document.body.style.overflow = "hidden";

    try {
      if (state.mode === "admin") {
        state.room = await ensureAdminRoom(opts.joinRequestId);
      } else {
        state.room = await ensureGuestRoom(opts.guestCtx.ref, opts.guestCtx.phone);
      }
      const closed = state.room.status && state.room.status !== "open";
      setStatus(
        closed
          ? "الغرفة مغلقة — العرض فقط"
          : state.mode === "admin"
            ? "محادثة رسمية مع مقدّم الطلب"
            : "تواصل رسمي مع إدارة الأكاديمية"
      );
      inputEl.disabled = !!closed;
      sendBtn.disabled = !!closed;
      await refreshMessages();
      if (!closed) setupRealtime(state.room.id);
    } catch (e) {
      setStatus(friendlyError(e));
      messagesEl.innerHTML = `<div class="chat-drawer-empty">${esc(friendlyError(e))}</div>`;
    }
  }

  function close() {
    if (!state.open) return;
    teardownRealtime();
    state.open = false;
    state.room = null;
    backdrop?.classList.remove("show");
    root?.classList.remove("show");
    document.body.style.overflow = "";
  }

  window.ChatDrawer = {
    openForJoinRequest({ joinRequestId, referenceCode, phone, fullName }) {
      const ref = referenceCode || "";
      return openInternal({
        mode: "admin",
        joinRequestId,
        title: "تواصل — " + (fullName || "طلب"),
        subtitle: ref ? "طلب " + ref + (phone ? " · " + phone : "") : ""
      });
    },
    openAsGuest({ referenceCode, phone, fullName }) {
      return openInternal({
        mode: "guest",
        guestCtx: { ref: referenceCode, phone },
        title: "تواصل مع الإدارة",
        subtitle: (fullName || "") + (referenceCode ? " · " + referenceCode : "")
      });
    },
    close,
    isOpen() {
      return state.open;
    }
  };
})();
