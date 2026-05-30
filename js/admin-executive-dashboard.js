/**
 * لوحة ملخص المدير العام — KPIs وإجراءات اليوم
 */
(function () {
  function $(id) {
    return document.getElementById(id);
  }

  function setText(id, value) {
    const el = $(id);
    if (el) el.textContent = value;
  }

  function esc(v) {
    return String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function fmtDate(v) {
    if (!v) return "—";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("ar-SA", { dateStyle: "short", timeStyle: "short" });
  }

  async function isExecutiveUser() {
    try {
      const session = typeof getAdminSession === "function" ? await getAdminSession() : null;
      const user = session?.user;
      if (!user) return false;
      if (typeof isAdminUser === "function" && isAdminUser(user)) return true;
      const ctx =
        typeof resolvePanelAccessContext === "function"
          ? await resolvePanelAccessContext(user)
          : null;
      return ctx && (ctx.isFullAdmin || ctx.level === "L1");
    } catch (_e) {
      return false;
    }
  }

  async function countTable(sb, table, filters) {
    let q = sb.from(table).select("id", { count: "exact", head: true });
    Object.entries(filters || {}).forEach(([k, v]) => {
      if (v && typeof v === "object" && Array.isArray(v.in)) q = q.in(k, v.in);
      else if (v !== undefined && v !== null && v !== "") q = q.eq(k, v);
    });
    const { count, error } = await q;
    if (error) throw error;
    return count || 0;
  }

  function renderAlerts(alerts) {
    const box = $("execAlerts");
    if (!box) return;
    if (!alerts.length) {
      box.innerHTML = '<p class="exec-empty">لا توجد تنبيهات عاجلة — الوضع مستقر.</p>';
      return;
    }
    box.innerHTML = alerts
      .map(
        (a) =>
          `<a class="exec-alert exec-alert-${esc(a.level)}" href="${esc(a.href)}"><strong>${esc(a.title)}</strong><span>${esc(
            a.detail
          )}</span></a>`
      )
      .join("");
  }

  function renderAuditFeed(rows) {
    const wrap = $("execAuditWrap");
    const list = $("execAuditList");
    if (!wrap || !list) return;
    if (!rows.length) {
      wrap.hidden = true;
      return;
    }
    wrap.hidden = false;
    list.innerHTML = rows
      .map(
        (r) =>
          `<li>${esc(r.summary_ar || r.action || "حدث")}<time>${esc(fmtDate(r.created_at))}${
            r.actor_email ? " · " + esc(r.actor_email) : ""
          }</time></li>`
      )
      .join("");
  }

  async function safeCount(sb, table, filters) {
    try {
      return await countTable(sb, table, filters);
    } catch (e) {
      console.warn("[executive-dashboard] count failed:", table, e?.message || e);
      return 0;
    }
  }

  async function countStoreOrders(sb) {
    const n = await safeCount(sb, "store_orders", { status: "new" });
    if (n > 0) return n;
    return safeCount(sb, "store_orders", { status: "pending" });
  }

  async function loadRecentAudit(sb) {
    try {
      const { data, error } = await sb
        .from("audit_log")
        .select("summary_ar,action,domain,created_at,actor_email")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.warn("[executive-dashboard] audit feed:", e?.message || e);
      return [];
    }
  }

  function computePriority(metrics) {
    const {
      newRequests,
      pendingRequests,
      openTickets,
      openChats,
      newContact,
      newStoreOrders,
      mediaDrafts
    } = metrics;
    if (newRequests > 0) return "مراجعة الطلبات الجديدة أولاً";
    if (pendingRequests > 0) return "متابعة طلبات بانتظار الاستكمال";
    if (openTickets > 0) return "تذاكر دعم تحتاج متابعة";
    if (openChats > 0) return "متابعة محادثات الدعم";
    if (newContact > 0) return "رد على رسائل تواصل معنا";
    if (newStoreOrders > 0) return "معالجة طلبات المتجر";
    if (mediaDrafts > 0) return "مراجعة مسودات الإعلام للنشر";
    return "تدقيق عام — لا إجراء عاجل";
  }

  function buildAlerts(metrics) {
    const {
      newRequests,
      pendingRequests,
      openChats,
      newContact,
      openTickets,
      newStoreOrders,
      mediaDrafts,
      suspendedStaff
    } = metrics;
    const alerts = [];
    if (newRequests > 0) {
      alerts.push({
        level: "warn",
        title: `${newRequests} طلب جديد`,
        detail: "يحتاج مراجعة أولية",
        href: "admin_requests.html?status=new"
      });
    }
    if (pendingRequests > 0) {
      alerts.push({
        level: "warn",
        title: `${pendingRequests} طلب بانتظار استكمال/مراجعة`,
        detail: "استكمال أو متابعة",
        href: "admin_completion_dashboard.html"
      });
    }
    if (openTickets > 0) {
      alerts.push({
        level: "warn",
        title: `${openTickets} تذكرة دعم مفتوحة`,
        detail: "مشاكل تقنية أو حسابات",
        href: "support_tickets_dashboard.html"
      });
    }
    if (openChats > 0) {
      alerts.push({
        level: "info",
        title: `${openChats} محادثة مفتوحة`,
        detail: "متابعة الدعم والطلبات",
        href: "communications_dashboard.html"
      });
    }
    if (newContact > 0) {
      alerts.push({
        level: "info",
        title: `${newContact} رسالة تواصل`,
        detail: "صندوق تواصل معنا",
        href: "contact_messages_dashboard.html"
      });
    }
    if (newStoreOrders > 0) {
      alerts.push({
        level: "warn",
        title: `${newStoreOrders} طلب متجر`,
        detail: "يتطلب معالجة",
        href: "store_orders_dashboard.html"
      });
    }
    if (mediaDrafts > 0) {
      alerts.push({
        level: "info",
        title: `${mediaDrafts} مسودة إعلام`,
        detail: "بانتظار مراجعة ونشر",
        href: "media_dashboard.html"
      });
    }
    if (suspendedStaff > 0) {
      alerts.push({
        level: "muted",
        title: `${suspendedStaff} موظف موقوف`,
        detail: "مراجعة الصلاحيات",
        href: "admin_permissions_dashboard.html"
      });
    }
    return alerts;
  }

  async function loadExecutiveDashboard() {
    const wrap = $("executiveDashboard");
    if (!wrap) return;
    const ok = await isExecutiveUser();
    if (!ok) {
      wrap.hidden = true;
      return;
    }
    wrap.hidden = false;

    const sb = createSupabaseClient();
    try {
      const [
        newRequests,
        pendingRequests,
        openChats,
        newContact,
        openTickets,
        newStoreOrders,
        mediaDrafts,
        playersTotal,
        activeStaff,
        suspendedStaff,
        recentAudit
      ] = await Promise.all([
        safeCount(sb, "join_requests", { status: "new" }),
        safeCount(sb, "join_requests", { status: { in: ["pending", "needs_completion", "review", "reviewing"] } }),
        safeCount(sb, "chat_rooms", { status: "open", room_type: "join_request" }),
        safeCount(sb, "contact_messages", { status: "new" }),
        safeCount(sb, "support_tickets", { status: { in: ["open", "in_progress", "waiting"] } }),
        countStoreOrders(sb),
        safeCount(sb, "academy_media", { status: "draft" }),
        safeCount(sb, "players", {}),
        safeCount(sb, "academy_staff", { status: "active" }),
        safeCount(sb, "academy_staff", { status: "suspended" }),
        loadRecentAudit(sb)
      ]);

      const metrics = {
        newRequests,
        pendingRequests,
        openChats,
        newContact,
        openTickets,
        newStoreOrders,
        mediaDrafts,
        suspendedStaff
      };

      setText("execNewRequests", newRequests);
      setText("execPendingRequests", pendingRequests);
      setText("execOpenChats", openChats);
      setText("execContactNew", newContact);
      setText("execOpenTickets", openTickets);
      setText("execStoreOrders", newStoreOrders);
      setText("execMediaDrafts", mediaDrafts);
      setText("execPlayers", playersTotal);
      setText("execActiveStaff", activeStaff);

      const priorityText = computePriority(metrics);
      setText("execTodayPriority", priorityText);
      setText("todayPriority", priorityText);

      renderAlerts(buildAlerts(metrics));
      renderAuditFeed(recentAudit);
      setText("execLastSync", fmtDate(new Date().toISOString()));
    } catch (e) {
      console.error("[executive-dashboard]", e);
      setText("execLastSync", "تعذر التحميل");
      renderAlerts([
        {
          level: "warn",
          title: "تعذر تحميل بعض المؤشرات",
          detail: "تحقق من الاتصال وRLS",
          href: "admin_dashboard.html"
        }
      ]);
    }
  }

  function bindExecutiveCards() {
    document.querySelectorAll("[data-exec-link]").forEach((el) => {
      el.addEventListener("click", () => {
        const href = el.getAttribute("data-exec-link");
        if (href) window.location.href = href;
      });
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const href = el.getAttribute("data-exec-link");
          if (href) window.location.href = href;
        }
      });
    });
  }

  function bootExecutiveDashboard() {
    bindExecutiveCards();
    loadExecutiveDashboard();
  }

  window.bootExecutiveDashboard = bootExecutiveDashboard;
})();
