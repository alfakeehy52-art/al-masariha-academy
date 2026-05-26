document.addEventListener("DOMContentLoaded", () => {
  const current = (window.location.pathname.split("/").pop() || "admin_dashboard.html").toLowerCase();

  const ICONS = {
    home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3 3 10.2V21h6v-6h6v6h6V10.2L12 3Z"/></svg>',
    users: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16 11c1.66 0 3-1.57 3-3.5S17.66 4 16 4s-3 1.57-3 3.5 1.34 3.5 3 3.5Zm-8 0c1.66 0 3-1.57 3-3.5S9.66 4 8 4 5 5.57 5 7.5 6.34 11 8 11Zm0 2c-2.33 0-7 1.17-7 3.5V20h14v-3.5C15 14.17 10.33 13 8 13Zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V20h6v-3.5c0-2.33-4.67-3.5-7-3.5Z"/></svg>',
    inbox: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19 3H5a2 2 0 0 0-2 2v14l4-4h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Zm0 12H6.83L4 17.83V5h15v10Z"/></svg>',
    ball: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 2c1.2 0 2.33.22 3.38.62L12 9.76 8.62 4.62A7.96 7.96 0 0 1 12 4Zm-4.9 1.38L9.24 12l-4.62 4.62A7.96 7.96 0 0 1 4 12c0-1.45.31-2.83.86-4.07ZM12 20a7.96 7.96 0 0 1-4.62-1.48L12 14.24l4.62 4.28A7.96 7.96 0 0 1 12 20Zm4.9-1.38L14.76 12l4.62-4.62c.55 1.24.86 2.62.86 4.07 0 1.45-.31 2.83-.86 4.07Z"/></svg>',
    coach: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.31 0-10 1.66-10 5v3h20v-3c0-3.34-6.69-5-10-5Zm7-9h-2v3h-3v2h3v3h2v-3h3v-2h-3V5Z"/></svg>',
    family: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16 4a3 3 0 1 0-3 3 3 3 0 0 0 3-3ZM8 4a3 3 0 1 0-3 3 3 3 0 0 0 3-3Zm0 7c-2.67 0-8 1.34-8 4v3h8v-3c0-1.1.89-2.06 2.06-2.68A6.94 6.94 0 0 0 8 11Zm8 0c-.7 0-1.37.08-2 .23V15h8v-3c0-2.66-5.33-4-8-4Z"/></svg>',
    heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 21-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.18L12 21Z"/></svg>',
    hand: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21 12.5a5.5 5.5 0 0 1-5.5 5.5H10v-9h1.5a2.5 2.5 0 0 1 2.45 2h1.3A3.75 3.75 0 0 1 19 14.25V12.5ZM7 4.5A2.5 2.5 0 0 1 9.5 7V17H7V4.5Z"/></svg>',
    star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 17.27 6.18 3.73-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73-1.64 7.03L12 17.27Z"/></svg>',
    stadium: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 5h16v2H4V5Zm0 4h10v2H4V9Zm0 4h16v2H4v-2Zm0 4h10v2H4v-2Z"/></svg>',
    chart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 3h2v18H3V3Zm6 10h2v8H9v-8Zm6-6h2v14h-2V7Zm6 9h2v5h-2v-5Z"/></svg>',
    cart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm10 0a2 2 0 1 0 .01 4 2 2 0 0 0 0-4ZM7.16 14h9.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0 0 21.06 5H6.21l-.94-2H1v2h2l3.6 7.59-1.35 2.44C4.52 15.37 5.48 17 7.16 17Z"/></svg>',
    bell: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 0 0-5-6.71V4a2 2 0 1 0-4 0v.29A7 7 0 0 0 5 11v5l-2 2v1h18v-1l-2-2Z"/></svg>',
    settings: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19.14 12.94a7.43 7.43 0 0 0 .05-.94 7.43 7.43 0 0 0-.05-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.28 7.28 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 14 2h-4a.5.5 0 0 0-.49.42l-.36 2.54a7.28 7.28 0 0 0-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.78a.5.5 0 0 0 .12.64l2.03 1.58c-.03.31-.05.63-.05.94s.02.63.05.94L2.83 13.86a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .6.22l2.39-.96c.5.39 1.05.71 1.63.94l.36 2.54A.5.5 0 0 0 10 22h4a.5.5 0 0 0 .49-.42l.36-2.54c.58-.23 1.13-.55 1.63-.94l2.39.96a.5.5 0 0 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.5A3.5 3.5 0 1 1 15.5 12 3.5 3.5 0 0 1 12 15.5Z"/></svg>',
    clip: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.5 6v9.5a4 4 0 0 1-8 0V7a2.5 2.5 0 0 1 5 0v8.5a1 1 0 0 1-2 0V7H9v10.5a4 4 0 0 0 8 0V7a4.5 4.5 0 0 0-9 0v8.5a6 6 0 0 0 12 0V7h-1.5Z"/></svg>',
    globe: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm7.93 9h-3.4a15.9 15.9 0 0 0-1.2-4.68A8.05 8.05 0 0 1 19.93 11ZM12 4c.95 1.57 1.63 3.58 1.9 5.93H10.1C10.37 7.58 11.05 5.57 12 4ZM8.67 6.32A15.9 15.9 0 0 0 7.47 11H4.07a8.05 8.05 0 0 1 4.6-4.68ZM4.07 13h3.4c.26 1.64.74 3.18 1.2 4.68A8.05 8.05 0 0 1 4.07 13Zm5 0h5.86c-.27 2.35-.95 4.36-1.9 5.93-1.05-1.57-1.73-3.58-2-5.93Zm4.86 7.68c.46-1.5.94-3.04 1.2-4.68h3.4a8.05 8.05 0 0 1-4.6 4.68Z"/></svg>',
    logout: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16 17v-3H9v-4h7V7l5 5-5 5ZM5 5h6V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6v-2H5V5Z"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8.12 16.59 12.71 12 8.12 7.41 9.53 6l6 6-6 6-1.41-1.41Z"/></svg>'
  };

  const menuTree = [
    {
      id: "main",
      title: "الرئيسية",
      items: [
        { href: "admin_dashboard.html", label: "لوحة الإدارة", desc: "ملخص المؤشرات", icon: "home", match: ["admin_dashboard.html"] }
      ]
    },
    {
      id: "members",
      title: "الأعضاء والمنتسبون",
      items: [
        {
          href: "admin_members_dashboard.html",
          label: "مركز الأعضاء",
          desc: "نظرة شاملة",
          icon: "users",
          match: ["admin_members_dashboard.html"],
          children: [
            { href: "players_list_dashboard.html", label: "قائمة اللاعبين", icon: "ball", match: ["players_list_dashboard.html", "player_view_dashboard.html", "edit_player_dashboard.html"] },
            { href: "players_add_dashboard.html", label: "إضافة لاعب", icon: "coach", match: ["players_add_dashboard.html"] },
            { href: "coaches_dashboard.html", label: "المدربون", icon: "coach", match: ["coaches_dashboard.html", "coaches_add_dashboard.html", "coach_view_dashboard.html"] },
            { href: "guardians_dashboard.html", label: "أولياء الأمور", icon: "family", match: ["guardians_dashboard.html"] },
            { href: "supporters_dashboard.html", label: "الداعمون", icon: "heart", match: ["supporters_dashboard.html"] },
            { href: "admin_staff_dashboard.html", label: "الكوادر (موحّد)", icon: "coach", match: ["admin_staff_dashboard.html"] },
            { href: "academy_members_dashboard.html", label: "عضوية الأكاديمية", icon: "star", match: ["academy_members_dashboard.html"] }
          ]
        }
      ]
    },
    {
      id: "support",
      title: "الدعم والتواصل",
      badgeKey: "supportTotal",
      items: [
        {
          href: "communications_dashboard.html",
          label: "محادثات الطلبات",
          desc: "محادثة مرتبطة بطلب انضمام",
          icon: "inbox",
          badgeKey: "openChats",
          match: ["communications_dashboard.html"]
        },
        {
          href: "contact_messages_dashboard.html",
          label: "رسائل تواصل معنا",
          desc: "استفسارات نموذج الموقع",
          icon: "bell",
          badgeKey: "newContactMessages",
          match: ["contact_messages_dashboard.html"]
        }
      ]
    },
    {
      id: "requests",
      title: "الطلبات والمراجعة",
      badgeKey: "pendingRequests",
      items: [
        {
          href: "admin_requests_dashboard.html",
          label: "مركز الطلبات",
          desc: "متابعة الانضمام",
          icon: "inbox",
          match: ["admin_requests_dashboard.html", "admin_requests.html"],
          children: [
            { href: "players_requests.html", label: "طلبات اللاعبين", icon: "ball", match: ["players_requests.html"] },
            { href: "coaches_requests.html", label: "طلبات المدربين", icon: "coach", match: ["coaches_requests.html"] },
            { href: "guardians_requests.html", label: "طلبات أولياء الأمور", icon: "family", match: ["guardians_requests.html"] },
            { href: "supporters_requests.html", label: "طلبات الداعمين", icon: "heart", match: ["supporters_requests.html"] },
            { href: "staff_requests.html", label: "طلبات الكوادر", icon: "coach", match: ["staff_requests.html"] },
            { href: "academy_members_requests.html", label: "طلبات عضوية الأكاديمية", icon: "star", match: ["academy_members_requests.html"] },
            { href: "admin_completion_dashboard.html", label: "استكمال الطلبات", icon: "clip", match: ["admin_completion_dashboard.html"] }
          ]
        }
      ]
    },
    {
      id: "ops",
      title: "التشغيل الرياضي",
      items: [
        { href: "teams_categories_dashboard.html", label: "الفرق والفئات", desc: "تنظيم الفرق", icon: "stadium", match: ["teams_categories_dashboard.html"] },
        { href: "matches_dashboard.html", label: "المباريات", desc: "جدول المباريات العام", icon: "stadium", match: ["matches_dashboard.html"] },
        { href: "stats_dashboard.html", label: "الإحصائيات", desc: "مؤشرات الأداء", icon: "chart", match: ["stats_dashboard.html"] }
      ]
    },
    {
      id: "commerce",
      title: "التجارة والمحتوى",
      items: [
        { href: "store_products_dashboard.html", label: "إدارة المتجر", desc: "المنتجات والعروض", icon: "cart", match: ["store_products_dashboard.html"] },
        { href: "store_orders_dashboard.html", label: "طلبات المتجر", desc: "طلبات الزوار", icon: "cart", match: ["store_orders_dashboard.html", "store_order_status.html"] },
        { href: "news_dashboard.html", label: "الأخبار", desc: "أخبار الواجهة العامة", icon: "clip", match: ["news_dashboard.html"] },
        { href: "media_dashboard.html", label: "الإعلام", desc: "صور وفيديو", icon: "clip", match: ["media_dashboard.html"] }
      ]
    },
    {
      id: "system",
      title: "النظام",
      items: [
        { href: "admin_notifications.html", label: "الإشعارات", desc: "تنبيهات الإدارة", icon: "bell", match: ["admin_notifications.html"] },
        {
          href: "admin_permissions_dashboard.html",
          label: "صلاحيات الدخول",
          desc: "أدوار لوحة الإدارة",
          icon: "settings",
          match: ["admin_permissions_dashboard.html"],
          navRole: "admin"
        },
        { href: "academy_settings_dashboard.html", label: "الإعدادات", desc: "إعدادات الأكاديمية", icon: "settings", match: ["academy_settings_dashboard.html"] }
      ]
    }
  ];

  function allMatches(item) {
    const base = [item.href].concat(item.match || []);
    const childMatches = (item.children || []).flatMap((c) => [c.href].concat(c.match || []));
    return base.concat(childMatches).map((v) => String(v).toLowerCase());
  }

  function isItemActive(item) {
    return allMatches(item).includes(current);
  }

  function isChildActive(child) {
    return [child.href].concat(child.match || []).map((v) => v.toLowerCase()).includes(current);
  }

  function groupHasActive(group) {
    return group.items.some((item) => isItemActive(item));
  }

  function iconHtml(name) {
    return `<span class="nav-icon" aria-hidden="true">${ICONS[name] || ICONS.home}</span>`;
  }

  function renderLink(item, isChild) {
    const active = isChild ? isChildActive(item) : isItemActive(item) && !(item.children && item.children.length && !isChild);
    const desc = item.desc ? `<span class="nav-desc">${item.desc}</span>` : "";
    const navRoleAttr = item.navRole ? ` data-nav-role="${item.navRole}"` : "";
    const badge = item.badgeKey
      ? `<span class="nav-item-badge" data-badge="${item.badgeKey}" hidden aria-label="تنبيهات">0</span>`
      : "";
    return `
      <a href="${item.href}" class="nav-link${isChild ? " nav-sublink" : ""}${active ? " active" : ""}"${navRoleAttr}>
        ${iconHtml(item.icon)}
        <span class="nav-copy">
          <span class="nav-label">${item.label}</span>
          ${desc}
        </span>
        ${badge}
        <span class="nav-arrow">${ICONS.chevron}</span>
      </a>
    `;
  }

  function renderItem(item) {
    const hasChildren = Array.isArray(item.children) && item.children.length;
    const open = isItemActive(item);
    if (!hasChildren) return renderLink(item, false);

    return `
      <div class="nav-parent${open ? " is-open" : ""}" data-nav-parent>
        ${renderLink(item, false)}
        <div class="nav-children" role="group" aria-label="قائمة ${item.label}">
          ${item.children.map((child) => renderLink(child, true)).join("")}
        </div>
      </div>
    `;
  }

  function menuHtml() {
    return `
      <nav class="menu admin-pro-menu" aria-label="القائمة الجانبية للإدارة">
        ${menuTree
          .map(
            (group) => `
          <section class="menu-group${groupHasActive(group) ? " is-active-group" : ""}" data-group="${group.id}">
            <div class="menu-group-head">
              <span class="menu-group-title">${group.title}</span>
              ${group.badgeKey ? `<span class="menu-group-badge" data-badge="${group.badgeKey}" hidden>0</span>` : ""}
            </div>
            <div class="menu-group-links">
              ${group.items.map((item) => renderItem(item)).join("")}
            </div>
          </section>
        `
          )
          .join("")}
        <div class="menu-bottom-actions">
          <a href="index.html" class="nav-link site-link">
            ${iconHtml("globe")}
            <span class="nav-copy"><span class="nav-label">العودة إلى الموقع</span><span class="nav-desc">الواجهة العامة</span></span>
            <span class="nav-arrow">${ICONS.chevron}</span>
          </a>
          <a href="admin_login.html" class="nav-link logout-link" data-admin-logout>
            ${iconHtml("logout")}
            <span class="nav-copy"><span class="nav-label">تسجيل خروج</span><span class="nav-desc">إنهاء الجلسة</span></span>
            <span class="nav-arrow">${ICONS.chevron}</span>
          </a>
        </div>
      </nav>
    `;
  }

  function brandHtml() {
    return `
      <div class="brand admin-sidebar-brand">
        <div class="brand-top">
          <img id="adminSidebarLogo" src="academy-logo.svg" alt="" class="brand-logo" width="52" height="52">
          <div class="brand-copy">
            <span class="brand-badge">لوحة الإدارة</span>
            <h1 id="adminSidebarTitle">أكاديمية المسارحة</h1>
            <p id="adminSidebarDesc">نظام إداري موحّد للاعبين والطلبات والتشغيل.</p>
          </div>
        </div>
        <div class="admin-user-card" id="adminUserCard" hidden>
          <span class="admin-user-label">المسؤول الحالي</span>
          <strong id="adminUserName">—</strong>
          <span class="admin-user-email" id="adminUserEmail"></span>
        </div>
      </div>
    `;
  }

  function loadScriptOnce(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve();
      const el = document.createElement("script");
      el.src = src;
      el.onload = () => resolve();
      el.onerror = () => reject(new Error("Failed: " + src));
      document.head.appendChild(el);
    });
  }

  function applySidebarBrand(settings) {
    const s = settings || window.ACADEMY_SETTINGS || {};
    const logo = document.getElementById("adminSidebarLogo");
    const title = document.getElementById("adminSidebarTitle");
    const desc = document.getElementById("adminSidebarDesc");
    const logoUrl = String(s.logo_url || "academy-logo.svg").trim();
    const name = String(s.brand_name_ar || "أكاديمية المسارحة").trim();
    const subtitle = String(s.brand_subtitle_ar || "لكرة القدم").trim();

    if (logo) {
      logo.src = logoUrl;
      logo.alt = `شعار ${name}`;
      logo.onerror = function onLogoErr() {
        if (logo.src.indexOf("academy-logo.svg") === -1) {
          logo.src = "academy-logo.svg";
        } else {
          logo.style.display = "none";
        }
      };
      logo.style.display = "";
      logo.classList.add("logo-loaded");
    }
    if (title) title.textContent = name;
    if (desc) {
      desc.textContent = subtitle
        ? `${subtitle} — نظام إداري موحّد`
        : "نظام إداري موحّد للاعبين والطلبات والتشغيل.";
    }
  }

  async function bootstrapSidebarBrand() {
    try {
      if (!window.supabase) {
        await loadScriptOnce("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2");
      }
      if (!window.SUPABASE_CONFIG) await loadScriptOnce("supabase-config.js");
      if (!window.createSupabaseClient) await loadScriptOnce("js/supabase-client.js");
      if (!window.PANEL_ROLES) await loadScriptOnce("js/panel-access.js");
      if (!window.loadAcademySettings) await loadScriptOnce("js/academy-settings.js");
      const s = await loadAcademySettings();
      applySidebarBrand(s);
      if (typeof applyAcademySettingsToSite === "function") applyAcademySettingsToSite(s);
    } catch (e) {
      console.warn("[admin-sidebar] brand settings:", e);
    }
  }

  function ensureThemeLink() {
    if (!document.querySelector('link[data-admin-theme="true"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "admin_theme.css";
      link.setAttribute("data-admin-theme", "true");
      document.head.appendChild(link);
    }
    if (!document.querySelector('link[data-admin-pages="true"]')) {
      const pages = document.createElement("link");
      pages.rel = "stylesheet";
      pages.href = "admin-pages.css";
      pages.setAttribute("data-admin-pages", "true");
      document.head.appendChild(pages);
    }
  }

  function injectStyles() {
    if (document.getElementById("admin-sidebar-unified-style")) return;
    const style = document.createElement("style");
    style.id = "admin-sidebar-unified-style";
    style.textContent = `
      .admin-sidebar-unified,.admin-sidebar-fallback{background:linear-gradient(180deg,rgba(8,22,14,.98),rgba(5,14,10,.98));border-left:1px solid rgba(255,255,255,.08);box-sizing:border-box;display:flex;flex-direction:column;gap:14px}
      .admin-sidebar-unified{padding:18px 14px;position:sticky;top:0;height:100vh;width:332px;min-width:332px;overflow:hidden}
      .admin-sidebar-fallback{position:fixed;top:0;right:0;width:332px;height:100vh;z-index:999;padding:18px 14px}
      body.has-unified-admin-sidebar{padding-right:352px}
      .admin-sidebar-brand{background:linear-gradient(135deg,rgba(213,177,90,.12),rgba(255,255,255,.03));border:1px solid rgba(213,177,90,.18);border-radius:22px;padding:16px;box-shadow:0 18px 45px rgba(0,0,0,.22);flex-shrink:0}
      .brand-top{display:flex;gap:12px;align-items:flex-start}
      .brand-logo{width:52px;height:52px;border-radius:16px;object-fit:contain;background:rgba(255,255,255,.04);border:1px solid rgba(213,177,90,.2);padding:6px;flex-shrink:0}
      .brand-copy h1{margin:6px 0 0;font-size:22px;color:#f0d58f;font-weight:900;line-height:1.25}
      .brand-copy p{margin:6px 0 0;color:#b6c1b8;line-height:1.7;font-size:13px}
      .brand-badge{display:inline-flex;align-items:center;min-height:26px;padding:0 10px;border-radius:999px;background:rgba(213,177,90,.12);border:1px solid rgba(213,177,90,.24);color:#f0d58f;font-size:11px;font-weight:900}
      .admin-user-card{margin-top:12px;padding:12px 14px;border-radius:16px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08)}
      .admin-user-label{display:block;color:#9fb0a4;font-size:11px;font-weight:800;margin-bottom:4px}
      .admin-user-card strong{display:block;color:#f0d58f;font-size:15px;font-weight:900;line-height:1.4}
      .admin-user-email{display:block;margin-top:6px;color:#9fb0a4;font-size:11px;font-weight:700;word-break:break-all;line-height:1.5}
      .admin-user-email:empty{display:none}
      #admin-sidebar{flex:1 1 auto;min-height:0;display:flex;flex-direction:column}
      .admin-pro-menu{display:flex;flex-direction:column;gap:12px;margin:0;overflow-y:auto;overflow-x:hidden;min-height:0;padding:2px 2px 16px;scrollbar-width:thin;scrollbar-color:rgba(213,177,90,.7) rgba(255,255,255,.06)}
      .menu-group{padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,.06)}
      .menu-group:last-of-type{border-bottom:none}
      .menu-group-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 6px 8px}
      .menu-group-title{color:#9fb0a4;font-size:11px;font-weight:900;letter-spacing:.4px}
      .menu-group.is-active-group .menu-group-title{color:#f0d58f}
      .menu-group-badge{min-width:22px;height:22px;padding:0 7px;border-radius:999px;background:rgba(199,59,59,.22);border:1px solid rgba(199,59,59,.35);color:#ffd7d7;font-size:11px;font-weight:900;display:inline-flex;align-items:center;justify-content:center}
      .menu-group-badge[hidden]{display:none!important}
      .nav-item-badge{min-width:22px;height:22px;padding:0 7px;border-radius:999px;background:rgba(199,59,59,.24);border:1px solid rgba(199,59,59,.38);color:#fff;font-size:11px;font-weight:900;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0}
      .nav-item-badge[hidden]{display:none!important}
      .menu-group-links{display:grid;gap:6px}
      .nav-link{display:grid;grid-template-columns:40px 1fr auto 18px;align-items:center;gap:10px;min-height:54px;padding:8px 10px;text-decoration:none!important;color:#ecf2ff!important;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:16px;font-weight:800;transition:.18s ease;box-shadow:0 6px 18px rgba(0,0,0,.08)}
      .nav-sublink{grid-template-columns:32px 1fr 14px;min-height:46px;margin-inline-start:10px;background:rgba(255,255,255,.02);border-radius:14px}
      .nav-sublink .nav-icon{width:32px;height:32px;border-radius:12px}
      .nav-sublink .nav-label{font-size:13px}
      .nav-sublink .nav-desc{display:none}
      .nav-link:hover,.nav-link.active{background:linear-gradient(90deg,rgba(213,177,90,.18),rgba(255,255,255,.04));border-color:rgba(213,177,90,.34);color:#fff!important;transform:translateX(-2px)}
      .nav-icon{width:40px;height:40px;border-radius:14px;display:grid;place-items:center;background:rgba(213,177,90,.1);border:1px solid rgba(213,177,90,.18);color:#f0d58f}
      .nav-icon svg{width:20px;height:20px;display:block}
      .nav-copy{min-width:0;display:flex;flex-direction:column;gap:2px}
      .nav-label{font-size:14px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .nav-desc{font-size:11px;color:#9fb0a4;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .nav-arrow{display:grid;place-items:center;color:#f0d58f;opacity:.75}
      .nav-arrow svg{width:16px;height:16px;transition:transform .18s ease}
      .nav-sublink .nav-arrow{display:none}
      .nav-children{display:none;gap:4px;margin-top:4px}
      .nav-parent.is-open .nav-children{display:grid}
      .nav-parent.is-open > .nav-link .nav-arrow svg{transform:rotate(-90deg)}
      .menu-bottom-actions{display:grid;gap:6px;margin-top:4px;padding-top:12px;border-top:1px solid rgba(255,255,255,.08)}
      .logout-link{background:linear-gradient(90deg,rgba(183,66,66,.18),rgba(255,255,255,.03))!important;border-color:rgba(183,66,66,.32)!important}
      .logout-link .nav-icon{background:rgba(183,66,66,.14);border-color:rgba(183,66,66,.24);color:#ffd7d7}
      .admin-mobile-toggle{display:none}
      @media(max-width:1100px){
        body.has-unified-admin-sidebar{padding-right:0}
        .layout{grid-template-columns:1fr!important}
        .layout > .main{padding-top:64px}
        body.admin-sidebar-open{overflow:hidden}
        .admin-mobile-toggle{display:inline-flex;align-items:center;justify-content:center;position:fixed;top:14px;right:14px;z-index:1001;width:48px;height:48px;border-radius:14px;border:1px solid rgba(213,177,90,.28);background:rgba(8,22,14,.95);color:#f0d58f;font-weight:900;cursor:pointer;box-shadow:0 12px 30px rgba(0,0,0,.25)}
        .sidebar,.admin-sidebar-unified,.admin-sidebar-fallback{position:fixed!important;top:0;right:0;width:min(332px,92vw)!important;min-width:0!important;height:100vh!important;transform:translateX(110%);transition:transform .24s ease;z-index:1000;overflow-y:auto!important;-webkit-overflow-scrolling:touch}
        body.admin-sidebar-open .sidebar,body.admin-sidebar-open .admin-sidebar-unified,body.admin-sidebar-open .admin-sidebar-fallback{transform:translateX(0)}
        body.admin-sidebar-open::before{content:"";position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:999}
      }
    `;
    document.head.appendChild(style);
  }

  function bindInteractions(root) {
    root.querySelectorAll("[data-nav-parent]").forEach((parent) => {
      const mainLink = parent.querySelector(":scope > .nav-link");
      if (!mainLink) return;
      mainLink.addEventListener("click", (e) => {
        if (!parent.classList.contains("is-open")) {
          e.preventDefault();
          parent.classList.add("is-open");
        }
      });
    });
    const logout = root.querySelector("[data-admin-logout]");
    if (logout) {
      logout.addEventListener("click", (e) => {
        e.preventDefault();
        if (typeof adminLogout === "function") adminLogout();
        else window.location.href = "admin_login.html";
      });
    }
  }

  function closeAdminSidebar() {
    document.body.classList.remove("admin-sidebar-open");
    const toggle = document.getElementById("adminMobileToggle");
    if (toggle) toggle.setAttribute("aria-label", "فتح القائمة");
  }

  function openAdminSidebar() {
    document.body.classList.add("admin-sidebar-open");
    const toggle = document.getElementById("adminMobileToggle");
    if (toggle) toggle.setAttribute("aria-label", "إغلاق القائمة");
  }

  function ensureMobileToggle() {
    if (document.getElementById("adminMobileToggle")) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = "adminMobileToggle";
    btn.className = "admin-mobile-toggle";
    btn.setAttribute("aria-label", "فتح القائمة");
    btn.textContent = "☰";
    btn.addEventListener("click", () => {
      if (document.body.classList.contains("admin-sidebar-open")) closeAdminSidebar();
      else openAdminSidebar();
    });
    document.body.appendChild(btn);

    document.addEventListener("click", (e) => {
      if (!document.body.classList.contains("admin-sidebar-open")) return;
      if (window.innerWidth > 1100) return;
      const sidebar = document.querySelector(".sidebar, .admin-sidebar-unified, .admin-sidebar-fallback");
      if (e.target === btn || btn.contains(e.target)) return;
      if (sidebar && sidebar.contains(e.target)) return;
      closeAdminSidebar();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeAdminSidebar();
    });

    document.addEventListener("click", (e) => {
      if (window.innerWidth > 1100) return;
      const link = e.target.closest(".admin-pro-menu a.nav-link");
      if (link) closeAdminSidebar();
    });
  }

  async function loadAdminIdentity() {
    const card = document.getElementById("adminUserCard");
    const nameEl = document.getElementById("adminUserName");
    const emailEl = document.getElementById("adminUserEmail");
    if (!card || !nameEl || typeof getAdminSession !== "function") return;
    try {
      if (!window.PANEL_ROLES) await loadScriptOnce("js/panel-access.js");
      if (!window.ACADEMY_ROLES) await loadScriptOnce("js/academy-roles.js");
      const session = await getAdminSession();
      const user = session && session.user;
      if (!user) return;
      let identity = { title: "مسؤول", email: user.email || "", subtitle: "" };
      if (typeof resolvePanelIdentity === "function") {
        identity = await resolvePanelIdentity(user);
      } else if (typeof getAdminDisplayIdentity === "function") {
        identity = getAdminDisplayIdentity(user);
      }
      nameEl.textContent = identity.title || "مسؤول";
      if (emailEl) {
        emailEl.textContent = identity.subtitle
          ? identity.subtitle + (identity.email ? " · " + identity.email : "")
          : identity.email || "";
      }
      card.hidden = false;
      if (typeof applyPanelNavPolicy === "function") await applyPanelNavPolicy(user);
      else applyAdminNavPolicy(user);
    } catch (e) {}
  }

  function applyAdminNavPolicy(user) {
    const role = typeof getAdminRole === "function" ? getAdminRole(user) : "admin";
    const menu = document.querySelector(".admin-pro-menu");
    if (!menu) return;

    menu.querySelectorAll("[data-nav-role]").forEach((el) => el.removeAttribute("hidden"));

    if (role === "admin") return;

    const hideGroups = role === "manager" ? ["commerce", "system"] : ["commerce", "system", "ops"];
    hideGroups.forEach((groupId) => {
      const group = menu.querySelector(`[data-group="${groupId}"]`);
      if (group) group.setAttribute("hidden", "");
    });
  }

  function setBadgeCount(key, count) {
    const n = Number(count) || 0;
    document.querySelectorAll(`[data-badge="${key}"]`).forEach((el) => {
      el.textContent = String(n);
      el.hidden = n <= 0;
    });
  }

  async function loadSidebarBadges() {
    if (typeof createSupabaseClient !== "function") return;
    try {
      const sb = createSupabaseClient();
      const [pendingRes, contactRes, chatRes] = await Promise.all([
        sb
          .from("join_requests")
          .select("id", { count: "exact", head: true })
          .in("status", ["new", "review", "reviewing", "pending", "needs_completion"]),
        sb
          .from("contact_messages")
          .select("id", { count: "exact", head: true })
          .eq("status", "new"),
        sb
          .from("chat_rooms")
          .select("id", { count: "exact", head: true })
          .eq("status", "open")
          .eq("room_type", "join_request")
      ]);

      const pending = pendingRes.error ? 0 : pendingRes.count || 0;
      const contactNew = contactRes.error ? 0 : contactRes.count || 0;
      const openChats = chatRes.error ? 0 : chatRes.count || 0;

      setBadgeCount("pendingRequests", pending);
      setBadgeCount("newContactMessages", contactNew);
      setBadgeCount("openChats", openChats);
      setBadgeCount("supportTotal", contactNew + openChats);
    } catch (e) {}
  }

  function mountSidebar() {
    const slot = document.getElementById("admin-sidebar");
    const existingSidebar = document.querySelector(".sidebar");

    if (slot && existingSidebar) {
      existingSidebar.classList.add("admin-sidebar-unified");
      const pageBrand = existingSidebar.querySelector(".brand:not(.admin-sidebar-brand)");
      if (pageBrand) pageBrand.remove();
      if (!existingSidebar.querySelector(".admin-sidebar-brand")) {
        existingSidebar.insertAdjacentHTML("afterbegin", brandHtml());
      }
      slot.innerHTML = menuHtml();
      return existingSidebar;
    }

    if (existingSidebar) {
      existingSidebar.classList.add("admin-sidebar-unified");
      existingSidebar.innerHTML = `${brandHtml()}<div id="admin-sidebar">${menuHtml()}</div>`;
      return existingSidebar;
    }

    document.body.classList.add("has-unified-admin-sidebar");
    const aside = document.createElement("aside");
    aside.className = "admin-sidebar-fallback admin-sidebar-unified";
    aside.innerHTML = `${brandHtml()}<div id="admin-sidebar">${menuHtml()}</div>`;
    document.body.prepend(aside);
    return aside;
  }

  ensureThemeLink();
  injectStyles();
  const sidebarRoot = mountSidebar();
  ensureMobileToggle();
  if (sidebarRoot) bindInteractions(sidebarRoot);
  bootstrapSidebarBrand();
  loadAdminIdentity();
  loadSidebarBadges();
});
