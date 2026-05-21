/**
 * إعدادات الأكاديمية — تحميل عام + تطبيق على الواجهة + حفظ من لوحة الإدارة.
 */
(function () {
  const SETTINGS_ID = "default";

  const DEFAULTS = {
    id: SETTINGS_ID,
    brand_name_ar: "أكاديمية المسارحة",
    brand_subtitle_ar: "لكرة القدم",
    tagline: "نطوّر المواهب ونصنع مستقبل اللاعبين",
    location_text: "المسارحة - السعودية",
    contact_email: "info@masariha-academy.com",
    contact_phone: "",
    contact_hours: "يوميًا من 4:00 مساءً حتى 10:00 مساءً",
    whatsapp_url: "",
    instagram_url: "",
    twitter_handle: "@masariha_academy",
    logo_url: "academy-logo.svg",
    hero_heading_1: "أكاديمية",
    hero_heading_highlight: "المسارحة",
    hero_heading_2: "لكرة القدم",
    hero_description:
      "انضم للأكاديمية، تابع اللاعبين والمدربين من قاعدة البيانات، وقدّم طلبك بخطوات واضحة.",
    hero_image_url: "",
    about_snippet:
      "أكاديمية المسارحة لكرة القدم تهدف إلى تطوير مهارات اللاعبين وصناعة جيل مميز من المواهب الكروية.",
    footer_copyright: "© أكاديمية المسارحة لكرة القدم - جميع الحقوق محفوظة",
    color_gold: "#d5b15a",
    color_green: "#0d6c48",
    show_store: true,
    show_media: true,
    show_news: true,
    nav_show_track_join: true,
    nav_show_track_store: true,
    nav_show_admin_login: true
  };

  let _cache = null;
  let _cacheAt = 0;
  const CACHE_MS = 60 * 1000;

  function mergeSettings(row) {
    const out = { ...DEFAULTS };
    if (!row || typeof row !== "object") return out;
    Object.keys(DEFAULTS).forEach((key) => {
      if (row[key] === undefined || row[key] === null) return;
      if (typeof DEFAULTS[key] === "boolean") {
        out[key] = Boolean(row[key]);
      } else {
        out[key] = String(row[key]);
      }
    });
    if (row.updated_at) out.updated_at = String(row.updated_at);
    return out;
  }

  function getClient() {
    if (typeof createSupabaseClient === "function") {
      return createSupabaseClient();
    }
    return null;
  }

  async function loadAcademySettings(options) {
    const force = options && options.force;
    const now = Date.now();
    if (!force && _cache && now - _cacheAt < CACHE_MS) {
      return { ..._cache };
    }

    const sb = getClient();
    if (!sb) {
      _cache = mergeSettings(null);
      _cacheAt = now;
      return { ..._cache };
    }

    const { data, error } = await sb
      .from("academy_settings")
      .select("*")
      .eq("id", SETTINGS_ID)
      .maybeSingle();

    if (error) {
      console.warn("[academy-settings] load failed:", error.message);
      _cache = mergeSettings(null);
    } else {
      _cache = mergeSettings(data);
    }
    _cacheAt = now;
    window.ACADEMY_SETTINGS = { ..._cache };
    return { ..._cache };
  }

  async function saveAcademySettings(payload) {
    const sb = getClient();
    if (!sb) throw new Error("Supabase غير متاح");

    const row = {
      id: SETTINGS_ID,
      updated_at: new Date().toISOString()
    };

    Object.keys(DEFAULTS).forEach((key) => {
      if (key === "id" || payload[key] === undefined) return;
      if (typeof DEFAULTS[key] === "boolean") {
        row[key] = Boolean(payload[key]);
      } else {
        row[key] = payload[key] == null ? "" : String(payload[key]).trim();
      }
    });

    const { data, error } = await sb
      .from("academy_settings")
      .upsert(row, { onConflict: "id" })
      .select("*")
      .single();

    if (error) throw error;
    _cache = mergeSettings(data);
    _cacheAt = Date.now();
    window.ACADEMY_SETTINGS = { ..._cache };
    return { ..._cache };
  }

  function setText(sel, value) {
    document.querySelectorAll(sel).forEach((el) => {
      if (value) el.textContent = value;
    });
  }

  function setHref(sel, value) {
    if (!value) return;
    document.querySelectorAll(sel).forEach((el) => {
      el.setAttribute("href", value);
      el.style.display = "";
    });
  }

  function toggleNavItem(key, visible) {
    document.querySelectorAll(`[data-nav-item="${key}"]`).forEach((el) => {
      el.style.display = visible ? "" : "none";
    });
  }

  function toggleSection(key, visible) {
    document.querySelectorAll(`[data-settings-section="${key}"]`).forEach((el) => {
      el.style.display = visible ? "" : "none";
    });
  }

  function applyAcademySettingsToSite(settings) {
    const s = mergeSettings(settings || window.ACADEMY_SETTINGS);

    document.documentElement.style.setProperty("--site-gold", s.color_gold || DEFAULTS.color_gold);
    document.documentElement.style.setProperty("--site-green", s.color_green || DEFAULTS.color_green);
    document.documentElement.style.setProperty("--gold", s.color_gold || DEFAULTS.color_gold);
    document.documentElement.style.setProperty("--green", s.color_green || DEFAULTS.color_green);

    setText("[data-academy='brand_name']", s.brand_name_ar);
    setText("[data-academy='brand_subtitle']", s.brand_subtitle_ar);
    setText("[data-academy='tagline']", s.tagline);
    setText("[data-academy='location']", s.location_text);
    setText("[data-academy='contact_email']", s.contact_email);
    setText("[data-academy='contact_phone']", s.contact_phone || "—");
    setText("[data-academy='contact_hours']", s.contact_hours);
    setText("[data-academy='footer_copyright']", s.footer_copyright);

    setText("[data-academy='hero_h1']", s.hero_heading_1);
    setText("[data-academy='hero_highlight']", s.hero_heading_highlight);
    setText("[data-academy='hero_h2']", s.hero_heading_2);
    setText("[data-academy='hero_desc']", s.hero_description);
    setText("[data-academy='about_snippet']", s.about_snippet);

    document.querySelectorAll("[data-academy='logo']").forEach((img) => {
      if (s.logo_url) img.setAttribute("src", s.logo_url);
      const fullName = `${s.brand_name_ar} ${s.brand_subtitle_ar}`.trim();
      img.setAttribute("alt", `شعار ${fullName}`);
    });

    const heroMedia = document.querySelector("[data-academy='hero_image']");
    if (heroMedia && s.hero_image_url) {
      heroMedia.style.backgroundImage = `linear-gradient(90deg,rgba(0,0,0,.08),rgba(0,0,0,.38)),linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.28)),url('${s.hero_image_url.replace(/'/g, "%27")}')`;
      heroMedia.style.backgroundSize = "cover";
      heroMedia.style.backgroundPosition = "center";
    }

    toggleNavItem("store", s.show_store);
    toggleNavItem("media", s.show_media);
    toggleNavItem("news", s.show_news);
    toggleNavItem("track_join", s.nav_show_track_join);
    toggleNavItem("track_store", s.nav_show_track_store);
    toggleNavItem("admin_login", s.nav_show_admin_login);

    toggleSection("store", s.show_store);
    toggleSection("media", s.show_media);
    toggleSection("news", s.show_news);

    if (s.contact_email) {
      document.querySelectorAll("[data-academy='contact_email_link']").forEach((a) => {
        a.href = `mailto:${s.contact_email}`;
        a.textContent = s.contact_email;
      });
    }
    document.querySelectorAll("[data-academy='contact_phone_link']").forEach((a) => {
      if (s.contact_phone) {
        a.href = `tel:${s.contact_phone.replace(/\s/g, "")}`;
        a.textContent = s.contact_phone;
        a.style.display = "";
      } else {
        a.removeAttribute("href");
        a.textContent = "—";
      }
    });
    document.querySelectorAll("[data-academy='whatsapp']").forEach((a) => {
      if (s.whatsapp_url) {
        a.href = s.whatsapp_url;
        a.style.display = "";
      } else {
        a.style.display = "none";
      }
    });
    document.querySelectorAll("[data-academy='instagram']").forEach((a) => {
      if (s.instagram_url) {
        a.href = s.instagram_url;
        a.style.display = "";
      } else {
        a.style.display = "none";
      }
    });

    if (typeof applySiteSeo === "function") {
      applySiteSeo();
    }

    document.dispatchEvent(new CustomEvent("academy-settings-applied", { detail: s }));
  }

  async function initAcademySettingsOnSite() {
    const s = await loadAcademySettings();
    applyAcademySettingsToSite(s);
    return s;
  }

  window.ACADEMY_SETTINGS_DEFAULTS = DEFAULTS;
  window.loadAcademySettings = loadAcademySettings;
  window.saveAcademySettings = saveAcademySettings;
  window.applyAcademySettingsToSite = applyAcademySettingsToSite;
  window.initAcademySettingsOnSite = initAcademySettingsOnSite;
  window.mergeAcademySettings = mergeSettings;
})();
