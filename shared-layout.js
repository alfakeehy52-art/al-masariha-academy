document.addEventListener("DOMContentLoaded", () => {
  const page = window.location.pathname.split("/").pop() || "index.html";

  if (typeof applySiteSeo === "function") {
    applySiteSeo(page);
  }

  if (!document.getElementById("site-header-balance-fix")) {
    const style = document.createElement("style");
    style.id = "site-header-balance-fix";
    style.textContent = `
      @media (min-width: 981px) {
        .site-topbar{ overflow: visible !important; }

        .site-nav{
          grid-template-columns: auto minmax(0,1fr) auto !important;
          align-items: center !important;
          gap: 14px !important;
          padding: 10px 0 !important;
          min-height: 88px !important;
        }

        .site-brand{ gap: 10px !important; }

        .site-brand-logo{
          width: 62px !important;
          height: 62px !important;
          min-width: 62px !important;
          min-height: 62px !important;
        }

        .site-brand-text strong{
          font-size: 22px !important;
          line-height: 1 !important;
        }

        .site-brand-text span{
          font-size: 16px !important;
          line-height: 1 !important;
        }

        .site-actions{
          gap: 8px !important;
        }

        .site-btn{
          padding: 11px 16px !important;
          font-size: 13px !important;
          border-radius: 14px !important;
          white-space: nowrap !important;
        }

        .site-btn-track{
          padding: 9px 12px !important;
          font-size: 11px !important;
        }

        .site-menu-shell{
          display: flex !important;
          justify-content: center !important;
          width: 100% !important;
          min-width: 0 !important;
        }

        .site-menu{
          display: flex !important;
          flex-wrap: nowrap !important;
          justify-content: center !important;
          align-items: center !important;
          gap: 4px !important;
          width: 100% !important;
          min-width: 0 !important;
          overflow: hidden !important;
          white-space: nowrap !important;
        }

        .site-menu a{
          flex: 0 1 auto !important;
          min-width: 0 !important;
          padding: 12px 10px !important;
          font-size: 15px !important;
          font-weight: 900 !important;
          border-radius: 12px !important;
          line-height: 1.2 !important;
        }

        .site-menu a.active::after{
          right: 10px !important;
          left: 10px !important;
          bottom: 5px !important;
        }
      }

      @media (max-width: 980px) {
        .site-menu a{
          font-size: 16px !important;
          padding: 14px 12px !important;
        }
      }

      .featured-player,
      .featured-player-card,
      .star-player-card,
      .week-star-card,
      .featured-star-card,
      .player-spotlight,
      .home-featured-player{
        overflow: visible !important;
      }

      .featured-player h2,
      .featured-player h3,
      .featured-player h4,
      .featured-player-card h2,
      .featured-player-card h3,
      .featured-player-card h4,
      .star-player-card h2,
      .star-player-card h3,
      .star-player-card h4,
      .week-star-card h2,
      .week-star-card h3,
      .week-star-card h4,
      .featured-star-card h2,
      .featured-star-card h3,
      .featured-star-card h4,
      .player-spotlight h2,
      .player-spotlight h3,
      .player-spotlight h4,
      .home-featured-player h2,
      .home-featured-player h3,
      .home-featured-player h4{
        white-space: normal !important;
        overflow: visible !important;
        text-overflow: unset !important;
        line-height: 1.25 !important;
        overflow-wrap: anywhere !important;
        word-break: normal !important;
      }

      .featured-player *,
      .featured-player-card *,
      .star-player-card *,
      .week-star-card *,
      .featured-star-card *,
      .player-spotlight *,
      .home-featured-player *{
        max-width: 100%;
      }
    `;
    document.head.appendChild(style);
  }

  const headerTemplate = `
<header class="site-topbar">
  <div class="site-topbar-glow"></div>

  <div class="site-wrap site-nav">

    <div class="site-brand-shell">
      <div class="site-brand">
        <div class="site-brand-logo">
          <img data-academy="logo" src="academy-logo.svg" alt="شعار الأكاديمية" width="62" height="62">
        </div>
        <div class="site-brand-text">
          <strong data-academy="brand_name">أكاديمية المسارحة</strong>
          <span data-academy="brand_subtitle">لكرة القدم</span>
        </div>
      </div>
    </div>

    <div class="site-mobile-controls">
      <button class="site-menu-toggle" type="button" aria-label="فتح القائمة" aria-expanded="false">
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>

    <nav class="site-menu-shell">
      <nav class="site-menu">
        <a href="index.html" data-page="index.html">الرئيسية</a>
        <a href="al_masariha_about_page.html" data-page="al_masariha_about_page.html">من نحن</a>
        <a href="al_masariha_players_page.html" data-page="al_masariha_players_page.html">اللاعبون</a>
        <a href="al_masariha_coaches_page.html" data-page="al_masariha_coaches_page.html">المدربون</a>
        <a href="al_masariha_teams_page.html" data-page="al_masariha_teams_page.html">الفرق</a>
        <a href="al_masariha_matches_page.html" data-page="al_masariha_matches_page.html">المباريات</a>
        <a href="al_masariha_media_page.html" data-page="al_masariha_media_page.html" data-nav-item="media">الإعلام</a>
        <a href="al_masariha_store_page.html" data-page="al_masariha_store_page.html" data-nav-item="store">المتجر</a>
        <a href="al_masariha_news_page.html" data-page="al_masariha_news_page.html" data-nav-item="news">الأخبار</a>
        <a href="al_masariha_contact_page.html" data-page="al_masariha_contact_page.html">تواصل</a>
      </nav>

      <div class="site-actions site-actions-mobile">
        <a class="site-btn site-btn-track" href="request_status.html" data-page="request_status.html" data-nav-item="track_join">متابعة انضمام</a>
        <a class="site-btn site-btn-track" href="store_order_status.html" data-page="store_order_status.html" data-nav-item="track_store">متابعة متجر</a>
        <a class="site-btn site-btn-gold" href="al_masariha_join_page.html">انضم إلينا</a>
        <a class="site-btn site-btn-dark" href="admin_login.html" data-nav-item="admin_login">دخول الإدارة</a>
      </div>
    </nav>

    <div class="site-actions-shell">
      <div class="site-actions">
        <a class="site-btn site-btn-track" href="request_status.html" data-page="request_status.html" data-nav-item="track_join" title="رقم مرجع REQ-…">متابعة انضمام</a>
        <a class="site-btn site-btn-track" href="store_order_status.html" data-page="store_order_status.html" data-nav-item="track_store" title="رقم مرجع ORD-…">متابعة متجر</a>
        <a class="site-btn site-btn-gold" href="al_masariha_join_page.html">انضم إلينا</a>
        <a class="site-btn site-btn-dark" href="admin_login.html" data-nav-item="admin_login">دخول الإدارة</a>
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

  document.querySelectorAll(".site-menu a").forEach(link => {
    if (link.getAttribute("data-page") === page) {
      link.classList.add("active");
    }
  });

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
