/**
 * أغراض ولي الأمر الرسمية — مساران فقط: تسجيل لاعب جديد | ربط بلاعب موجود.
 */
(function () {
  const GOALS = {
    register_new_player: {
      id: "register_new_player",
      label: "تسجيل لاعب جديد",
      short: "لاعب جديد",
      approveMode: "new_player"
    },
    link_existing_player: {
      id: "link_existing_player",
      label: "ربط بلاعب موجود",
      short: "ربط لاعب",
      approveMode: "existing_player"
    }
  };

  const REMOVED_GOAL_LABELS = {
    guardian_member_only: "طلب قديم (غير مدعوم)"
  };

  function isValidGoal(value) {
    return !!GOALS[String(value || "").trim()];
  }

  function goalLabel(value) {
    const key = String(value || "").trim();
    if (GOALS[key]) return GOALS[key].label;
    if (REMOVED_GOAL_LABELS[key]) return REMOVED_GOAL_LABELS[key];
    return key || "-";
  }

  function goalShort(value) {
    const key = String(value || "").trim();
    return GOALS[key]?.short || goalLabel(value);
  }

  function resolveMode(request) {
    const r = request || {};
    const raw = String(r.guardian_goal || "").trim();
    if (raw === "register_new_player") return "new_player";
    if (raw === "link_existing_player") return "existing_player";
    if (r.child_name && (r.guardian_player_age || r.child_category || r.guardian_player_category)) {
      return "new_player";
    }
    if (
      r.linked_player_ids ||
      r.linked_player_id ||
      r.existing_player_ids ||
      r.existing_player_names
    ) {
      return "existing_player";
    }
    const noteText = String(r.notes || r.guardian_notes || "");
    if (/اللاعبون المختارون:/i.test(noteText) || /معرّفات:/i.test(noteText)) {
      return "existing_player";
    }
    if (r.child_name) return "new_player";
    return "";
  }

  function linkedPlayerNames(request) {
    const r = request || {};
    if (r.existing_player_names) return String(r.existing_player_names).trim();
    if (r.child_name && resolveMode(r) === "existing_player") {
      return String(r.child_name).trim();
    }
    const notes = String(r.notes || r.guardian_notes || "");
    const m = notes.match(/اللاعبون المختارون:\s*([^\n]+)/);
    return m ? m[1].trim() : "";
  }

  function allGoalOptions() {
    return Object.values(GOALS);
  }

  window.GUARDIAN_GOALS = {
    GOALS,
    isValidGoal,
    goalLabel,
    goalShort,
    resolveMode,
    linkedPlayerNames,
    allGoalOptions
  };
  window.goalLabel = goalLabel;
})();
