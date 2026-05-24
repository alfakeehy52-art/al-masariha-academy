function ensureSiteInnerCss() {
  if (document.querySelector('link[data-site-inner="true"]')) return;
  if (!document.getElementById("site-header")) return;
  const page = (window.location.pathname.split("/").pop() || "index.html").split("?")[0];
  if (page === "index.html") return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "site-inner.css";
  link.setAttribute("data-site-inner", "true");
  document.head.appendChild(link);
}

function applyBrandCacheEarlyInline() {
  try {
    const cache = JSON.parse(localStorage.getItem("academy_brand_cache_v1") || "null");
    if (!cache || !cache.logo_url) return;
    document.querySelectorAll('[data-academy="logo"]').forEach((img) => {
      img.setAttribute("src", cache.logo_url);
      img.classList.add("logo-loaded");
    });
    if (cache.brand_name_ar) {
      document.querySelectorAll('[data-academy="brand_name"]').forEach((el) => {
        el.textContent = cache.brand_name_ar;
      });
    }
    if (cache.brand_subtitle_ar) {
      document.querySelectorAll('[data-academy="brand_subtitle"]').forEach((el) => {
        el.textContent = cache.brand_subtitle_ar;
      });
    }
  } catch (e) {}
}

document.addEventListener("DOMContentLoaded", () => {
  const page = window.location.pathname.split("/").pop() || "index.html";

  ensureSiteInnerCss();

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

    <div class="site-footer-social-block">
      <div class="site-footer-title">تابعنا</div>
      <div class="site-social-icons" role="group" aria-label="شبكات التواصل — قريباً">
        <button type="button" class="site-social-btn" data-social="whatsapp" aria-label="واتساب — قريباً" title="واتساب — قريباً"><span class="site-social-ico">💬</span><span class="site-social-soon">قريباً</span></button>
        <button type="button" class="site-social-btn" data-social="instagram" aria-label="إنستغرام — قريباً" title="إنستغرام — قريباً"><span class="site-social-ico">📷</span><span class="site-social-soon">قريباً</span></button>
        <button type="button" class="site-social-btn" data-social="twitter" aria-label="X — قريباً" title="X — قريباً"><span class="site-social-ico">𝕏</span><span class="site-social-soon">قريباً</span></button>
        <button type="button" class="site-social-btn" data-social="tiktok" aria-label="تيك توك — قريباً" title="تيك توك — قريباً"><span class="site-social-ico">🎵</span><span class="site-social-soon">قريباً</span></button>
        <button type="button" class="site-social-btn" data-social="snapchat" aria-label="سناب شات — قريباً" title="سناب شات — قريباً"><span class="site-social-ico">👻</span><span class="site-social-soon">قريباً</span></button>
      </div>
      <p class="site-social-hint">حسابات التواصل الرسمية قيد التفعيل — ستُربط هنا بعد اعتماد الشراكة.</p>
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

  applyBrandCacheEarlyInline();
  if (typeof applyBrandCacheEarly === "function") applyBrandCacheEarly();

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
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menuShell.classList.contains("is-open")) {
        toggle.classList.remove("is-open");
        menuShell.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("click", (e) => {
      if (!menuShell.classList.contains("is-open")) return;
      if (e.target.closest(".site-menu-shell") || e.target.closest(".site-menu-toggle")) return;
      toggle.classList.remove("is-open");
      menuShell.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
    menuShell.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        toggle.classList.remove("is-open");
        menuShell.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  function initSocialComingSoon() {
    let toastEl = document.getElementById("siteSocialToast");
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.id = "siteSocialToast";
      toastEl.className = "site-social-toast";
      toastEl.setAttribute("role", "status");
      toastEl.setAttribute("aria-live", "polite");
      document.body.appendChild(toastEl);
    }
    document.querySelectorAll(".site-social-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        toastEl.textContent = "قريباً — حسابات التواصل الرسمية ستظهر هنا بعد اعتماد الشراكة.";
        toastEl.classList.add("show");
        clearTimeout(initSocialComingSoon._t);
        initSocialComingSoon._t = setTimeout(() => toastEl.classList.remove("show"), 3200);
      });
    });
  }
  initSocialComingSoon();

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
      if (!window.applyBrandCacheEarly) await loadScriptOnce("js/academy-settings.js");
      if (typeof applyBrandCacheEarly === "function") applyBrandCacheEarly();
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
