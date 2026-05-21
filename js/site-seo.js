/**
 * SEO أساسي: عنوان، وصف، Open Graph، Twitter Card، canonical.
 * يُستدعى تلقائياً عند التحميل، أو عبر applySiteSeo(page) من shared-layout.
 */
(function () {
  const SITE = {
    brand: "أكاديمية المسارحة لكرة القدم",
    defaultDescription:
      "أكاديمية المسارحة لكرة القدم في السعودية — تسجيل لاعبين، فرق، مباريات، متجر، وأخبار من قاعدة بيانات حية.",
    locale: "ar_SA",
    image: "academy-logo.svg",
    twitter: "@masariha_academy"
  };

  const PAGE_SEO = {
    "index.html": {
      title: "أكاديمية المسارحة لكرة القدم | الرئيسية",
      description:
        "انضم للأكاديمية، تابع اللاعبين والمدربين والمباريات والمتجر — بيانات حية من Supabase."
    },
    "al_masariha_about_page.html": {
      title: "من نحن | أكاديمية المسارحة",
      description: "تعرف على رؤية أكاديمية المسارحة لكرة القدم وبرامجها التدريبية."
    },
    "al_masariha_join_page.html": {
      title: "طلب الانضمام | أكاديمية المسارحة",
      description:
        "قدّم طلب انضمام كلاعب أو ولي أمر أو كادر، واحتفظ برقم المرجع REQ- للمتابعة."
    },
    "al_masariha_players_page.html": {
      title: "اللاعبون | أكاديمية المسارحة",
      description: "قائمة لاعبي الأكاديمية المعتمدين مع بحث وتصفية وملف عام لكل لاعب."
    },
    "al_masariha_player_profile_public.html": {
      title: "ملف لاعب | أكاديمية المسارحة",
      description: "الملف العام للاعب في أكاديمية المسارحة لكرة القدم."
    },
    "al_masariha_player_profile.html": {
      title: "ملف لاعب | أكاديمية المسارحة",
      description: "بيانات اللاعب في أكاديمية المسارحة."
    },
    "al_masariha_coaches_page.html": {
      title: "المدربون | أكاديمية المسارحة",
      description: "الجهاز الفني والمدربون النشطون في الأكاديمية."
    },
    "al_masariha_coach_profile.html": {
      title: "ملف مدرب | أكاديمية المسارحة",
      description: "الملف العام للمدرب في أكاديمية المسارحة."
    },
    "al_masariha_teams_page.html": {
      title: "الفرق والفئات | أكاديمية المسارحة",
      description: "فرق الأكاديمية النشطة وعدد اللاعبين في كل فريق."
    },
    "al_masariha_matches_page.html": {
      title: "المباريات | أكاديمية المسارحة",
      description: "جدول المباريات القادمة والمنتهية مع تفاصيل كل مباراة."
    },
    "al_masariha_match_details.html": {
      title: "تفاصيل المباراة | أكاديمية المسارحة",
      description: "تفاصيل مباراة الأكاديمية — النتيجة والإحصائيات."
    },
    "al_masariha_news_page.html": {
      title: "الأخبار | أكاديمية المسارحة",
      description: "أخبار الأكاديمية المنشورة من لوحة الإدارة."
    },
    "al_masariha_media_page.html": {
      title: "الإعلام | أكاديمية المسارحة",
      description: "صور وفيديوهات الأكاديمية من قاعدة البيانات."
    },
    "al_masariha_stats_page.html": {
      title: "الإحصائيات | أكاديمية المسارحة",
      description: "ترتيب الهدافين وأرقام الموسم من بيانات اللاعبين والمباريات."
    },
    "al_masariha_store_page.html": {
      title: "متجر الأكاديمية | أكاديمية المسارحة",
      description:
        "منتجات منشورة من الأكاديمية — اطلب الآن وتابع طلبك برقم ORD- والجوال."
    },
    "store_order_status.html": {
      title: "متابعة طلب المتجر | أكاديمية المسارحة",
      description: "متابعة طلب متجر الأكاديمية برقم المرجع ORD- ورقم الجوال."
    },
    "al_masariha_contact_page.html": {
      title: "تواصل معنا | أكاديمية المسارحة",
      description: "أرسل رسالة للإدارة واحتفظ برقم المرجع MSG- للمتابعة."
    },
    "al_masariha_memberships_page.html": {
      title: "العضويات | أكاديمية المسارحة",
      description: "خطط العضوية في أكاديمية المسارحة لكرة القدم."
    },
    "al_masariha_supporters_page.html": {
      title: "الداعمون | أكاديمية المسارحة",
      description: "داعمو الأكاديمية وبرامج الرعاية."
    },
    "al_masariha_supporter_profile.html": {
      title: "ملف داعم | أكاديمية المسارحة",
      description: "ملف الداعم في أكاديمية المسارحة."
    },
    "al_masariha_admin_page.html": {
      title: "عن الإدارة | أكاديمية المسارحة",
      description: "هيكل الإدارة والتشغيل في أكاديمية المسارحة.",
      robots: "noindex, follow"
    },
    "request_status.html": {
      title: "متابعة طلب الانضمام | أكاديمية المسارحة",
      description: "ابحث عن طلبك برقم المرجع REQ- ورقم الجوال."
    },
    "request_completion.html": {
      title: "استكمال المرفقات | أكاديمية المسارحة",
      description: "رفع المرفقات المطلوبة لطلب الانضمام أو الاستكمال.",
      robots: "noindex, follow"
    },
    "admin_login.html": {
      title: "دخول الإدارة | أكاديمية المسارحة",
      robots: "noindex, nofollow"
    },
    "staff_login.html": {
      title: "دخول الكادر | أكاديمية المسارحة",
      robots: "noindex, nofollow"
    }
  };

  function upsertMeta(attr, key, content) {
    if (!content) return;
    let el = document.querySelector(`meta[${attr}="${key}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  }

  function upsertLink(rel, href) {
    if (!href) return;
    let el = document.querySelector(`link[rel="${rel}"]`);
    if (!el) {
      el = document.createElement("link");
      el.setAttribute("rel", rel);
      document.head.appendChild(el);
    }
    el.setAttribute("href", href);
  }

  function normalizePageKey(page) {
    let file = (page || window.location.pathname.split("/").pop() || "index.html").split("?")[0];
    if (!file || file === "/") return "index.html";
    if (!file.includes(".")) file += ".html";
    return file;
  }

  function applySiteSeo(page) {
    const file = normalizePageKey(page);
    const cfg = PAGE_SEO[file] || {};
    const settings = window.ACADEMY_SETTINGS || {};
    const brandBase = [settings.brand_name_ar, settings.brand_subtitle_ar].filter(Boolean).join(" ").trim();
    const dynamicBrand = brandBase || SITE.brand;
    const title = cfg.title || dynamicBrand;
    const description = cfg.description || SITE.defaultDescription;
    const robots = cfg.robots || "index, follow";
    const configuredBase = (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.siteUrl) || "";
    const pathForCanonical = window.location.pathname.replace(/\/+$/, "") || "/";
    const canonical = configuredBase
      ? configuredBase.replace(/\/+$/, "") + pathForCanonical
      : window.location.origin + pathForCanonical;
    const image = new URL(cfg.image || SITE.image, window.location.href).href;

    document.title = title;
    document.documentElement.setAttribute("lang", "ar");

    upsertMeta("name", "description", description);
    upsertMeta("name", "robots", robots);
    upsertMeta("name", "twitter:card", "summary");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", image);

    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:site_name", dynamicBrand);
    if (settings.twitter_handle) {
      upsertMeta("name", "twitter:site", settings.twitter_handle);
    }
    upsertMeta("property", "og:locale", SITE.locale);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", canonical);
    upsertMeta("property", "og:image", image);

    upsertLink("canonical", canonical);
    upsertLink("icon", SITE.image);
  }

  window.applySiteSeo = applySiteSeo;

  document.addEventListener("DOMContentLoaded", () => {
    applySiteSeo();
  });
})();
