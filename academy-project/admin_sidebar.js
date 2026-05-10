document.addEventListener("DOMContentLoaded", () => {
  const current = (window.location.pathname.split("/").pop() || "admin_dashboard.html").toLowerCase();

  const groups = [
    {
      title: "الرئيسية",
      items: [
        { href: "admin_dashboard.html", label: "لوحة الإدارة", icon: "🏠", match: ["admin_dashboard.html"] }
      ]
    },
    {
      title: "المراكز الرئيسية",
      items: [
        { href: "admin_members_dashboard.html", label: "الأعضاء والمنتسبون", icon: "👥", match: [
          "admin_members_dashboard.html",
          "players_list_dashboard.html",
          "players_add_dashboard.html",
          "edit_player_dashboard.html",
          "player_view_dashboard.html",
          "coaches_dashboard.html",
          "coaches_add_dashboard.html",
          "coach_view_dashboard.html",
          "guardians_dashboard.html",
          "supporters_dashboard.html",
          "volunteers_dashboard.html"
        ] },
        { href: "admin_requests_dashboard.html", label: "إدارة الطلبات", icon: "📥", match: [
          "admin_requests_dashboard.html",
          "admin_requests.html",
          "players_requests.html",
          "guardians_requests.html",
          "coaches_requests.html",
          "supporters_requests.html",
          "volunteers_requests.html"
        ] }
      ]
    },
    {
      title: "التشغيل الرياضي",
      items: [
        { href: "teams_categories_dashboard.html", label: "الفرق والفئات", icon: "🏟️", match: ["teams_categories_dashboard.html"] },
        { href: "stats_dashboard.html", label: "الإحصائيات", icon: "📊", match: ["stats_dashboard.html"] }
      ]
    },
    {
      title: "التجارة والمحتوى",
      items: [
        { href: "store_products_dashboard.html", label: "إدارة المتجر", icon: "🛒", match: ["store_products_dashboard.html"] }
      ]
    },
    {
      title: "النظام",
      items: [
        { href: "academy_settings_dashboard.html", label: "الإعدادات", icon: "⚙️", match: ["academy_settings_dashboard.html"] }
      ]
    }
  ];

  function isActive(item){
    return (item.match || [item.href]).map(v => v.toLowerCase()).includes(current);
  }

  function ensureThemeLink(){
    if(document.querySelector('link[data-admin-theme="true"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'admin_theme.css';
    link.setAttribute('data-admin-theme','true');
    document.head.appendChild(link);
  }

  function menuHtml() {
    return `
      <nav class="menu admin-pro-menu" aria-label="القائمة الجانبية للإدارة">
        ${groups.map(group => `
          <section class="menu-group">
            <div class="menu-group-title">${group.title}</div>
            <div class="menu-group-links">
              ${group.items.map(item => `
                <a href="${item.href}" class="${isActive(item) ? "active" : ""}">
                  <span class="nav-icon">${item.icon}</span>
                  <span class="nav-label">${item.label}</span>
                  <span class="nav-arrow">‹</span>
                </a>
              `).join("")}
            </div>
          </section>
        `).join("")}
        <div class="menu-bottom-actions">
          <a href="../index.html" class="site-link"><span class="nav-icon">🌐</span><span class="nav-label">العودة إلى الموقع</span><span class="nav-arrow">‹</span></a>
          <a href="admin_login.html" onclick="adminLogout(); return false;" class="logout-link"><span class="nav-icon">⏻</span><span class="nav-label">تسجيل خروج</span><span class="nav-arrow">‹</span></a>
        </div>
      </nav>
    `;
  }

  function defaultBrand() {
    return `
      <div class="brand">
        <div class="brand-badge">لوحة الإدارة</div>
        <h1>أكاديمية كرة القدم</h1>
        <p>نظام إداري منظم لإدارة الطلبات والعضويات والبيانات.</p>
      </div>
    `;
  }

  ensureThemeLink();

  if (!document.getElementById("admin-sidebar-unified-style")) {
    const style = document.createElement("style");
    style.id = "admin-sidebar-unified-style";
    style.textContent = `
      .admin-sidebar-unified,
      .admin-sidebar-fallback{
        background:linear-gradient(180deg, rgba(213,177,90,.10), rgba(255,255,255,.02));
        border-left:1px solid rgba(255,255,255,.08);
        box-sizing:border-box;
        display:flex;
        flex-direction:column;
        gap:18px;
      }
      .admin-sidebar-unified{padding:20px 16px;position:sticky;top:0;height:100vh;overflow:hidden;width:318px;min-width:318px;}
      .admin-sidebar-fallback{position:fixed;top:0;right:0;width:318px;height:100vh;z-index:999;padding:20px 16px;overflow:hidden;}
      body.has-unified-admin-sidebar{padding-right:338px;}
      .admin-sidebar-unified .brand,
      .admin-sidebar-fallback .brand{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:22px;padding:18px;box-shadow:0 18px 45px rgba(0,0,0,.22);margin-bottom:0;flex-shrink:0;}
      .admin-sidebar-unified .brand-badge,
      .admin-sidebar-fallback .brand-badge{display:inline-flex;align-items:center;justify-content:center;min-height:28px;padding:0 12px;border-radius:999px;background:rgba(213,177,90,.10);border:1px solid rgba(213,177,90,.22);color:#f0d58f;font-size:12px;font-weight:900;margin-bottom:10px;}
      .admin-sidebar-unified .brand h1,
      .admin-sidebar-fallback .brand h1{margin:0;font-size:26px;color:#f5d46b;font-weight:900;line-height:1.3;}
      .admin-sidebar-unified .brand p,
      .admin-sidebar-fallback .brand p{margin:8px 0 0;color:#c3d0c8;line-height:1.9;font-size:14px;}
      .admin-sidebar-unified #admin-sidebar,
      .admin-sidebar-fallback #admin-sidebar{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;}
      .admin-pro-menu{display:flex;flex-direction:column;gap:14px;margin-top:0;overflow-y:auto;overflow-x:hidden;min-height:0;padding:0 2px 20px;scrollbar-width:auto;scrollbar-color:rgba(213,177,90,.82) rgba(255,255,255,.06);}
      .admin-pro-menu::-webkit-scrollbar{width:14px}.admin-pro-menu::-webkit-scrollbar-track{background:rgba(255,255,255,.06);border-radius:999px}.admin-pro-menu::-webkit-scrollbar-thumb{background:linear-gradient(180deg, rgba(240,213,143,.96), rgba(213,177,90,.86));border-radius:999px;border:3px solid rgba(0,0,0,.14)}
      .menu-group{padding:0 0 2px;border-bottom:1px solid rgba(255,255,255,.055)}
      .menu-group:last-of-type{border-bottom:none}
      .menu-group-title{margin:0 8px 8px;color:#f0d58f;font-size:12px;font-weight:900;letter-spacing:.2px;opacity:.82}
      .menu-group-links{display:grid;gap:8px}
      .admin-pro-menu a,
      .admin-pro-menu a:link,
      .admin-pro-menu a:visited,
      .admin-pro-menu a:hover,
      .admin-pro-menu a:active{display:grid;grid-template-columns:38px 1fr 20px;align-items:center;gap:10px;min-height:58px;text-decoration:none !important;color:#ecf2ff !important;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:10px 12px;font-weight:900;transition:transform .18s ease, background .18s ease, border-color .18s ease, box-shadow .18s ease;box-shadow:0 8px 24px rgba(0,0,0,.10);}
      .admin-pro-menu a:hover,
      .admin-pro-menu a.active{background:linear-gradient(90deg, rgba(213,177,90,.21), rgba(255,255,255,.055));border-color:rgba(213,177,90,.42);color:#f7f2df !important;transform:translateX(-2px);box-shadow:0 14px 32px rgba(0,0,0,.17)}
      .nav-icon{width:38px;height:38px;border-radius:14px;display:grid;place-items:center;background:rgba(213,177,90,.10);border:1px solid rgba(213,177,90,.18);font-size:20px;line-height:1}
      .nav-label{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:15px}
      .nav-arrow{color:#f0d58f;font-size:24px;line-height:1;opacity:.9}
      .menu-bottom-actions{display:grid;gap:8px;margin-top:2px;padding-top:12px;border-top:1px solid rgba(255,255,255,.06)}
      .admin-pro-menu .logout-link{background:linear-gradient(90deg, rgba(199,59,59,.20), rgba(255,255,255,.05)) !important;border-color:rgba(199,59,59,.34) !important;color:#fff !important;}
      .admin-pro-menu .logout-link .nav-icon{background:rgba(199,59,59,.15);border-color:rgba(199,59,59,.25)}
      .admin-pro-menu .site-link{background:linear-gradient(90deg, rgba(213,177,90,.15), rgba(255,255,255,.05)) !important;border-color:rgba(213,177,90,.27) !important;color:#f5d46b !important;}
      @media (max-width:1100px){body.has-unified-admin-sidebar{padding-right:0}.layout{grid-template-columns:1fr !important}.sidebar,.admin-sidebar-unified,.admin-sidebar-fallback{position:relative !important;top:auto !important;width:100% !important;min-width:100% !important;height:auto !important;max-height:none !important;min-height:auto !important;overflow:visible !important;border-left:none !important;border-bottom:1px solid rgba(255,255,255,.08) !important}.admin-pro-menu{overflow:visible !important}}
    `;
    document.head.appendChild(style);
  }

  const slot = document.getElementById("admin-sidebar");
  const existingSidebar = document.querySelector(".sidebar");

  if (slot && existingSidebar) {
    existingSidebar.classList.add("admin-sidebar-unified");
    slot.innerHTML = menuHtml();
    return;
  }

  if (existingSidebar) {
    existingSidebar.classList.add("admin-sidebar-unified");
    const existingBrand = existingSidebar.querySelector(".brand");
    existingSidebar.innerHTML = `${existingBrand ? existingBrand.outerHTML : defaultBrand()}<div id="admin-sidebar">${menuHtml()}</div>`;
    return;
  }

  document.body.classList.add("has-unified-admin-sidebar");
  const aside = document.createElement("aside");
  aside.className = "admin-sidebar-fallback admin-sidebar-unified";
  aside.innerHTML = `${defaultBrand()}<div id="admin-sidebar">${menuHtml()}</div>`;
  document.body.prepend(aside);
});
