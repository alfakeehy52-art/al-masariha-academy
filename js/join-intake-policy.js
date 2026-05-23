/**
 * سياسة فتح/إغلاق التقديم من إعدادات الأكاديمية.
 */
(function () {
  const JOIN_TYPES = [
    { id: "player", label: "لاعب" },
    { id: "guardian", label: "ولي أمر" },
    { id: "staff", label: "كادر" },
    { id: "supporter", label: "داعم" },
    { id: "academy_member", label: "عضو الأكاديمية" }
  ];

  function parseClosedTypes(raw) {
    if (Array.isArray(raw)) return raw.map(String);
    const text = String(raw || "").trim();
    if (!text) return [];
    try {
      const arr = JSON.parse(text);
      return Array.isArray(arr) ? arr.map(String) : [];
    } catch (e) {
      return text.split(/[،,]/).map((s) => s.trim()).filter(Boolean);
    }
  }

  function parseCustomRoles(raw) {
    if (Array.isArray(raw)) return raw;
    const text = String(raw || "").trim();
    if (!text) return [];
    try {
      const arr = JSON.parse(text);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function fromSettings(settings) {
    const s = settings || window.ACADEMY_SETTINGS || {};
    return {
      closedAll: Boolean(s.join_closed_all),
      closedTypes: parseClosedTypes(s.join_closed_types),
      closedMessage:
        String(s.join_closed_message_ar || "").trim() ||
        "التقديم متوقف مؤقتاً. تواصل مع إدارة الأكاديمية.",
      customStaffRoles: parseCustomRoles(s.custom_staff_roles_json)
    };
  }

  function isTypeOpen(typeId, settings) {
    const p = fromSettings(settings);
    const id = String(typeId || "").trim();
    if (!id) return true;
    if (p.closedAll) return false;
    return !p.closedTypes.includes(id);
  }

  function labelForType(typeId) {
    return JOIN_TYPES.find((t) => t.id === typeId)?.label || typeId;
  }

  window.JOIN_INTAKE_POLICY = {
    JOIN_TYPES,
    parseClosedTypes,
    parseCustomRoles,
    fromSettings,
    isTypeOpen,
    labelForType
  };
})();
