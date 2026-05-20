/**

 * سياسات الأكاديمية — العمر الهجري، الفئات، وولي الأمر

 * السعودية: الاعتماد على العمر الهجري في التصنيف الإداري والرياضي.

 */

(function () {

  const MINOR_AGE_HIJRI = 18;



  /** فئات العمر — يمكن للإدارة/المدرب تعديلها لاحقاً عند الاعتماد */

  const AGE_CATEGORIES = [

    { key: "براعم", min: 0, max: 11 },

    { key: "ناشئين", min: 12, max: 15 },

    { key: "شباب", min: 16, max: 18 },

    { key: "فريق أول", min: 19, max: 999 }

  ];



  function normalizeDigits(value) {

    return String(value ?? "")

      .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))

      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))

      .replace(/\s+/g, "")

      .trim();

  }



  function getConfiguredHijriToday() {

    const cfg =

      typeof window !== "undefined" && window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.hijriToday;

    if (!cfg || !Number(cfg.year)) return null;

    const year = Number(cfg.year);

    const month = Number(cfg.month) || 1;

    const day = Number(cfg.day) || 1;

    if (year >= 1400 && year <= 1500 && month >= 1 && month <= 12 && day >= 1 && day <= 30) {

      return { year, month, day };

    }

    return null;

  }



  /**

   * التاريخ الهجري الحالي — en أولاً لتفادي سنة من رقمين في ar-SA

   */

  function getCurrentHijriDate() {

    const locales = ["en-u-ca-islamic-umalqura", "ar-SA-u-ca-islamic-umalqura"];

    for (const loc of locales) {

      try {

        const parts = new Intl.DateTimeFormat(loc, {

          year: "numeric",

          month: "numeric",

          day: "numeric",

          timeZone: "Asia/Riyadh"

        }).formatToParts(new Date());

        const y = Number(normalizeDigits((parts.find((p) => p.type === "year") || {}).value || 0));

        const m = Number(normalizeDigits((parts.find((p) => p.type === "month") || {}).value || 0));

        const d = Number(normalizeDigits((parts.find((p) => p.type === "day") || {}).value || 0));

        if (y >= 1400 && y <= 1500 && m >= 1 && m <= 12 && d >= 1 && d <= 30) {

          return { year: y, month: m, day: d };

        }

      } catch (e) {}

    }

    return getConfiguredHijriToday() || { year: 1447, month: 11, day: 1 };

  }



  function formatHijriTodayLabel() {

    const t = getCurrentHijriDate();

    return `${t.day}/${t.month}/${t.year} هـ`;

  }



  function parseHijriDate(value) {

    const raw = normalizeDigits(String(value || "").trim());

    if (!raw) return null;

    const parts = raw.split(/[\/\-]/).map((x) => x.trim()).filter(Boolean);

    if (parts.length !== 3) return null;

    const nums = parts.map((n) => Number(normalizeDigits(n)));

    if (nums.some((n) => !Number.isFinite(n))) return null;

    let year = null;

    let month = null;

    let day = null;

    if (nums[0] >= 1300 && nums[0] <= 1700) {

      year = nums[0];

      month = nums[1];

      day = nums[2];

    } else if (nums[2] >= 1300 && nums[2] <= 1700) {

      day = nums[0];

      month = nums[1];

      year = nums[2];

    }

    if (!year || !month || !day) return null;

    if (month < 1 || month > 12 || day < 1 || day > 30) return null;

    return { year, month, day };

  }



  function calcHijriAge(birth) {

    if (!birth) return null;

    const now = getCurrentHijriDate();

    let age = now.year - birth.year;

    if (now.month < birth.month || (now.month === birth.month && now.day < birth.day)) age--;

    return age >= 0 ? age : null;

  }



  function isMinorHijriAge(age) {

    const n = Number(age);

    return Number.isFinite(n) && n >= 0 && n < MINOR_AGE_HIJRI;

  }



  function isAdultHijriAge(age) {

    const n = Number(age);

    return Number.isFinite(n) && n >= MINOR_AGE_HIJRI;

  }



  function autoCategoryByHijriAge(age) {

    const n = Number(age);

    if (!Number.isFinite(n) || n < 0) return "";

    const band = AGE_CATEGORIES.find((c) => n >= c.min && n <= c.max);

    return band ? band.key : "فريق أول";

  }



  window.ACADEMY_POLICY = {

    MINOR_AGE_HIJRI,

    AGE_CATEGORIES,

    normalizeDigits,

    getConfiguredHijriToday,

    getCurrentHijriDate,

    formatHijriTodayLabel,

    parseHijriDate,

    calcHijriAge,

    isMinorHijriAge,

    isAdultHijriAge,

    autoCategoryByHijriAge

  };

})();


