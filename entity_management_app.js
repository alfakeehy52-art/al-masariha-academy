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
      ["staff_category", "المجال"],
      ["staff_type", "الدور"],
      ["qualification", "المؤهل"],
      ["experience_years", "الخبرة"],
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
  const raw = String(value || "active").trim();
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
  return map[raw] || raw || "active";
}

function statusLabel(value) {
  const st = normalizeStatus(value);
  if (st === "active") return "نشط";
  if (st === "inactive") return "معطل";
  if (st === "suspended") return "موقوف";
  if (st === "deleted") return "محذوف/مؤرشف";
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
  const map = { staff: "كادر", manager: "مدير", admin: "مدير نظام" };
  return map[String(value || "").trim()] || value || "-";
}

function displayCell(row, key) {
  if (key === "status") return statusLabel(row[key]);
  if (key === "staff_category") return staffCategoryLabel(row[key]);
  if (key === "staff_type") return staffTypeLabel(row[key]);
  if (key === "role") return systemRoleLabel(row[key]);
  if (key === "experience_years") return row[key] != null ? `${row[key]} سنة` : "-";
  return short(row[key]);
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
  return rows.filter((row) => {
    const matchesSearch = !query || searchableText(row).includes(query);
    const matchesStatus = status === "all" || normalizeStatus(row.status) === status;
    const matchesCategory = category === "all" || String(row.staff_category || "") === category;
    return matchesSearch && matchesStatus && matchesCategory;
  });
}

async function loadEntities() {
  const cfg = config();
  if ($("pageTitle")) $("pageTitle").textContent = cfg.title;
  if ($("pageDesc")) $("pageDesc").textContent = cfg.desc;
  if ($("pageIcon")) $("pageIcon").textContent = cfg.icon;

  const tbody = $("entityTableBody");
  if (tbody) {
    tbody.innerHTML = `<tr><td class="empty-cell" colspan="${cfg.columns.length + 2}">جاري تحميل البيانات من قاعدة البيانات...</td></tr>`;
  }

  const { data, error } = await supabaseClient
    .from(cfg.table)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(`Supabase ${cfg.table} fetch error:`, error);
    if (tbody) {
      tbody.innerHTML = `<tr><td class="empty-cell error-cell" colspan="${cfg.columns.length + 2}">تعذر تحميل البيانات. راجع صلاحيات RLS أو اسم الجدول.</td></tr>`;
    }
    showToast("تعذر تحميل البيانات من قاعدة البيانات.", "error");
    return;
  }

  rows = Array.isArray(data) ? data : [];
  console.log(`${cfg.table} rows:`, rows);
  render();
}

function renderStats() {
  if ($("statAll")) $("statAll").textContent = rows.length;
  if ($("statActive")) $("statActive").textContent = rows.filter((r) => normalizeStatus(r.status) === "active").length;
  if ($("statInactive")) $("statInactive").textContent = rows.filter((r) => normalizeStatus(r.status) === "inactive").length;
  if ($("statSuspended")) $("statSuspended").textContent = rows.filter((r) => normalizeStatus(r.status) === "suspended").length;
  if ($("statDeleted")) $("statDeleted").textContent = rows.filter((r) => normalizeStatus(r.status) === "deleted").length;
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
      return `<td>${esc(displayCell(row, key))}</td>`;
    }).join("");

    return `
      <tr>
        ${cells}
        <td>${esc(fmtDate(row.created_at))}</td>
        <td>
          <div class="row-actions">
            <button class="mini-btn review" type="button" onclick="viewEntity('${esc(row.id)}')">عرض</button>
            <button class="mini-btn more" type="button" onclick="editEntity('${esc(row.id)}')">تعديل</button>
            <button class="mini-btn reject" type="button" onclick="deactivateEntity('${esc(row.id)}')">تعطيل</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
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
      return `<div class="detail-item"><strong>${esc(label)}</strong><span>${esc(display)}</span></div>`;
    }).join("");

  $("modalBody").innerHTML = `<div class="detail-grid">${entries || '<div class="empty-cell">لا توجد بيانات تفصيلية.</div>'}</div>`;
  $("modalActions").innerHTML = `
    <button class="btn gold" type="button" onclick="editEntity('${esc(id)}')">تعديل</button>
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
      return `
        <label>
          <span>${esc(label)}</span>
          <select name="${esc(key)}">
            <option value="staff" ${rv === "staff" ? "selected" : ""}>كادر</option>
            <option value="manager" ${rv === "manager" ? "selected" : ""}>مدير</option>
            <option value="admin" ${rv === "admin" ? "selected" : ""}>مدير نظام</option>
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

function exportCsv() {
  const cfg = config();
  const data = filtered();
  if (!data.length) {
    showToast("لا توجد بيانات للتصدير.", "warn");
    return;
  }

  const headers = cfg.columns.map(([, label]) => label).concat(["تاريخ الإنشاء"]);
  const lines = data.map((row) =>
    cfg.columns.map(([key]) => (key === "status" ? statusLabel(row[key]) : displayCell(row, key))).concat([fmtDate(row.created_at)])
  );
  const csv = [headers, ...lines].map((line) => line.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${cfg.table}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  showToast("تم تصدير البيانات بنجاح.", "success");
}

document.addEventListener("DOMContentLoaded", () => {
  $("searchInput")?.addEventListener("input", render);
  $("statusFilter")?.addEventListener("change", render);
  $("categoryFilter")?.addEventListener("change", render);
  $("exportBtn")?.addEventListener("click", exportCsv);
  $("closeEntityModal")?.addEventListener("click", closeModal);
  $("entityModal")?.addEventListener("click", (event) => {
    if (event.target === $("entityModal")) closeModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
  });
  loadEntities();
});
