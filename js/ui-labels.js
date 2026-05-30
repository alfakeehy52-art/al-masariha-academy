/**
 * نصوص واجهة عربية — إخفاء الرموز التقنية والإنجليزية عن الزائر
 */
(function () {
  const POSITION_CODES = {
    ST: "مهاجم",
    CF: "مهاجم",
    RW: "جناح",
    LW: "جناح",
    CM: "وسط",
    CAM: "وسط هجومي",
    CDM: "محور",
    CB: "مدافع",
    RB: "ظهير أيمن",
    LB: "ظهير أيسر",
    GK: "حارس مرمى"
  };

  const POSITION_AR = {
    ...POSITION_CODES,
    مهاجم: "مهاجم",
    جناح: "جناح",
    وسط: "وسط",
    "وسط هجومي": "وسط هجومي",
    محور: "محور",
    مدافع: "مدافع",
    "حارس مرمى": "حارس مرمى",
    "ظهير أيمن": "ظهير أيمن",
    "ظهير أيسر": "ظهير أيسر",
    لاعب: "لاعب"
  };

  function isTechnicalToken(value) {
    const v = String(value ?? "").trim();
    if (!v) return true;
    if (/^PLY-/i.test(v)) return true;
    if (/^[A-Z]{2,5}-[A-Z0-9]{1,4}$/i.test(v)) return true;
    if (/^[A-Z]{2,4}-\d{1,3}$/i.test(v)) return true;
    if (/^[0-9A-F]{6,16}$/i.test(v)) return true;
    if (/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(v)) return true;
    if (/^REQ-/i.test(v) && v.length > 20) return false;
    return false;
  }

  function positionLabelAr(value) {
    const raw = String(value ?? "").trim();
    if (!raw) return "—";
    const upper = raw.toUpperCase();
    if (POSITION_CODES[upper]) return POSITION_CODES[upper];
    if (POSITION_AR[raw]) return POSITION_AR[raw];
    if (/^[A-Z]{2,4}$/.test(upper)) return POSITION_CODES[upper] || "لاعب";
    return raw;
  }

  function formatPlayerShirtNumber(player) {
    if (!player) return "—";
    const candidates = [player.shirt_number, player.shirtNumber];
    for (const c of candidates) {
      const n = String(c ?? "").trim();
      if (/^\d{1,3}$/.test(n)) return n;
    }
    return "—";
  }

  function formatPlayerPublicNumber(player) {
    const shirt = formatPlayerShirtNumber(player);
    if (shirt !== "—") return shirt;
    return "—";
  }

  function formatPlayerAdminRef(player) {
    const shirt = formatPlayerShirtNumber(player);
    if (shirt !== "—") return shirt;
    const ref = String(player?.reference_code || "").trim();
    if (ref && !isTechnicalToken(ref)) return ref;
    return "—";
  }

  function formatRequestRef(value) {
    const v = String(value ?? "").trim();
    if (!v) return "—";
    if (isTechnicalToken(v)) return "—";
    if (/^[0-9a-f-]{30,}$/i.test(v)) return "—";
    return v;
  }

  function hideTechnicalDetail(value) {
    const v = String(value ?? "").trim();
    if (!v) return "—";
    if (isTechnicalToken(v)) return "—";
    if (/^[0-9a-f-]{30,}$/i.test(v)) return "—";
    return v;
  }

  function formatEntityRef(entity) {
    const ref = String(entity?.reference_code || entity?.code || "").trim();
    if (!ref) return "—";
    if (isTechnicalToken(ref)) return "—";
    return ref;
  }

  function teamPublicBadge(team, playersCount) {
    const cat = String(team?.category || "").trim();
    const n = Number(playersCount);
    const players =
      !Number.isNaN(n) && n >= 0 ? `${n} لاعب` : "";
    const parts = [cat, players].filter(Boolean);
    return parts.length ? parts.join(" • ") : "فريق نشط";
  }

  function coachPublicBadge(coach) {
    const years = coach?.experienceYears ?? coach?.experience_years;
    const n = Number(years);
    if (!Number.isNaN(n) && n > 0) return `${n} سنة خبرة`;
    const spec = String(coach?.specialty || coach?.jobTitle || "").trim();
    return spec || "مدرب";
  }

  function playerPickSubtitle(player) {
    if (!player) return "";
    const pos =
      typeof positionLabelAr === "function"
        ? positionLabelAr(player.position)
        : String(player.position || "").trim();
    const shirt =
      typeof formatPlayerPublicNumber === "function"
        ? formatPlayerPublicNumber(player)
        : "";
    const parts = [
      player.category,
      pos,
      shirt && shirt !== "—" ? `رقم ${shirt}` : "",
      player.phone
    ]
      .map((v) => String(v ?? "").trim())
      .filter((v) => v && !isTechnicalToken(v));
    return parts.join(" • ");
  }

  window.UiLabels = {
    POSITION_CODES,
    positionLabelAr,
    isTechnicalToken,
    formatPlayerShirtNumber,
    formatPlayerPublicNumber,
    formatPlayerAdminRef,
    formatRequestRef,
    hideTechnicalDetail,
    formatEntityRef,
    teamPublicBadge,
    coachPublicBadge,
    playerPickSubtitle
  };
  window.positionLabelAr = positionLabelAr;
  window.teamPublicBadge = teamPublicBadge;
  window.coachPublicBadge = coachPublicBadge;
  window.playerPickSubtitle = playerPickSubtitle;
  window.formatPlayerPublicNumber = formatPlayerPublicNumber;
  window.formatPlayerAdminRef = formatPlayerAdminRef;
  window.formatRequestRef = formatRequestRef;
  window.hideTechnicalDetail = hideTechnicalDetail;
  window.formatEntityRef = formatEntityRef;
})();
