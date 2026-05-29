const supabaseClient = createSupabaseClient();

const ENTITY_CONFIGS = {
  guardians: {
    table: "guardians",
    title: "إدارة أولياء الأمور",
    icon: "👨‍👦",
    desc: "إدارة بيانات أولياء الأمور وروابطهم باللاعبين والمتابعة الإدارية.",
    columns: [
      ["full_name", "الاسم"],
      ["phone", "الجوال"],
      ["email", "البريد"],
      ["relationship", "صلة القرابة"],
      ["city", "المدينة"],
      ["status", "الحالة"],
      ["reference_code", "المرجع"]
    ],
    editable: ["full_name", "phone", "email", "city", "relationship", "status", "notes"],
    labels: {
      full_name: "الاسم الكامل", phone: "رقم الجوال", email: "البريد الإلكتروني", city: "المدينة",
      relationship: "صلة القرابة", status: "الحالة", notes: "ملاحظات", reference_code: "رقم المرجع",
      source_request_id: "رقم الطلب المصدر", created_at: "تاريخ الإنشاء", updated_at: "آخر تحديث"
    },
    textarea: ["notes"]
  },
  supporters: {
    table: "supporters",
    title: "إدارة الداعمين",
    icon: "💰",
    desc: "متابعة الرعاة والداعمين وجهات الدعم وطريقة الرعاية.",
    columns: [
      ["full_name", "الاسم"],
      ["phone", "الجوال"],
      ["support_type", "نوع الداعم"],
      ["support_level", "مستوى الدعم"],
      ["entity_name", "الجهة"],
      ["support_method", "طريقة الدعم"],
      ["status", "الحالة"]
    ],
    editable: ["full_name", "phone", "email", "city", "support_type", "support_level", "entity_name", "support_method", "status", "notes"],
    labels: {
      full_name: "الاسم الكامل", phone: "رقم الجوال", email: "البريد الإلكتروني", city: "المدينة",
      support_type: "نوع الداعم", support_level: "مستوى الدعم", entity_name: "اسم الجهة", support_method: "طريقة الدعم",
      status: "الحالة", notes: "ملاحظات", reference_code: "رقم المرجع", source_request_id: "رقم الطلب المصدر",
      created_at: "تاريخ الإنشاء", updated_at: "آخر تحديث"
    },
    textarea: ["notes"]
  },
  volunteers: {
    table: "volunteers",
    title: "إدارة المتطوعين",
    icon: "🤝",
    desc: "إدارة المتطوعين، مجالات التطوع، التوفر، والمتابعة التشغيلية.",
    columns: [
      ["full_name", "الاسم"],
      ["phone", "الجوال"],
      ["email", "البريد"],
      ["volunteer_field", "مجال التطوع"],
      ["availability", "التوفر"],
      ["city", "المدينة"],
      ["status", "الحالة"]
    ],
    editable: ["full_name", "phone", "email", "city", "volunteer_field", "availability", "status", "notes"],
    labels: {
      full_name: "الاسم الكامل", phone: "رقم الجوال", email: "البريد الإلكتروني", city: "المدينة",
      volunteer_field: "مجال التطوع", availability: "وقت التوفر", status: "الحالة", notes: "ملاحظات",
      reference_code: "رقم المرجع", source_request_id: "رقم الطلب المصدر", created_at: "تاريخ الإنشاء", updated_at: "آخر تحديث"
    },
    textarea: ["notes"]
  },
  academy_staff: {
    table: "academy_staff",
    title: "إدارة الكوادر",
    icon: "💼",
    desc: "جدول موحّد لكل الكوادر بعد اعتماد الطلب — مجال، دور، حالة، وصلاحية النظام.",
    columns: [
      ["full_name", "الاسم"],
      ["phone", "الجوال"],
      ["email", "البريد"],
      ["staff_category", "المجال"],
      ["staff_type", "الدور"],
      ["auth_user_id", "حساب الدخول"],
      ["status", "الحالة"],
      ["role", "صلاحية النظام"]
    ],
    editable: [
      "full_name",
      "phone",
      "email",
      "national_id",
      "qualification",
      "experience_years",
      "status",
      "role",
      "notes"
    ],
    labels: {
      full_name: "الاسم الكامل",
      phone: "رقم الجوال",
      email: "البريد الإلكتروني",
      national_id: "رقم الهوية",
      nationality: "الجنسية",
      birth_date: "تاريخ الميلاد",
      staff_category: "المجال (معرّف)",
      staff_type: "الدور (معرّف)",
      qualification: "المؤهل / التخصص",
      experience_years: "سنوات الخبرة",
      status: "الحالة",
      role: "صلاحية النظام",
      notes: "ملاحظات",
      join_request_id: "رقم طلب الانضمام",
      auth_user_id: "معرّف حساب الدخول",
      created_at: "تاريخ الإنشاء",
      updated_at: "آخر تحديث"
    },
    textarea: ["notes"],
    statusOptions: ["active", "inactive", "suspended"],
    deactivateStatus: "suspended"
  }
};

let rows = [];
let currentId = null;

const $ = (id) => document.getElementById(id);

function config() {
  return ENTITY_CONFIGS[window.ENTITY_TYPE] || ENTITY_CONFIGS.guardians;
}

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeStatus(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "unknown";
  const map = {
    active: "active",
    approved: "active",
    "نشط": "active",
    "مقبول": "active",
    inactive: "inactive",
    disabled: "inactive",
    suspended: "suspended",
    "معطل": "inactive",
    "موقوف": "suspended",
    deleted: "deleted",
    archived: "deleted",
    "محذوف": "deleted",
    "مؤرشف": "deleted"
  };
  return map[raw] || raw;
}

function statusLabel(value) {
  const st = normalizeStatus(value);
  if (st === "active") return "نشط";
  if (st === "inactive") return "معطل";
  if (st === "suspended") return "موقوف";
  if (st === "deleted") return "محذوف/مؤرشف";
  if (st === "unknown") return "غير محدد";
  return st;
}

function statusClass(value) {
  const st = normalizeStatus(value);
  if (st === "active") return "status-approved";
  if (st === "suspended") return "status-rejected";
  if (st === "deleted") return "status-rejected";
  return "status-pending";
}

function fmtDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("ar-SA", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function short(value, length = 70) {
  const text = String(value ?? "-");
  return text.length > length ? text.slice(0, length) + "…" : text;
}

function showToast(message, type = "success") {
  const wrap = $("toastWrap");
  if (!wrap) return;
  const toast = document.createElement("div");
  toast.className = "toast " + type;
  toast.textContent = message;
  wrap.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px)";
    toast.style.transition = ".2s ease";
    setTimeout(() => toast.remove(), 220);
  }, 2800);
}

function staffCategoryLabel(id) {
  const AR = window.ACADEMY_ROLES;
  return AR?.getDomainLabel ? AR.getDomainLabel(id) : id || "-";
}

function staffTypeLabel(id) {
  const AR = window.ACADEMY_ROLES;
  return AR?.getRoleLabel ? AR.getRoleLabel(id) : id || "-";
}

function systemRoleLabel(value) {
  const labels = window.PANEL_ROLE_LABELS || {};
  const key = String(value || "").trim().toLowerCase();
  return labels[key] || value || "-";
}

function isAcademyStaffPage() {
  return window.ENTITY_TYPE === "academy_staff";
}

function isValidEntityRow(row) {
  if (!row || row.id == null || String(row.id).trim() === "") return false;
  const name = String(row.full_name || "").trim();
  const phone = String(row.phone || "").trim();
  return !!(name || phone);
}

/** سجلات معتمدة تظهر في الجدول (بدون محذوف/فارغ) */
function registryRows() {
  return rows.filter((row) => isValidEntityRow(row) && normalizeStatus(row.status) !== "deleted");
}

function ensureDefaultFilters() {
  const sf = $("statusFilter");
  if (sf && [...sf.options].some((o) => o.value === "all")) sf.value = "all";
  const cf = $("categoryFilter");
  if (cf && [...cf.options].some((o) => o.value === "all")) cf.value = "all";
  const af = $("authFilter");
  if (af && [...af.options].some((o) => o.value === "all")) af.value = "all";
  const si = $("searchInput");
  if (si) si.value = "";
}

function authLinkLabel(row) {
  return row && row.auth_user_id ? "مفعّل" : "بانتظار التفعيل";
}

function displayCell(row, key) {
  if (key === "status") return statusLabel(row[key]);
  if (key === "staff_category") return staffCategoryLabel(row[key]);
  if (key === "staff_type") return staffTypeLabel(row[key]);
  if (key === "role") return systemRoleLabel(row[key]);
  if (key === "auth_user_id") return authLinkLabel(row);
  if (key === "experience_years") return row[key] != null ? `${row[key]} سنة` : "-";
  return short(row[key]);
}

function staffPortalUrl(row) {
  const base = new URL("staff_login.html", window.location.href);
  if (row && row.email) base.searchParams.set("email", String(row.email).trim());
  return base.href;
}

function searchableText(row) {
  const AR = window.ACADEMY_ROLES;
  return [
    row.full_name,
    row.phone,
    row.email,
    row.city,
    row.reference_code,
    row.relationship,
    row.support_type,
    row.support_level,
    row.entity_name,
    row.support_method,
    row.volunteer_field,
    row.availability,
    row.notes,
    row.staff_category,
    row.staff_type,
    staffCategoryLabel(row.staff_category),
    staffTypeLabel(row.staff_type),
    row.qualification,
    row.national_id,
    row.join_request_id
  ].filter(Boolean).join(" ").toLowerCase();
}

function filtered() {
  const query = ($("searchInput")?.value || "").trim().toLowerCase();
  const status = $("statusFilter")?.value || "all";
  const category = $("categoryFilter")?.value || "all";
  const authLink = $("authFilter")?.value || "all";
  const source =
    status === "deleted"
      ? rows.filter((row) => isValidEntityRow(row) && normalizeStatus(row.status) === "deleted")
      : registryRows();
  return source.filter((row) => {
    const matchesSearch = !query || searchableText(row).includes(query);
    const matchesStatus = status === "all" || normalizeStatus(row.status) === status;
    let matchesCategory = true;
    let matchesAuth = true;
    if (isAcademyStaffPage()) {
      matchesCategory = category === "all" || String(row.staff_category || "") === category;
      if (authLink === "linked") matchesAuth = !!row.auth_user_id;
      if (authLink === "pending") matchesAuth = !row.auth_user_id;
    }
    return matchesSearch && matchesStatus && matchesCategory && matchesAuth;
  });
}

async function loadEntities() {
  const cfg = config();
  if ($("pageTitle")) $("pageTitle").textContent = cfg.title;
  if ($("pageDesc")) $("pageDesc").textContent = cfg.desc;
  if ($("pageIcon")) $("pageIcon").textContent = cfg.icon;

  const tbody = $("entityTableBody");
  if (tbody) {
    tbody.innerHTML = `<tr><td class="empty-cell" colspan="${cfg.columns.length + 2}">جاري تحميل البيانات...</td></tr>`;
  }

  const { data, error } = await supabaseClient
    .from(cfg.table)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(`Supabase ${cfg.table} fetch error:`, error);
    if (tbody) {
      tbody.innerHTML = `<tr><td class="empty-cell error-cell" colspan="${cfg.columns.length + 2}">تعذر تحميل البيانات. حاول إعادة التحميل.</td></tr>`;
    }
    showToast("تعذر تحميل البيانات حالياً.", "error");
    return;
  }

  rows = Array.isArray(data) ? data : [];
  ensureDefaultFilters();
  render();
}

function renderStats() {
  const visible = filtered();
  const registry = registryRows();
  if ($("statAll")) $("statAll").textContent = visible.length;
  if ($("statActive")) {
    $("statActive").textContent = visible.filter((r) => normalizeStatus(r.status) === "active").length;
  }
  if ($("statInactive")) {
    $("statInactive").textContent = registry.filter((r) => normalizeStatus(r.status) === "inactive").length;
  }
  if ($("statSuspended")) {
    $("statSuspended").textContent = registry.filter((r) => normalizeStatus(r.status) === "suspended").length;
  }
  if ($("statDeleted")) {
    $("statDeleted").textContent = rows.filter(
      (r) => isValidEntityRow(r) && normalizeStatus(r.status) === "deleted"
    ).length;
  }
  if ($("statPendingAuth")) {
    $("statPendingAuth").textContent = registry.filter(
      (r) => !r.auth_user_id && normalizeStatus(r.status) === "active"
    ).length;
  }
}

function render() {
  const cfg = config();
  const head = $("entityTableHead");
  const tbody = $("entityTableBody");
  if (!head || !tbody) return;

  head.innerHTML = `
    <tr>
      ${cfg.columns.map(([, label]) => `<th>${esc(label)}</th>`).join("")}
      <th>تاريخ الإنشاء</th>
      <th>الإجراءات</th>
    </tr>
  `;

  const data = filtered();
  renderStats();

  if (!data.length) {
    tbody.innerHTML = `<tr><td class="empty-cell" colspan="${cfg.columns.length + 2}">لا توجد بيانات مطابقة حاليًا.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map((row) => {
    const cells = cfg.columns.map(([key]) => {
      if (key === "status") {
        return `<td><span class="tag ${statusClass(row[key])}">${esc(statusLabel(row[key]))}</span></td>`;
      }
      if (key === "auth_user_id") {
        const linked = !!row.auth_user_id;
        return `<td><span class="tag ${linked ? "status-approved" : "status-pending"}">${esc(authLinkLabel(row))}</span></td>`;
      }
      return `<td>${esc(displayCell(row, key))}</td>`;
    }).join("");

    return `
      <tr>
        ${cells}
        <td>${esc(fmtDate(row.created_at))}</td>
        <td>${rowActionsHtml(row)}</td>
      </tr>
    `;
  }).join("");
}

function rowActionsHtml(row) {
  const id = esc(row.id);
  const base = `
    <div class="row-actions">
      <button class="mini-btn review" type="button" onclick="viewEntity('${id}')">عرض</button>
      <button class="mini-btn more" type="button" onclick="editEntity('${id}')">تعديل</button>
  `;
  if (!isAcademyStaffPage()) {
    return `${base}<button class="mini-btn reject" type="button" onclick="deactivateEntity('${id}')">تعطيل</button></div>`;
  }

  const st = normalizeStatus(row.status);
  const statusBtn =
    st === "active"
      ? `<button class="mini-btn reject" type="button" onclick="deactivateEntity('${id}')">إيقاف</button>`
      : `<button class="mini-btn review" type="button" onclick="setEntityStatus('${id}','active')">تفعيل</button>`;

  const portalBtn = row.email
    ? `<a class="mini-btn review" href="${esc(staffPortalUrl(row))}" target="_blank" rel="noopener">بوابة</a>`
    : "";

  const copyBtn = row.email
    ? `<button class="mini-btn more" type="button" onclick="copyStaffPortalLink('${id}')">نسخ الرابط</button>`
    : "";

  return `${base}${portalBtn}${copyBtn}${statusBtn}</div>`;
}

function findRow(id) {
  return rows.find((row) => String(row.id) === String(id));
}

function openModal() {
  $("entityModal")?.classList.add("show");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  $("entityModal")?.classList.remove("show");
  document.body.style.overflow = "";
  currentId = null;
}

function viewEntity(id) {
  const cfg = config();
  const row = findRow(id);
  if (!row) return;
  currentId = id;
  $("modalTitle").textContent = "عرض البيانات";

  const entries = Object.entries(row)
    .filter(([, value]) => value !== null && value !== undefined && String(value) !== "")
    .map(([key, value]) => {
      const label = cfg.labels[key] || key;
      let display = key.includes("_at") ? fmtDate(value) : short(value, 120);
      if (key === "status") display = statusLabel(value);
      else if (key === "staff_category") display = staffCategoryLabel(value);
      else if (key === "staff_type") display = staffTypeLabel(value);
      else if (key === "role") display = systemRoleLabel(value);
      else if (key === "auth_user_id") display = value ? "مفعّل ومرتبط" : "بانتظار تفعيل الحساب";
      return `<div class="detail-item"><strong>${esc(label)}</strong><span>${esc(display)}</span></div>`;
    }).join("");

  const staffHint =
    isAcademyStaffPage() && !row.auth_user_id && row.email
      ? `<p class="subtext" style="margin:0 0 14px;color:#ffe79c">هذا الكادر لم يفعّل حسابه بعد. أرسل له رابط بوابة الكادر (نفس البريد المعتمد).</p>`
      : "";

  $("modalBody").innerHTML = `${staffHint}<div class="detail-grid">${entries || '<div class="empty-cell">لا توجد بيانات تفصيلية.</div>'}</div>`;
  const staffActions =
    isAcademyStaffPage() && row.email
      ? `<button class="btn" type="button" onclick="copyStaffPortalLink('${esc(id)}')">نسخ رابط التفعيل</button>
         <a class="btn" href="${esc(staffPortalUrl(row))}" target="_blank" rel="noopener">فتح بوابة الكادر</a>`
      : "";
  $("modalActions").innerHTML = `
    <button class="btn gold" type="button" onclick="editEntity('${esc(id)}')">تعديل</button>
    ${staffActions}
    <button class="btn" type="button" onclick="closeModal()">إغلاق</button>
  `;
  openModal();
}

function editEntity(id) {
  const cfg = config();
  const row = findRow(id);
  if (!row) return;
  currentId = id;
  $("modalTitle").textContent = "تعديل البيانات";

  const fields = cfg.editable.map((key) => {
    const label = cfg.labels[key] || key;
    const value = row[key] ?? "";
    if (key === "status") {
      const st = normalizeStatus(value);
      const opts = cfg.statusOptions || ["active", "inactive", "deleted"];
      const optLabels = { active: "نشط", inactive: "معطل", suspended: "موقوف", deleted: "محذوف/مؤرشف" };
      return `
        <label>
          <span>${esc(label)}</span>
          <select name="${esc(key)}">
            ${opts.map((v) => `<option value="${v}" ${st === v ? "selected" : ""}>${optLabels[v] || v}</option>`).join("")}
          </select>
        </label>
      `;
    }
    if (key === "role") {
      const rv = String(value || "staff");
      const opts =
        window.PANEL_ROLE_OPTIONS ||
        [
          { value: "staff", label: "موظف" },
          { value: "manager", label: "مدير عمليات" },
          { value: "admin", label: "المدير العام" }
        ];
      return `
        <label>
          <span>${esc(label)}</span>
          <select name="${esc(key)}">
            ${opts
              .map(
                (o) =>
                  `<option value="${esc(o.value)}" ${rv === o.value ? "selected" : ""}>${esc(o.label)}</option>`
              )
              .join("")}
          </select>
        </label>
      `;
    }
    if ((cfg.textarea || []).includes(key)) {
      return `<label class="full"><span>${esc(label)}</span><textarea name="${esc(key)}">${esc(value)}</textarea></label>`;
    }
    return `<label><span>${esc(label)}</span><input name="${esc(key)}" value="${esc(value)}"></label>`;
  }).join("");

  $("modalBody").innerHTML = `<form id="editForm" class="edit-grid">${fields}</form>`;
  $("modalActions").innerHTML = `
    <button class="btn gold" type="button" onclick="saveEntity()">حفظ التعديل</button>
    <button class="btn" type="button" onclick="closeModal()">إلغاء</button>
  `;
  openModal();
}

async function saveEntity() {
  const cfg = config();
  const row = findRow(currentId);
  const form = $("editForm");
  if (!row || !form) return;

  const formData = new FormData(form);
  const payload = { updated_at: new Date().toISOString() };
  for (const key of cfg.editable) {
    payload[key] = formData.get(key) || null;
  }

  const { error } = await supabaseClient
    .from(cfg.table)
    .update(payload)
    .eq("id", currentId);

  if (error) {
    console.error(`Supabase ${cfg.table} update error:`, error);
    showToast("تعذر حفظ التعديل.", "error");
    return;
  }

  Object.assign(row, payload);
  render();
  closeModal();
  showToast("تم حفظ التعديل بنجاح.", "success");
}

async function setEntityStatus(id, targetStatus) {
  const cfg = config();
  const targetLabel = statusLabel(targetStatus);
  const ok = await confirmBox("تغيير حالة السجل", `سيتم تغيير الحالة إلى «${targetLabel}». هل تريد المتابعة؟`, "تأكيد");
  if (!ok) return;

  const payload = { status: targetStatus, updated_at: new Date().toISOString() };
  const { error } = await supabaseClient.from(cfg.table).update(payload).eq("id", id);
  if (error) {
    console.error(`Supabase ${cfg.table} status error:`, error);
    showToast("تعذر تحديث الحالة.", "error");
    return;
  }
  const row = findRow(id);
  if (row) Object.assign(row, payload);
  render();
  showToast("تم تحديث الحالة.", "success");
}

async function copyStaffPortalLink(id) {
  const row = findRow(id);
  if (!row || !row.email) {
    showToast("لا يوجد بريد لنسخ رابط التفعيل.", "warn");
    return;
  }
  const url = staffPortalUrl(row);
  try {
    await navigator.clipboard.writeText(url);
    showToast("تم نسخ رابط بوابة الكادر.", "success");
  } catch (e) {
    prompt("انسخ الرابط:", url);
  }
}

async function deactivateEntity(id) {
  const cfg = config();
  const targetStatus = cfg.deactivateStatus || "inactive";
  const targetLabel = statusLabel(targetStatus);
  const ok = await confirmBox(
    "تغيير حالة السجل",
    `سيتم تغيير حالة السجل إلى «${targetLabel}». هل تريد المتابعة؟`,
    "تأكيد"
  );
  if (!ok) return;

  const payload = { status: targetStatus, updated_at: new Date().toISOString() };
  const { error } = await supabaseClient
    .from(cfg.table)
    .update(payload)
    .eq("id", id);

  if (error) {
    console.error(`Supabase ${cfg.table} deactivate error:`, error);
    showToast("تعذر تعطيل السجل.", "error");
    return;
  }

  const row = findRow(id);
  if (row) Object.assign(row, payload);
  render();
  showToast("تم تعطيل السجل.", "success");
}

function confirmBox(title, message, okText = "تأكيد") {
  return new Promise((resolve) => {
    const overlay = $("confirmModal");
    const ok = $("confirmOk");
    const cancel = $("confirmCancel");
    if (!overlay || !ok || !cancel) {
      resolve(false);
      return;
    }

    $("confirmTitle").textContent = title;
    $("confirmText").textContent = message;
    ok.textContent = okText;

    const cleanup = (value) => {
      overlay.classList.remove("show");
      document.body.style.overflow = "";
      ok.onclick = null;
      cancel.onclick = null;
      overlay.onclick = null;
      resolve(value);
    };

    ok.onclick = () => cleanup(true);
    cancel.onclick = () => cleanup(false);
    overlay.onclick = (event) => {
      if (event.target === overlay) cleanup(false);
    };

    overlay.classList.add("show");
    document.body.style.overflow = "hidden";
  });
}

function buildEntityExportRows() {
  const cfg = config();
  const data = filtered();
  const headers = cfg.columns.map(([, label]) => label).concat(["تاريخ الإنشاء"]);
  const lines = data.map((row) =>
    cfg.columns
      .map(([key]) => {
        if (key === "status") return statusLabel(row[key]);
        if (key === "auth_user_id") return authLinkLabel(row);
        return displayCell(row, key);
      })
      .concat([fmtDate(row.created_at)])
  );
  return { cfg, data, rows: [headers, ...lines] };
}

function exportPdf() {
  const { cfg, data, rows } = buildEntityExportRows();
  if (!data.length) {
    showToast("لا توجد بيانات للتصدير.", "warn");
    return;
  }
  const AE = window.AdminExport;
  if (!AE) {
    showToast("وحدة التصدير غير متوفرة.", "error");
    return;
  }
  const stamp = AE.exportDateStamp();
  const pdf = AE.openPdfPrint({
    title: cfg.title || cfg.table,
    fileBase: `${cfg.table}_${stamp}`,
    headers: rows[0],
    bodyRows: rows.slice(1),
    mainColCount: Math.min(6, rows[0].length),
    stampLabel: `ختم ${cfg.title || "السجلات"}`
  });
  if (!pdf.ok) {
    showToast("تعذر فتح نافذة PDF. اسمح بالنوافذ المنبثقة.", "warn");
    return;
  }
  showToast(`تم تجهيز PDF (${data.length} سجل).`, "success");
}

function exportExcel() {
  const { cfg, data, rows } = buildEntityExportRows();
  if (!data.length) {
    showToast("لا توجد بيانات للتصدير.", "warn");
    return;
  }
  const AE = window.AdminExport;
  const stamp = AE ? AE.exportDateStamp() : String(Date.now());
  if (AE && AE.downloadExcel(`${cfg.table}_${stamp}.xlsx`, rows)) {
    showToast(`تم تصدير ${data.length} سجل إلى Excel.`, "success");
    return;
  }
  showToast("مكتبة Excel غير متاحة.", "error");
}

window.setEntityStatus = setEntityStatus;
window.copyStaffPortalLink = copyStaffPortalLink;

document.addEventListener("DOMContentLoaded", () => {
  $("searchInput")?.addEventListener("input", render);
  $("statusFilter")?.addEventListener("change", render);
  $("categoryFilter")?.addEventListener("change", render);
  $("authFilter")?.addEventListener("change", render);
  $("exportPdfBtn")?.addEventListener("click", exportPdf);
  $("exportExcelBtn")?.addEventListener("click", exportExcel);
  $("exportBtn")?.addEventListener("click", exportPdf);
  $("closeEntityModal")?.addEventListener("click", closeModal);
  $("entityModal")?.addEventListener("click", (event) => {
    if (event.target === $("entityModal")) closeModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
  });
  loadEntities();
});
