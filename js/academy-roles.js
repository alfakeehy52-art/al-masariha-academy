/**

 * تصنيف أدوار الأكاديمية — الأعضاء والكوادر

 * يُستخدم في نموذج الانضمام ولوحة إدارة الطلبات.

 */

(function () {

  const DOMAINS = [

    { id: "sports", label: "رياضي" },

    { id: "medical", label: "طبي" },

    { id: "admin", label: "إداري" },

    { id: "operations", label: "تشغيلي" },

    { id: "media_tech", label: "إعلامي وتقني" }

  ];



  let CUSTOM_ROLES = [];

  const ROLES = [

    { id: "coach", domain: "sports", label: "مدرب", approveAs: "staff" },

    { id: "team_admin", domain: "sports", label: "إداري فريق", approveAs: "staff" },

    { id: "performance_analyst", domain: "sports", label: "محلل أداء", approveAs: "staff" },

    { id: "doctor", domain: "medical", label: "طبيب", approveAs: "staff" },

    { id: "physiotherapist", domain: "medical", label: "أخصائي علاج طبيعي", approveAs: "staff" },

    { id: "nurse", domain: "medical", label: "ممرض", approveAs: "staff" },

    { id: "first_aid", domain: "medical", label: "إسعافات أولية", approveAs: "staff" },

    { id: "supervisor", domain: "admin", label: "مشرف", approveAs: "staff" },

    { id: "admin_writer", domain: "admin", label: "كاتب إداري", approveAs: "staff" },

    { id: "accountant", domain: "admin", label: "محاسب", approveAs: "staff" },

    { id: "registration_officer", domain: "admin", label: "مسؤول تسجيل", approveAs: "staff" },

    { id: "customer_service", domain: "admin", label: "خدمة عملاء", approveAs: "staff" },

    { id: "bus_driver", domain: "operations", label: "سائق باص", approveAs: "staff" },

    { id: "field_manager", domain: "operations", label: "مسؤول ملاعب", approveAs: "staff" },

    { id: "warehouse_manager", domain: "operations", label: "مسؤول مستودع", approveAs: "staff" },

    { id: "store_manager", domain: "operations", label: "مسؤول متجر", approveAs: "staff" },

    { id: "security", domain: "operations", label: "أمن", approveAs: "staff" },

    { id: "event_organizer", domain: "operations", label: "منظم فعاليات", approveAs: "staff" },

    { id: "photographer", domain: "media_tech", label: "مصور", approveAs: "staff" },

    { id: "designer", domain: "media_tech", label: "مصمم", approveAs: "staff" },

    { id: "video_editor", domain: "media_tech", label: "مونتير", approveAs: "staff" },

    { id: "social_media", domain: "media_tech", label: "مسؤول سوشيال ميديا", approveAs: "staff" },

    { id: "web_developer", domain: "media_tech", label: "مطور الموقع", approveAs: "staff" }

  ];



  const COACH_SPECIALTIES = [

    "التدريب الفني",

    "اللياقة البدنية",

    "تدريب الحراس",

    "التحليل الفني",

    "الإعداد الذهني"

  ];



  const AGE_CATEGORIES = ["براعم", "ناشئين", "شباب", "فريق أول", "كل الفئات"];



  function getDomains() {

    return DOMAINS.slice();

  }

  function allRoles() {
    return ROLES.concat(CUSTOM_ROLES);
  }

  function registerCustomRoles(list) {
    CUSTOM_ROLES = (Array.isArray(list) ? list : [])
      .map((r) => ({
        id: String(r.id || "").trim(),
        domain: String(r.domain || "").trim(),
        label: String(r.label || "").trim(),
        approveAs: "staff"
      }))
      .filter((r) => r.id && r.domain && r.label);
  }



  function getRoles(domainId) {

    if (!domainId) return allRoles().slice();

    return allRoles().filter((r) => r.domain === domainId);

  }



  function getRole(roleId) {

    return allRoles().find((r) => r.id === roleId) || null;

  }



  function getDomain(domainId) {

    return DOMAINS.find((d) => d.id === domainId) || null;

  }



  function getDomainLabel(domainId) {

    return getDomain(domainId)?.label || domainId || "-";

  }



  function getRoleLabel(roleId) {

    return getRole(roleId)?.label || roleId || "-";

  }



  function isSportsDomain(domainId) {

    return domainId === "sports";

  }



  function needsSportsDetail(roleId) {

    return ["coach", "team_admin", "performance_analyst"].includes(roleId);

  }



  function getApproveRoute(roleId) {

    return getRole(roleId)?.approveAs || "staff";

  }



  /** استخراج مجال/دور من طلب محفوظ (حقول أو ملاحظات) */

  function parseStaffFromRequest(r) {

    if (!r) return { domain: "", roleId: "", roleLabel: "" };

    let domain = String(r.volunteer_field || "").trim();

    let roleId = String(r.coach_job_title || "").trim();

    const notes = String(r.notes || r.volunteer_notes || "");

    const dm = notes.match(/مجال الكادر:\s*([^\n]+)/);

    const dr = notes.match(/الدور:\s*([^\n]+)/);

    if (dm) {

      const label = dm[1].trim();

      const d = DOMAINS.find((x) => x.label === label || x.id === label);

      if (d) domain = d.id;

    }

    if (dr) {

      const label = dr[1].trim();

      const role = allRoles().find((x) => x.label === label || x.id === label);

      if (role) roleId = role.id;

    }

    if (!roleId && r.coach_specialty) {

      const spec = String(r.coach_specialty).trim();

      const role = allRoles().find((x) => x.label === spec || x.id === spec);

      if (role) roleId = role.id;

    }

    if (domain && !DOMAINS.find((x) => x.id === domain)) {

      const d = DOMAINS.find((x) => x.label === domain);

      if (d) domain = d.id;

    }

    return {

      domain,

      roleId,

      roleLabel: getRoleLabel(roleId) || r.coach_specialty || dr?.[1]?.trim() || ""

    };

  }



  function formatStaffNotes(domainId, roleId, extraLines) {

    const lines = [

      `مجال الكادر: ${getDomainLabel(domainId)}`,

      `الدور: ${getRoleLabel(roleId)}`

    ];

    if (Array.isArray(extraLines)) lines.push(...extraLines.filter(Boolean));

    return lines.join("\n");

  }



  window.ACADEMY_ROLES = {

    DOMAINS,

    ROLES,
    allRoles,
    registerCustomRoles,

    COACH_SPECIALTIES,

    AGE_CATEGORIES,

    getDomains,

    getRoles,

    getRole,

    getDomain,

    getDomainLabel,

    getRoleLabel,

    isSportsDomain,

    needsSportsDetail,

    getApproveRoute,

    parseStaffFromRequest,

    formatStaffNotes

  };

})();


