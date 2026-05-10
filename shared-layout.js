document.addEventListener("DOMContentLoaded", () => {
  const page = window.location.pathname.split("/").pop() || "index.html";

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
          <img src="academy-logo.png" alt="شعار الأكاديمية">
        </div>
        <div class="site-brand-text">
          <strong>أكاديمية المسارحة</strong>
          <span>لكرة القدم</span>
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
        <a href="al_masariha_matches_page.html" data-page="al_masariha_matches_page.html">المباريات</a>
        <a href="al_masariha_media_page.html" data-page="al_masariha_media_page.html">الإعلام</a>
        <a href="al_masariha_store_page.html" data-page="al_masariha_store_page.html">المتجر</a>
        <a href="al_masariha_news_page.html" data-page="al_masariha_news_page.html">الأخبار</a>
        <a href="al_masariha_contact_page.html" data-page="al_masariha_contact_page.html">تواصل</a>
      </nav>

      <div class="site-actions site-actions-mobile">
        <a class="site-btn site-btn-gold" href="al_masariha_join_page.html">انضم إلينا</a>
        <a class="site-btn site-btn-dark" href="admin/admin_login.html">دخول الإدارة</a>
      </div>
    </nav>

    <div class="site-actions-shell">
      <div class="site-actions">
        <a class="site-btn site-btn-gold" href="al_masariha_join_page.html">انضم إلينا</a>
        <a class="site-btn site-btn-dark" href="admin/admin_login.html">دخول الإدارة</a>
      </div>
    </div>

  </div>
</header>
`;

  const footerTemplate = `
<footer class="site-footer">
  <div class="site-wrap site-footer-grid">

    <div>
      <div class="site-footer-title">أكاديمية المسارحة لكرة القدم</div>
      <p class="site-footer-text">نطوّر المواهب ونصنع مستقبل اللاعبين</p>
    </div>

    <div>
      <div class="site-footer-title">روابط سريعة</div>
      <div class="site-footer-links">
        <a href="index.html">الرئيسية</a>
        <a href="al_masariha_about_page.html">من نحن</a>
        <a href="al_masariha_players_page.html">اللاعبون</a>
        <a href="al_masariha_matches_page.html">المباريات</a>
        <a href="al_masariha_media_page.html">الإعلام</a>
        <a href="al_masariha_store_page.html">المتجر</a>
        <a href="al_masariha_news_page.html">الأخبار</a>
        <a href="al_masariha_join_page.html">انضم إلينا</a>
        <a href="al_masariha_contact_page.html">تواصل معنا</a>
      </div>
    </div>

    <div>
      <div class="site-footer-title">تواصل</div>
      <p class="site-footer-text">المسارحة - السعودية</p>
      <p class="site-footer-text">info@masariha-academy.com</p>
    </div>

  </div>

  <div class="site-wrap site-copy">
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
});
