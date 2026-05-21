document.addEventListener("DOMContentLoaded", () => {
  const page = window.location.pathname.split("/").pop() || "index.html";

  if (typeof applySiteSeo === "function") {
    applySiteSeo(page);
  }

  const headerTemplate = `
<header class="site-topbar">
  <div class="site-topbar-glow"></div>

  <div class="site-wrap site-nav">

    <div class="site-brand-shell">
      <a class="site-brand" href="index.html" aria-label="الرئيسية">
        <div class="site-brand-logo">
          <img data-academy="logo" src="academy-logo.svg" alt="" width="56" height="56">
        </div>
        <div class="site-brand-text">
          <strong data-academy="brand_name">أكاديمية المسارحة</strong>
          <span data-academy="brand_subtitle">لكرة القدم</span>
        </div>
      </a>
    </div>

    <div class="site-mobile-controls">
      <button class="site-menu-toggle" type="button" aria-label="فتح القائمة" aria-expanded="false">
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>

    <nav class="site-menu-shell">
      <nav class="site-menu" aria-label="التنقل الرئيسي">
        <a href="index.html" data-page="index.html">الرئيسية</a>
        <a href="al_masariha_players_page.html" data-page="al_masariha_players_page.html">اللاعبون</a>
        <a href="al_masariha_coaches_page.html" data-page="al_masariha_coaches_page.html">المدربون</a>
        <a href="al_masariha_teams_page.html" data-page="al_masariha_teams_page.html">الفرق</a>
        <a href="al_masariha_matches_page.html" data-page="al_masariha_matches_page.html">المباريات</a>
        <details class="site-nav-dropdown" data-nav-group="more">
          <summary>المزيد</summary>
          <div class="site-nav-dropdown-panel">
            <a href="al_masariha_about_page.html" data-page="al_masariha_about_page.html">من نحن</a>
            <a href="al_masariha_media_page.html" data-page="al_masariha_media_page.html" data-nav-item="media">الإعلام</a>
            <a href="al_masariha_store_page.html" data-page="al_masariha_store_page.html" data-nav-item="store">المتجر</a>
            <a href="al_masariha_news_page.html" data-page="al_masariha_news_page.html" data-nav-item="news">الأخبار</a>
            <a href="al_masariha_stats_page.html" data-page="al_masariha_stats_page.html">الإحصائيات</a>
            <a href="al_masariha_contact_page.html" data-page="al_masariha_contact_page.html">تواصل</a>
            <a href="admin_login.html" data-nav-item="admin_login" class="site-nav-admin">دخول الإدارة</a>
          </div>
        </details>
      </nav>

      <div class="site-actions site-actions-mobile">
        <a class="site-btn site-btn-track" href="request_status.html" data-page="request_status.html" data-nav-item="track_join">متابعة انضمام</a>
        <a class="site-btn site-btn-track" href="store_order_status.html" data-page="store_order_status.html" data-nav-item="track_store">متابعة متجر</a>
        <a class="site-btn site-btn-admin" href="admin_login.html" data-page="admin_login.html" data-nav-item="admin_login">دخول الإدارة</a>
      </div>
    </nav>

    <div class="site-actions-shell">
      <div class="site-actions">
        <details class="site-nav-dropdown site-nav-dropdown--action" data-nav-group="track">
          <summary class="site-btn site-btn-track">متابعة طلبك</summary>
          <div class="site-nav-dropdown-panel site-nav-dropdown-panel--action">
            <a href="request_status.html" data-page="request_status.html" data-nav-item="track_join">طلب انضمام</a>
            <a href="store_order_status.html" data-page="store_order_status.html" data-nav-item="track_store">طلب متجر</a>
          </div>
        </details>
        <a class="site-btn site-btn-admin" href="admin_login.html" data-page="admin_login.html" data-nav-item="admin_login">دخول الإدارة</a>
      </div>
    </div>

  </div>
</header>
`;

  const footerTemplate = `
<footer class="site-footer">
  <div class="site-wrap site-footer-grid">

    <div>
      <div class="site-footer-title"><span data-academy="brand_name">أكاديمية المسارحة</span> <span data-academy="brand_subtitle">لكرة القدم</span></div>
      <p class="site-footer-text" data-academy="tagline">نطوّر المواهب ونصنع مستقبل اللاعبين</p>
    </div>

    <div>
      <div class="site-footer-title">روابط سريعة</div>
      <div class="site-footer-links">
        <a href="index.html">الرئيسية</a>
        <a href="al_masariha_about_page.html">من نحن</a>
        <a href="al_masariha_players_page.html">اللاعبون</a>
        <a href="al_masariha_coaches_page.html">المدربون</a>
        <a href="al_masariha_teams_page.html">الفرق</a>
        <a href="al_masariha_matches_page.html">المباريات</a>
        <a href="al_masariha_media_page.html" data-nav-item="media">الإعلام</a>
        <a href="al_masariha_store_page.html" data-nav-item="store">المتجر</a>
        <a href="al_masariha_news_page.html" data-nav-item="news">الأخبار</a>
        <a href="al_masariha_join_page.html">انضم إلينا</a>
        <a href="al_masariha_contact_page.html">تواصل معنا</a>
      </div>
    </div>

    <div>
      <div class="site-footer-title">متابعة الطلبات</div>
      <div class="site-footer-links">
        <a href="request_status.html">طلب انضمام (REQ-…)</a>
        <a href="store_order_status.html">طلب متجر (ORD-…)</a>
        <a href="request_completion.html">استكمال مرفقات</a>
      </div>
    </div>

    <div>
      <div class="site-footer-title">تواصل</div>
      <p class="site-footer-text" data-academy="location">المسارحة - السعودية</p>
      <p class="site-footer-text"><a data-academy="contact_email_link" href="mailto:info@masariha-academy.com">info@masariha-academy.com</a></p>
    </div>

  </div>

  <div class="site-wrap site-copy" data-academy="footer_copyright">
    © أكاديمية المسارحة لكرة القدم - جميع الحقوق محفوظة
  </div>
</footer>
`;

  const headerSlot = document.getElementById("site-header");
  const footerSlot = document.getElementById("site-footer");

  if (headerSlot) headerSlot.innerHTML = headerTemplate;
  if (footerSlot) footerSlot.innerHTML = footerTemplate;

  const morePages = [
    "al_masariha_about_page.html",
    "al_masariha_media_page.html",
    "al_masariha_store_page.html",
    "al_masariha_news_page.html",
    "al_masariha_stats_page.html",
    "al_masariha_contact_page.html",
    "admin_login.html"
  ];
  const trackPages = ["request_status.html", "store_order_status.html", "request_completion.html"];

  document.querySelectorAll(".site-menu a, .site-nav-dropdown-panel a").forEach((link) => {
    if (link.getAttribute("data-page") === page) {
      link.classList.add("active");
    }
  });

  if (page === "admin_login.html") {
    const adminBtn = document.querySelector('[data-page="admin_login.html"]');
    if (adminBtn) adminBtn.classList.add("active");
  }

  if (morePages.indexOf(page) !== -1) {
    const more = document.querySelector('.site-nav-dropdown[data-nav-group="more"]');
    if (more) more.classList.add("active");
  }

  if (trackPages.indexOf(page) !== -1) {
    const track = document.querySelector('.site-nav-dropdown[data-nav-group="track"]');
    if (track) track.classList.add("active");
  }

  function initSiteNavDropdowns() {
    document.querySelectorAll(".site-nav-dropdown").forEach((dropdown) => {
      const summary = dropdown.querySelector(":scope > summary");
      if (!summary) return;

      summary.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const willOpen = !dropdown.open;
        document.querySelectorAll(".site-nav-dropdown").forEach((d) => {
          d.open = false;
        });
        dropdown.open = willOpen;
      });
    });

    document.addEventListener("click", (e) => {
      if (e.target.closest(".site-nav-dropdown")) return;
      document.querySelectorAll(".site-nav-dropdown").forEach((d) => {
        d.open = false;
      });
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        document.querySelectorAll(".site-nav-dropdown").forEach((d) => {
          d.open = false;
        });
      }
    });
  }

  initSiteNavDropdowns();

  const toggle = document.querySelector(".site-menu-toggle");
  const menuShell = document.querySelector(".site-menu-shell");

  if (toggle && menuShell) {
    toggle.addEventListener("click", () => {
      const isOpen = toggle.classList.toggle("is-open");
      menuShell.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }

  function loadScriptOnce(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        if (existing.dataset.loaded === "1") return resolve();
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () => reject(new Error(src)));
        return;
      }
      const el = document.createElement("script");
      el.src = src;
      el.onload = () => {
        el.dataset.loaded = "1";
        resolve();
      };
      el.onerror = () => reject(new Error("Failed: " + src));
      document.head.appendChild(el);
    });
  }

  async function bootstrapAcademySettings() {
    if (!document.getElementById("site-header") && !document.getElementById("site-footer")) return;
    try {
      if (!window.supabase) {
        await loadScriptOnce("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2");
      }
      if (!window.SUPABASE_CONFIG) await loadScriptOnce("supabase-config.js");
      if (!window.createSupabaseClient) await loadScriptOnce("js/supabase-client.js");
      if (!window.initAcademySettingsOnSite) await loadScriptOnce("js/academy-settings.js");
      await initAcademySettingsOnSite();
    } catch (err) {
      console.warn("[shared-layout] academy settings:", err);
      if (typeof applyAcademySettingsToSite === "function") {
        applyAcademySettingsToSite();
      }
    }
  }

  bootstrapAcademySettings();
});
