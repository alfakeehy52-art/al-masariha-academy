/**
 * عضوية الأكاديمية (متابعة فقط) — اهتمامات رسمية، بدون مرفقات.
 */
(function () {
  const INTERESTS = {
    news: { id: "news", label: "أخبار الأكاديمية" },
    events: { id: "events", label: "حضور الفعاليات" },
    store: { id: "store", label: "عروض المتجر" },
    future_player: { id: "future_player", label: "تسجيل لاعب مستقبلاً" },
    support: { id: "support", label: "الرعاية والدعم" }
  };

  const INTEREST_ALIASES = {
    news: "news",
    events: "events",
    store: "store",
    future_player: "future_player",
    support: "support",
    "أخبار الأكاديمية": "news",
    "حضور الفعاليات": "events",
    "عروض المتجر": "store",
    "تسجيل لاعب مستقبلاً": "future_player",
    "تسجيل لاعب مستقبلًا": "future_player",
    "الرعاية والدعم": "support"
  };

  const REMOVED_GOAL_LABELS = {
    guardian_member_only: "طلب قديم (غير مدعوم — استخدم عضوية الأكاديمية)"
  };

  function normalizeInterestId(raw) {
    const key = String(raw || "").trim();
    if (!key) return "";
    const id = INTEREST_ALIASES[key] || key;
    return INTERESTS[id] ? id : "";
  }

  function parseInterestIdsFromNotes(notes) {
    const text = String(notes || "");
    const m = text.match(/الاهتمامات:\s*([^\n]+)/);
    if (!m) return [];
    return m[1]
      .split(/[،,]/)
      .map((s) => normalizeInterestId(s.trim()))
      .filter(Boolean);
  }

  function parseFromRequest(r) {
    if (!r) return { interestIds: [], interestsLabel: "-", hasLegacyGoal: false };
    const goal = String(r.guardian_goal || "").trim();
    const interestIds = parseInterestIdsFromNotes(r.notes || r.guardian_notes || "");
    return {
      interestIds,
      interestsLabel: interestsLabel(interestIds),
      hasLegacyGoal: !!goal,
      legacyGoalLabel: goal ? REMOVED_GOAL_LABELS[goal] || goal : ""
    };
  }

  function isValidInterestId(id) {
    return !!INTERESTS[String(id || "").trim()];
  }

  function hasValidInterests(ids) {
    return Array.isArray(ids) && ids.filter(isValidInterestId).length > 0;
  }

  function interestLabel(id) {
    const key = normalizeInterestId(id);
    return INTERESTS[key]?.label || String(id || "").trim() || "";
  }

  function interestsLabel(ids) {
    if (!Array.isArray(ids) || !ids.length) return "-";
    return ids.map(interestLabel).filter(Boolean).join("، ");
  }

  function formatMemberNotes(interestIds, extraLines) {
    const ids = (Array.isArray(interestIds) ? interestIds : [])
      .map(normalizeInterestId)
      .filter(Boolean);
    const lines = [];
    if (ids.length) lines.push(`الاهتمامات: ${ids.map(interestLabel).filter(Boolean).join("، ")}`);
    if (Array.isArray(extraLines)) lines.push(...extraLines.filter(Boolean));
    return lines.join("\n");
  }

  function allInterestOptions() {
    return Object.values(INTERESTS);
  }

  function isBlockedRequest(r) {
    const p = parseFromRequest(r);
    if (p.hasLegacyGoal) return true;
    return !hasValidInterests(p.interestIds);
  }

  window.ACADEMY_MEMBER_PROFILE = {
    INTERESTS,
    normalizeInterestId,
    parseInterestIdsFromNotes,
    parseFromRequest,
    isValidInterestId,
    hasValidInterests,
    interestLabel,
    interestsLabel,
    formatMemberNotes,
    allInterestOptions,
    isBlockedRequest,
    REMOVED_GOAL_LABELS
  };
  window.interestsLabel = interestsLabel;
})();
