/**
 * تصنيف طلبات الداعم — نوع، مستوى، طريقة دعم (عرض تشغيلي).
 */
(function () {
  const TYPES = {
    individual: { id: "individual", label: "فرد" },
    institution: { id: "institution", label: "مؤسسة" },
    sponsor_prospect: { id: "sponsor_prospect", label: "راعٍ محتمل" }
  };

  const LEVELS = {
    basic: { id: "basic", label: "داعم أساسي" },
    silver: { id: "silver", label: "داعم فضي" },
    gold: { id: "gold", label: "داعم ذهبي" },
    official_sponsor: { id: "official_sponsor", label: "راعٍ رسمي" }
  };

  const METHODS = {
    financial: { id: "financial", label: "مالي" },
    logistics: { id: "logistics", label: "لوجستي" },
    media_sponsorship: { id: "media_sponsorship", label: "رعاية إعلامية" },
    partnership: { id: "partnership", label: "رعاية مؤسسية" }
  };

  const TYPE_ALIASES = {
    فرد: "individual",
    مؤسسة: "institution",
    "راعٍ محتمل": "sponsor_prospect",
    individual: "individual",
    institution: "institution",
    sponsor_prospect: "sponsor_prospect"
  };

  const LEVEL_ALIASES = {
    "داعم أساسي": "basic",
    "داعم فضي": "silver",
    "داعم ذهبي": "gold",
    "راعٍ رسمي": "official_sponsor",
    basic: "basic",
    silver: "silver",
    gold: "gold",
    official_sponsor: "official_sponsor"
  };

  const METHOD_ALIASES = {
    مالي: "financial",
    لوجستي: "logistics",
    "رعاية إعلامية": "media_sponsorship",
    رعاية: "partnership",
    "رعاية مؤسسية": "partnership",
    شراكة: "partnership",
    "شراكة مؤسسية": "partnership",
    financial: "financial",
    logistics: "logistics",
    media_sponsorship: "media_sponsorship",
    partnership: "partnership"
  };

  function normalizeId(raw, aliases, catalog) {
    const key = String(raw || "").trim();
    if (!key) return "";
    const id = aliases[key] || key;
    return catalog[id] ? id : "";
  }

  function isValidType(id) {
    return !!TYPES[String(id || "").trim()];
  }

  function isValidLevel(id) {
    return !!LEVELS[String(id || "").trim()];
  }

  function isValidMethod(id) {
    return !!METHODS[String(id || "").trim()];
  }

  function typeLabel(id) {
    const key = normalizeId(id, TYPE_ALIASES, TYPES);
    return TYPES[key]?.label || String(id || "").trim() || "-";
  }

  function levelLabel(id) {
    const key = normalizeId(id, LEVEL_ALIASES, LEVELS);
    return LEVELS[key]?.label || String(id || "").trim() || "-";
  }

  function methodLabel(id) {
    const key = normalizeId(id, METHOD_ALIASES, METHODS);
    return METHODS[key]?.label || String(id || "").trim() || "-";
  }

  function needsEntityName(typeId) {
    const id = normalizeId(typeId, TYPE_ALIASES, TYPES);
    return id === "institution" || id === "sponsor_prospect";
  }

  function parseFromRequest(r) {
    if (!r) {
      return { typeId: "", levelId: "", methodId: "", typeLabel: "-", levelLabel: "-", methodLabel: "-" };
    }
    const notes = String(r.notes || r.support_notes || "");
    let typeId = normalizeId(r.support_type || r.supporter_type, TYPE_ALIASES, TYPES);
    let levelId = normalizeId(r.support_level, LEVEL_ALIASES, LEVELS);
    let methodId = normalizeId(r.support_method, METHOD_ALIASES, METHODS);

    const tm = notes.match(/نوع الداعم:\s*([^\n]+)/);
    const lm = notes.match(/مستوى الدعم:\s*([^\n]+)/);
    const mm = notes.match(/طريقة الدعم:\s*([^\n]+)/);
    if (tm) typeId = normalizeId(tm[1].trim(), TYPE_ALIASES, TYPES) || typeId;
    if (lm) levelId = normalizeId(lm[1].trim(), LEVEL_ALIASES, LEVELS) || levelId;
    if (mm) methodId = normalizeId(mm[1].trim(), METHOD_ALIASES, METHODS) || methodId;

    return {
      typeId,
      levelId,
      methodId,
      typeLabel: typeLabel(typeId),
      levelLabel: levelLabel(levelId),
      methodLabel: methodLabel(methodId),
      entityName: String(r.entity_name || "").trim()
    };
  }

  function formatSupporterNotes(typeId, levelId, methodId, extraLines) {
    const lines = [
      `نوع الداعم: ${typeLabel(typeId)}`,
      `مستوى الدعم: ${levelLabel(levelId)}`,
      `طريقة الدعم: ${methodLabel(methodId)}`
    ];
    if (Array.isArray(extraLines)) lines.push(...extraLines.filter(Boolean));
    return lines.join("\n");
  }

  function allTypeOptions() {
    return Object.values(TYPES);
  }
  function allLevelOptions() {
    return Object.values(LEVELS);
  }
  function allMethodOptions() {
    return Object.values(METHODS);
  }

  window.SUPPORTER_PROFILE = {
    TYPES,
    LEVELS,
    METHODS,
    isValidType,
    isValidLevel,
    isValidMethod,
    typeLabel,
    levelLabel,
    methodLabel,
    needsEntityName,
    parseFromRequest,
    formatSupporterNotes,
    allTypeOptions,
    allLevelOptions,
    allMethodOptions
  };
  window.supportTypeLabel = typeLabel;
})();
