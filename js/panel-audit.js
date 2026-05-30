/**
 * RBAC-3 — تسجيل أحداث التدقيق (fire-and-forget)
 */
(function () {
  const CACHE_MS = 30000;
  let actorCache = { ts: 0, data: null };

  function trim(value, max) {
    return String(value ?? "")
      .trim()
      .slice(0, max || 512);
  }

  async function resolveActor() {
    const now = Date.now();
    if (actorCache.data && now - actorCache.ts < CACHE_MS) return actorCache.data;

    const session = typeof getAdminSession === "function" ? await getAdminSession() : null;
    const user = session?.user;
    if (!user?.id) return null;

    let ctx = window.__panelAccessContext;
    if (!ctx && typeof resolvePanelAccessContext === "function") {
      try {
        ctx = await resolvePanelAccessContext(user);
        window.__panelAccessContext = ctx;
      } catch (_e) {}
    }

    const data = {
      actor_user_id: user.id,
      actor_email: trim(user.email, 320),
      actor_level: trim(ctx?.level, 8) || null,
      actor_job_title: trim(ctx?.jobTitle, 120) || null
    };
    actorCache = { ts: now, data };
    return data;
  }

  /**
   * @param {object} event
   * @param {string} event.domain — requests | store | media | system | auth | …
   * @param {string} event.action — request_approve | staff_suspend | auth.login | …
   * @param {string} [event.entityType]
   * @param {string} [event.entityId]
   * @param {string} [event.summary] — summary_ar
   * @param {object} [event.meta]
   */
  async function logPanelAudit(event) {
    if (!event || typeof createSupabaseClient !== "function") return false;
    try {
      const actor = await resolveActor();
      if (!actor) return false;

      const row = {
        domain: trim(event.domain || "system", 64),
        action: trim(event.action || "unknown", 64),
        entity_type: event.entityType ? trim(event.entityType, 64) : null,
        entity_id: event.entityId ? trim(event.entityId, 128) : null,
        actor_user_id: actor.actor_user_id,
        actor_email: actor.actor_email,
        actor_level: actor.actor_level,
        actor_job_title: actor.actor_job_title,
        summary_ar: event.summary ? trim(event.summary, 500) : null,
        meta_json: event.meta && typeof event.meta === "object" && !Array.isArray(event.meta) ? event.meta : {}
      };

      const sb = createSupabaseClient();
      const { error } = await sb.from("audit_log").insert([row]);
      if (error) {
        console.warn("[panel-audit]", error.message || error);
        return false;
      }
      return true;
    } catch (e) {
      console.warn("[panel-audit]", e);
      return false;
    }
  }

  window.logPanelAudit = logPanelAudit;
  window.PANEL_AUDIT = {
    AUTH_LOGIN: "auth.login",
    AUTH_LOGOUT: "auth.logout",
    AUTH_PASSWORD: "auth.password_change",
    ACCOUNT_PROFILE: "account.profile_update",
    REQUEST_APPROVE: "request.approve",
    REQUEST_REJECT: "request.reject",
    REQUEST_STATUS: "request.status_change",
    REQUEST_FINAL_REVIEW: "request.final_review",
    STAFF_SUSPEND: "staff.suspend",
    STAFF_ACTIVATE: "staff.activate",
    STAFF_PERMISSIONS: "staff.permissions_update",
    STORE_PRODUCT_DELETE: "store.product_delete",
    STORE_PRODUCTS_CLEAR: "store.products_clear_all",
    STORE_ORDER_DELETE: "store.order_delete",
    MEDIA_PUBLISH: "media.publish",
    MEDIA_DELETE: "media.delete",
    SUPPORT_TICKET_CREATE: "support.ticket_create",
    SUPPORT_TICKET_UPDATE: "support.ticket_update",
    SUPPORT_TICKET_DELETE: "support.ticket_delete"
  };
})();
