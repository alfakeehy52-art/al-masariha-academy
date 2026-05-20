/**
 * نموذج انضم إلينا — منطق الصفحة
 */
(function () {
  let supabaseClient = null;
  function getSupabase() {
    if (supabaseClient) return supabaseClient;
    try {
      supabaseClient = createSupabaseClient();
    } catch (err) {
      console.error("Supabase init failed:", err);
      return null;
    }
    return supabaseClient;
  }
  const policy = () => window.ACADEMY_POLICY || {};
  const roles = () => window.ACADEMY_ROLES || {};

  const PATH_META = {
    player: { group: "members", label: "لاعب", step: "تسجيل لاعب" },
    guardian: { group: "members", label: "ولي أمر", step: "ربط أو متابعة" },
    academy_member: { group: "members", label: "عضو أكاديمي", step: "متابعة وفعاليات" },
    staff: { group: "staff", label: "طلب وظيفة / كادر", step: "انضمام ككادر" },
    supporter: { group: "community", label: "داعم", step: "شراكة ودعم" }
  };

  let activeType = "player";
  let selectedGuardianGoal = "";
  let selectedPlayers = [];
  let searchTimer = null;
  let staffDomainId = "";
  let staffRoleId = "";

  const $ = (id) => document.getElementById(id);

  function showToast(message, type = "success") {
    const wrap = $("toastWrap");
    const t = document.createElement("div");
    t.className = "toast " + type;
    t.textContent = message;
    wrap.appendChild(t);
    setTimeout(() => {
      t.style.opacity = "0";
      t.style.transform = "translateY(8px)";
      t.style.transition = ".2s ease";
      setTimeout(() => t.remove(), 220);
    }, 3200);
  }

  function generateReferenceCode() {
    const n = new Date();
    return `REQ-${n.getFullYear()}${String(n.getMonth() + 1).padStart(2, "0")}${String(n.getDate()).padStart(2, "0")}-${Math.floor(Math.random() * 9000) + 1000}`;
  }

  function escapeHtml(v) {
    return String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function parseHijriDate(v) {
    return policy().parseHijriDate ? policy().parseHijriDate(v) : null;
  }
  function calcHijriAge(birth) {
    return policy().calcHijriAge ? policy().calcHijriAge(birth) : null;
  }

  function autoSelectCategoryByAge(age) {
    const select = $("ageCategory");
    const hidden = $("ageCategoryHidden");
    if (!select || !policy().autoCategoryByHijriAge) return;
    const val = policy().autoCategoryByHijriAge(age);
    const opt = [...select.options].find((o) => o.value === val || o.textContent.trim() === val);
    if (opt) select.value = opt.value;
    if (hidden) hidden.value = val || "";
  }

  function refreshHijriTodayHint() {
    const el = $("hijriTodayHint");
    if (el && policy().formatHijriTodayLabel) el.textContent = "اليوم الهجري: " + policy().formatHijriTodayLabel();
  }

  function getSelectedMemberInterests() {
    return [...document.querySelectorAll('input[name="memberInterests"]:checked')].map((x) => x.value);
  }

  function updateMinorGuardianVisibility() {
    const age = Number($("playerAge")?.value || 0);
    const isPlayer = activeType === "player";
    const isMinor = isPlayer && policy().isMinorHijriAge && policy().isMinorHijriAge(age);
    const isAdult = isPlayer && policy().isAdultHijriAge && policy().isAdultHijriAge(age);
    const box = $("minorGuardianBox");
    const banMinor = $("playerAgeBannerMinor");
    const banAdult = $("playerAgeBannerAdult");
    if (box) box.style.display = isMinor ? "block" : "none";
    if (banMinor) banMinor.style.display = isMinor ? "block" : "none";
    if (banAdult) banAdult.style.display = isAdult ? "block" : "none";
    if (!isMinor) {
      ["relationship", "guardianName", "guardianPhone", "guardianNationalId"].forEach((id) => {
        if ($(id)) $(id).value = "";
      });
    }
  }

  function syncStaffHiddenFields() {
    const d = $("staffDomain");
    const r = $("staffRole");
    if (d) d.value = staffDomainId;
    if (r) r.value = staffRoleId;
  }

  function renderStaffDomainTiles() {
    const wrap = $("staffDomainTiles");
    if (!wrap || !roles().getDomains) return;
    wrap.innerHTML = roles()
      .getDomains()
      .map(
        (d) =>
          `<button type="button" class="domain-tile${staffDomainId === d.id ? " active" : ""}" data-domain="${d.id}"><span class="domain-tile-label">${escapeHtml(d.label)}</span><span class="domain-tile-count">${roles().getRoles(d.id).length} أدوار</span></button>`
      )
      .join("");
    wrap.querySelectorAll(".domain-tile").forEach((btn) => {
      btn.addEventListener("click", () => {
        staffDomainId = btn.dataset.domain;
        staffRoleId = "";
        renderStaffDomainTiles();
        renderStaffRoleChips();
        updateStaffSportsFields();
        syncStaffHiddenFields();
      });
    });
  }

  function renderStaffRoleChips() {
    const wrap = $("staffRoleChips");
    const hint = $("staffRoleHint");
    if (!wrap || !roles().getRoles) return;
    if (!staffDomainId) {
      wrap.innerHTML = "";
      if (hint) hint.textContent = "اختر المجال أولاً لعرض الأدوار المتاحة.";
      return;
    }
    const list = roles().getRoles(staffDomainId);
    if (hint) hint.textContent = `اختر دوراً واحداً من ${list.length} وظيفة في مجال ${roles().getDomainLabel(staffDomainId)}.`;
    wrap.innerHTML = list
      .map(
        (r) =>
          `<button type="button" class="role-chip${staffRoleId === r.id ? " active" : ""}" data-role="${r.id}">${escapeHtml(r.label)}</button>`
      )
      .join("");
    wrap.querySelectorAll(".role-chip").forEach((btn) => {
      btn.addEventListener("click", () => {
        staffRoleId = btn.dataset.role;
        renderStaffRoleChips();
        updateStaffSportsFields();
        syncStaffHiddenFields();
      });
    });
  }

  function initStaffForm() {
    const specSel = $("staffSpecialty");
    const catSel = $("staffCategory");
    if (specSel && roles().COACH_SPECIALTIES) {
      specSel.innerHTML =
        '<option value="">اختر التخصص</option>' +
        roles().COACH_SPECIALTIES.map((s) => `<option>${s}</option>`).join("");
    }
    if (catSel && roles().AGE_CATEGORIES) {
      catSel.innerHTML =
        '<option value="">اختر الفئة</option>' +
        roles().AGE_CATEGORIES.map((c) => `<option>${c}</option>`).join("");
    }
    renderStaffDomainTiles();
    renderStaffRoleChips();
  }

  function updateStaffSportsFields() {
    const show =
      roles().isSportsDomain &&
      roles().isSportsDomain(staffDomainId) &&
      roles().needsSportsDetail &&
      roles().needsSportsDetail(staffRoleId);
    document.querySelectorAll(".staff-sports-only").forEach((el) => {
      el.style.display = show ? "grid" : "none";
    });
  }

  function updatePathUI() {
    const meta = PATH_META[activeType] || { label: activeType, step: "" };
    document.querySelectorAll(".path-card").forEach((c) => {
      c.classList.toggle("active", c.dataset.type === activeType);
    });
    document.querySelectorAll(".type-panel").forEach((p) => {
      p.classList.toggle("active", p.dataset.panel === activeType);
    });
    const stepEl = $("activePathLabel");
    const titleEl = $("formStepTitle");
    if (stepEl) stepEl.textContent = meta.label;
    if (titleEl) titleEl.textContent = meta.step;
    const formShell = $("formShell");
    if (formShell) formShell.classList.add("visible");
    window.scrollTo({ top: formShell ? formShell.offsetTop - 90 : 0, behavior: "smooth" });
  }

  function syncFormValidation() {
    const birth = $("playerBirthHijri");
    if (birth) birth.required = activeType === "player";
    const email = $("email");
    const emailMark = $("emailRequiredMark");
    if (email) email.required = activeType === "staff";
    if (emailMark) emailMark.style.display = activeType === "staff" ? "inline" : "none";
  }

  function activateType(type) {
    activeType = type;
    if (type !== "guardian") clearGuardianTransient();
    updateMinorGuardianVisibility();
    syncFormValidation();
    updatePathUI();
  }

  function clearGuardianTransient() {
    selectedGuardianGoal = "";
    if ($("guardianGoal")) $("guardianGoal").value = "";
    document.querySelectorAll(".goal-btn").forEach((b) => b.classList.remove("active"));
    updateGuardianGoalView();
  }

  function setGuardianGoal(goal) {
    selectedGuardianGoal = goal;
    if ($("guardianGoal")) $("guardianGoal").value = goal;
    document.querySelectorAll(".goal-btn").forEach((b) => b.classList.toggle("active", b.dataset.goal === goal));
    updateGuardianGoalView();
  }

  function updateGuardianGoalView() {
    const goal = $("guardianGoal")?.value || "";
    document.querySelectorAll(".guardian-common").forEach((el) => (el.style.display = goal ? "grid" : "none"));
    document.querySelectorAll(".guardian-player-related").forEach((el) => {
      el.style.display = goal === "register_new_player" || goal === "link_existing_player" ? "grid" : "none";
    });
    document.querySelectorAll(".guardian-new-player").forEach((el) => {
      el.style.display = goal === "register_new_player" ? "grid" : "none";
    });
    document.querySelectorAll(".guardian-existing-player").forEach((el) => {
      el.style.display = goal === "link_existing_player" ? "grid" : "none";
    });
    if (goal !== "link_existing_player") {
      selectedPlayers = [];
      renderSelectedPlayers();
      if ($("existingPlayerSearch")) $("existingPlayerSearch").value = "";
      renderSuggestions([]);
    }
  }

  function renderSuggestions(players) {
    const box = $("playerSuggestions");
    if (!players.length) {
      box.classList.remove("show");
      box.innerHTML = "";
      return;
    }
    box.innerHTML = players
      .map(
        (p) =>
          `<button type="button" class="player-suggestion" data-id="${escapeHtml(p.id)}"><span><strong>${escapeHtml(p.full_name || "بدون اسم")}</strong><small>${escapeHtml([p.code, p.category, p.position, p.phone].filter(Boolean).join(" • "))}</small></span><span>اختيار</span></button>`
      )
      .join("");
    box.classList.add("show");
    box.querySelectorAll(".player-suggestion").forEach((btn) => {
      btn.addEventListener("click", () => {
        const p = players.find((x) => String(x.id) === String(btn.dataset.id));
        if (p) addSelectedPlayer(p);
      });
    });
  }

  function addSelectedPlayer(player) {
    const count = Number($("childrenCount").value || 0);
    if (count && selectedPlayers.length >= count) {
      showToast("وصلت للعدد المسجل من الأبناء.", "warn");
      return;
    }
    if (selectedPlayers.some((p) => String(p.id) === String(player.id))) {
      showToast("هذا اللاعب تم اختياره مسبقًا.", "warn");
      return;
    }
    selectedPlayers.push(player);
    renderSelectedPlayers();
    $("existingPlayerSearch").value = "";
    renderSuggestions([]);
  }

  function renderSelectedPlayers() {
    const wrap = $("selectedPlayers");
    const ids = $("existingPlayerIds");
    const names = $("existingPlayerNames");
    ids.value = selectedPlayers.map((p) => p.id).join(",");
    names.value = selectedPlayers
      .map((p) => p.full_name || "")
      .filter(Boolean)
      .join("، ");
    wrap.innerHTML = selectedPlayers
      .map(
        (p) =>
          `<span class="selected-chip">${escapeHtml(p.full_name || "لاعب")}<button type="button" data-id="${escapeHtml(p.id)}">×</button></span>`
      )
      .join("");
    wrap.classList.toggle("show", selectedPlayers.length > 0);
    wrap.querySelectorAll("button").forEach((b) => {
      b.addEventListener("click", () => {
        selectedPlayers = selectedPlayers.filter((p) => String(p.id) !== String(b.dataset.id));
        renderSelectedPlayers();
      });
    });
  }

  async function searchPlayers(q) {
    const term = String(q || "")
      .trim()
      .replace(/[%,]/g, "");
    if (term.length < 1) {
      renderSuggestions([]);
      return;
    }
    const sb = getSupabase();
    if (!sb) {
      showToast("تعذر الاتصال بقاعدة البيانات.", "error");
      return;
    }
    try {
      const data =
        typeof searchPlayersPublic === "function"
          ? await searchPlayersPublic(term)
          : [];
      renderSuggestions(data);
    } catch (error) {
      console.error(error);
      showToast("تعذر البحث عن اللاعبين.", "error");
    }
  }

  function validate(formData) {
    if (!$("confirmPolicy")?.checked) {
      showToast("يجب الموافقة على إرسال الطلب للمراجعة.", "warn");
      $("confirmPolicy")?.focus();
      return false;
    }
    if (!formData.fullName?.trim()) {
      showToast("الاسم الكامل مطلوب.", "warn");
      $("fullName").focus();
      return false;
    }
    if (!formData.nationalId?.trim()) {
      showToast("رقم الهوية مطلوب.", "warn");
      $("nationalId").focus();
      return false;
    }
    if (!formData.phone?.trim()) {
      showToast("رقم الجوال مطلوب.", "warn");
      $("phone").focus();
      return false;
    }
    if (activeType === "player") {
      const birthRaw = String(formData.playerBirthHijri || "").trim();
      if (!birthRaw) {
        showToast("تاريخ الميلاد الهجري مطلوب.", "warn");
        return false;
      }
      const birth = parseHijriDate(birthRaw);
      if (!birth) {
        showToast("صيغة التاريخ الهجري غير صحيحة.", "warn");
        return false;
      }
      const age = calcHijriAge(birth);
      if (age === null) {
        showToast("تعذر حساب العمر.", "warn");
        return false;
      }
      if (policy().isMinorHijriAge && policy().isMinorHijriAge(age)) {
        if (!formData.relationship || !formData.guardianName?.trim() || !formData.guardianPhone?.trim()) {
          showToast("بيانات ولي الأمر مطلوبة للقاصر.", "warn");
          return false;
        }
      }
      if (!formData.ageCategory || !formData.position) {
        showToast("أكمل بيانات اللاعب.", "warn");
        return false;
      }
    }
    if (activeType === "guardian") {
      const goal = formData.guardianGoal;
      if (!goal) {
        showToast("اختر الغرض من التسجيل.", "warn");
        return false;
      }
      if (!formData.academyRelationship) {
        showToast("اختر صلة القرابة.", "warn");
        return false;
      }
      if (goal === "register_new_player") {
        if (!formData.childName?.trim() || !formData.guardianPlayerAge || !formData.guardianPlayerCategory || !formData.guardianPlayerPosition) {
          showToast("أكمل بيانات اللاعب الجديد.", "warn");
          return false;
        }
      }
      if (goal === "link_existing_player") {
        const count = Number(formData.childrenCount || 0);
        if (!count || selectedPlayers.length === 0 || selectedPlayers.length !== count) {
          showToast("عدّد الأبناء واختر اللاعبين المطابقين.", "warn");
          return false;
        }
      }
    }
    if (activeType === "staff") {
      syncStaffHiddenFields();
      if (!staffDomainId || !staffRoleId) {
        showToast("اختر المجال والدور.", "warn");
        return false;
      }
      if (!formData.email?.trim()) {
        showToast("البريد الإلكتروني مطلوب لتفعيل حساب الكادر بعد الاعتماد.", "warn");
        $("email")?.focus();
        return false;
      }
    }
    if (activeType === "academy_member" && !getSelectedMemberInterests().length) {
      showToast("اختر اهتماماً واحداً على الأقل.", "warn");
      return false;
    }
    return true;
  }

  const JOIN_REQUEST_ALLOWED_COLUMNS = new Set([
    "id", "request_type", "full_name", "national_id", "phone", "email", "city",
    "player_age", "birth_date", "birth_hijri", "age_category", "position", "player_notes",
    "child_name", "relationship", "children_count", "guardian_goal", "guardian_notes",
    "support_type", "support_level", "entity_name", "support_method", "support_notes",
    "volunteer_field", "availability", "volunteer_notes", "created_at", "status", "admin_notes",
    "reviewed_at", "updated_at", "reference_code", "notes", "guardian_relation", "guardian_name",
    "guardian_phone", "guardian_national_id", "child_age", "child_category", "child_position",
    "linked_player_id", "linked_player_ids", "coach_specialty", "coach_experience", "supporter_type"
  ]);

  function cleanText(value) {
    const text = String(value ?? "").trim();
    return text ? text : null;
  }
  function cleanNumber(value) {
    const text = String(value ?? "").trim();
    if (!text) return null;
    const n = Number(text);
    return Number.isFinite(n) ? n : null;
  }
  function filterAllowedColumns(row) {
    return Object.fromEntries(
      Object.entries(row).filter(([key, value]) => JOIN_REQUEST_ALLOWED_COLUMNS.has(key) && value !== undefined)
    );
  }

  function buildNotes(data, selectedNames, selectedIds) {
    const lines = [];
    if (activeType === "player" && cleanText(data.playerNotes)) lines.push(cleanText(data.playerNotes));
    if (activeType === "guardian") {
      if (cleanText(data.guardianNotes)) lines.push(cleanText(data.guardianNotes));
      if (selectedNames) lines.push(`اللاعبون المختارون: ${selectedNames}`);
      if (selectedIds.length) lines.push(`معرّفات: ${selectedIds.join("، ")}`);
    }
    if (activeType === "staff") {
      const extra = [];
      if (cleanText(data.staffSpecialty)) extra.push("التخصص: " + cleanText(data.staffSpecialty));
      if (cleanText(data.staffCategory)) extra.push("الفئة: " + cleanText(data.staffCategory));
      if (cleanText(data.staffCertification)) extra.push("المؤهل: " + cleanText(data.staffCertification));
      if (cleanText(data.staffBio)) extra.push("نبذة: " + cleanText(data.staffBio));
      if (cleanText(data.staffNotes)) extra.push(cleanText(data.staffNotes));
      if (roles().formatStaffNotes) lines.push(roles().formatStaffNotes(staffDomainId, staffRoleId, extra));
    }
    if (activeType === "academy_member") {
      const ints = getSelectedMemberInterests();
      if (ints.length) lines.push("الاهتمامات: " + ints.join("، "));
      if (cleanText(data.memberNotes)) lines.push(cleanText(data.memberNotes));
    }
    if (activeType === "supporter" && cleanText(data.supportNotes)) lines.push(cleanText(data.supportNotes));
    return lines.filter(Boolean).join("\n") || null;
  }

  function buildPayload(data) {
    const selectedNames = selectedPlayers.map((p) => cleanText(p.full_name)).filter(Boolean).join("، ");
    const selectedIds = selectedPlayers.map((p) => p.id).filter(Boolean);
    const reference_code = generateReferenceCode();
    const notes = buildNotes(data, selectedNames, selectedIds);
    const base = {
      reference_code,
      request_type: activeType,
      status: "new",
      full_name: cleanText(data.fullName),
      national_id: cleanText(data.nationalId),
      phone: cleanText(data.phone),
      email: cleanText(data.email),
      city: cleanText(data.city),
      notes
    };
    if (activeType === "player") {
      Object.assign(base, {
        player_age: cleanNumber(data.playerAge),
        birth_hijri: cleanText(data.playerBirthHijri),
        age_category: cleanText(data.ageCategory),
        position: cleanText(data.position),
        player_notes: cleanText(data.playerNotes),
        relationship:
          policy().isMinorHijriAge && policy().isMinorHijriAge(Number(data.playerAge || 0))
            ? cleanText(data.relationship)
            : null,
        guardian_name:
          policy().isMinorHijriAge && policy().isMinorHijriAge(Number(data.playerAge || 0))
            ? cleanText(data.guardianName)
            : null,
        guardian_phone:
          policy().isMinorHijriAge && policy().isMinorHijriAge(Number(data.playerAge || 0))
            ? cleanText(data.guardianPhone)
            : null,
        guardian_national_id:
          policy().isMinorHijriAge && policy().isMinorHijriAge(Number(data.playerAge || 0))
            ? cleanText(data.guardianNationalId)
            : null
      });
    }
    if (activeType === "guardian") {
      Object.assign(base, {
        child_name: cleanText(data.childName) || selectedNames || null,
        relationship: cleanText(data.academyRelationship),
        guardian_relation: cleanText(data.academyRelationship),
        children_count: cleanNumber(data.childrenCount),
        guardian_goal: cleanText(data.guardianGoal),
        guardian_notes: notes,
        child_age: cleanNumber(data.guardianPlayerAge),
        child_category: cleanText(data.guardianPlayerCategory),
        child_position: cleanText(data.guardianPlayerPosition),
        linked_player_id: selectedIds[0] || null,
        linked_player_ids: selectedIds.length ? selectedIds : null
      });
    }
    if (activeType === "academy_member") {
      Object.assign(base, { guardian_notes: notes, notes });
    }
    if (activeType === "staff") {
      const roleLabel = roles().getRoleLabel ? roles().getRoleLabel(staffRoleId) : staffRoleId;
      Object.assign(base, {
        volunteer_field: staffDomainId,
        coach_specialty: roleLabel,
        coach_experience: cleanText(data.staffExperienceYears),
        availability: cleanText(data.staffAvailability),
        volunteer_notes: [cleanText(data.staffBio), cleanText(data.staffNotes)].filter(Boolean).join("\n") || null,
        notes
      });
    }
    if (activeType === "supporter") {
      Object.assign(base, {
        supporter_type: cleanText(data.supportType),
        support_type: cleanText(data.supportType),
        support_level: cleanText(data.supportLevel),
        entity_name: cleanText(data.entityName),
        support_method: cleanText(data.supportMethod),
        support_notes: cleanText(data.supportNotes)
      });
    }
    return filterAllowedColumns(base);
  }

  async function insertJoinRequest(payload) {
    const sb = getSupabase();
    if (!sb) {
      showToast("تعذر الاتصال بقاعدة البيانات. حدّث الصفحة وحاول مرة أخرى.", "error");
      throw new Error("Supabase unavailable");
    }
    const { error } = await sb.from("join_requests").insert([payload]);
    if (error) throw error;
  }

  function showStatusFollow(referenceCode, phone) {
    const box = $("statusFollowBox");
    const link = $("statusFollowLink");
    if (!box || !link) return;
    const params = new URLSearchParams();
    if (referenceCode) params.set("ref", referenceCode);
    if (phone) params.set("phone", phone);
    link.href = `request_status.html?${params.toString()}`;
    box.style.display = "grid";
  }

  const ALLOWED_PATH_TYPES = new Set([
    "player",
    "guardian",
    "academy_member",
    "staff",
    "supporter"
  ]);

  function applyTypeFromUrl() {
    const raw = new URLSearchParams(window.location.search).get("type");
    if (!raw || !ALLOWED_PATH_TYPES.has(raw)) return;
    activateType(raw);
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".path-card").forEach((btn) => {
      btn.addEventListener("click", () => activateType(btn.dataset.type));
    });
    document.querySelectorAll(".goal-btn").forEach((btn) => {
      btn.addEventListener("click", () => setGuardianGoal(btn.dataset.goal));
    });
    $("childrenCount")?.addEventListener("input", () => {
      const c = Number($("childrenCount").value || 0);
      if (c && selectedPlayers.length > c) {
        selectedPlayers = selectedPlayers.slice(0, c);
        renderSelectedPlayers();
      }
    });
    $("existingPlayerSearch")?.addEventListener("input", (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => searchPlayers(e.target.value), 220);
    });
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".guardian-existing-player")) renderSuggestions([]);
    });
    initStaffForm();
    refreshHijriTodayHint();
    applyTypeFromUrl();
    updatePathUI();

    const handleBirthHijriInput = () => {
      const birth = parseHijriDate($("playerBirthHijri").value);
      const age = calcHijriAge(birth);
      if (age !== null) {
        $("playerAge").value = String(age);
        autoSelectCategoryByAge(age);
      } else {
        $("playerAge").value = "";
        autoSelectCategoryByAge(NaN);
      }
      updateMinorGuardianVisibility();
    };
    ["input", "change", "blur"].forEach((evt) => $("playerBirthHijri")?.addEventListener(evt, handleBirthHijriInput));
    $("playerAge")?.addEventListener("input", updateMinorGuardianVisibility);

    syncFormValidation();

    $("joinForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const formEl = e.currentTarget;
      const btn = formEl.querySelector('button[type="submit"].submit-btn');
      if (!btn) return;
      syncStaffHiddenFields();
      const data = Object.fromEntries(new FormData(formEl).entries());
      if (!validate(data)) return;
      const payload = buildPayload(data);
      btn.disabled = true;
      btn.textContent = "جاري الإرسال...";
      try {
        await insertJoinRequest(payload);
        showToast(`تم إرسال الطلب. المرجع: ${payload.reference_code}`, "success");
        showStatusFollow(payload.reference_code, payload.phone);
        formEl.reset();
        staffDomainId = "";
        staffRoleId = "";
        renderStaffDomainTiles();
        renderStaffRoleChips();
        selectedPlayers = [];
        renderSelectedPlayers();
        activateType(activeType);
      } catch (err) {
        console.error(err);
        showToast("تعذر إرسال الطلب.", "error");
      } finally {
        btn.disabled = false;
        btn.textContent = "إرسال الطلب";
      }
    });
  });
})();
