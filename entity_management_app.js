const SUPABASE_URL = "https://uwmyqlydenrzkzrymhvl.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3bXlxbHlkZW5yemt6cnltaHZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NDQ2NjAsImV4cCI6MjA5MzAyMDY2MH0.TCPgHAHhILaD5tFsZiFIgLvH7yuxkrtJ29F5J5oHQrw";

// تصحيح احتياطي: المفتاح أعلاه إن تغيّر أثناء النسخ، نستخدم المفتاح الصحيح مباشرة.
const SUPABASE_KEY_SAFE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3bXlxbHlkZW5yemt6cnltaHZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NDQ2NjAsImV4cCI6MjA5MzAyMDY2MH0.TCPgHAHhILaD5tFsZiFIgLvH7yuxkrtJ29F5J5oHQrw";
const REAL_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3bXlxbHlkZW5yemt6cnltaHZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NDQ2NjAsImV4cCI6MjA5MzAyMDY2MH0.TCPgHAHhILaD5tFsZiFIgLvH7yuxkrtJ29F5J5oHQrw";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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
    suspended: "inactive",
    "معطل": "inactive",
    "موقوف": "inactive",
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
  if (st === "deleted") return "محذوف/مؤرشف";
  return st;
}

function statusClass(value) {
  const st = normalizeStatus(value);
  if (st === "active") return "status-approved";
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

function searchableText(row) {
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
    row.notes
  ].filter(Boolean).join(" ").toLowerCase();
}

function filtered() {
  const query = ($("searchInput")?.value || "").trim().toLowerCase();
  const status = $("statusFilter")?.value || "all";
  return rows.filter((row) => {
    const matchesSearch = !query || searchableText(row).includes(query);
    const matchesStatus = status === "all" || normalizeStatus(row.status) === status;
    return matchesSearch && matchesStatus;
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
      return `<td>${esc(short(row[key]))}</td>`;
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
      const display = key === "status" ? statusLabel(value) : (key.includes("_at") ? fmtDate(value) : short(value, 120));
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
      return `
        <label>
          <span>${esc(label)}</span>
          <select name="${esc(key)}">
            <option value="active" ${st === "active" ? "selected" : ""}>نشط</option>
            <option value="inactive" ${st === "inactive" ? "selected" : ""}>معطل</option>
            <option value="deleted" ${st === "deleted" ? "selected" : ""}>محذوف/مؤرشف</option>
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
  const ok = await confirmBox("تعطيل السجل", "سيتم تغيير حالة السجل إلى معطل بدل حذفه نهائيًا. هل تريد المتابعة؟", "تعطيل");
  if (!ok) return;

  const cfg = config();
  const payload = { status: "inactive", updated_at: new Date().toISOString() };
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
  const lines = data.map((row) => cfg.columns.map(([key]) => key === "status" ? statusLabel(row[key]) : (row[key] ?? "")).concat([fmtDate(row.created_at)]));
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
