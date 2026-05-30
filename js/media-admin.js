(function () {
  if (typeof createSupabaseClient !== "function") return;
  const supabaseClient = createSupabaseClient();

  const DEFAULT_SEED = [
    { title: "لقطة تدريب جماعي", description: "تدريبات الفريق الأول", media_type: "photo", emoji: "📷", published_at: new Date(Date.now() - 86400000).toISOString(), status: "published", sort_order: 1, is_featured: false },
    { title: "احتفال الفوز", description: "بعد المباراة الودية", media_type: "photo", emoji: "🏆", published_at: new Date(Date.now() - 2 * 86400000).toISOString(), status: "published", sort_order: 2, is_featured: false },
    { title: "تمرينات المهاجمين", description: "حصة تهديف", media_type: "photo", emoji: "⚽", published_at: new Date(Date.now() - 3 * 86400000).toISOString(), status: "published", sort_order: 3, is_featured: false },
    { title: "زي الأكاديمية", description: "معاينة الزي الجديد", media_type: "photo", emoji: "👕", published_at: new Date(Date.now() - 4 * 86400000).toISOString(), status: "published", sort_order: 4, is_featured: false },
    {
      title: "أفضل أهداف الأسبوع",
      description: "ملخص لأجمل الأهداف في مباريات الأكاديمية.",
      media_type: "video",
      emoji: "▶",
      video_url: null,
      published_at: new Date(Date.now() - 86400000).toISOString(),
      status: "published",
      sort_order: 10,
      is_featured: true
    },
    {
      title: "لقطات من التدريبات",
      description: "جانب من تدريبات اللاعبين.",
      media_type: "video",
      emoji: "▶",
      published_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      status: "published",
      sort_order: 11,
      is_featured: false
    },
    {
      title: "ملخص المباراة الأخيرة",
      description: "أبرز لقطات المباراة الأخيرة.",
      media_type: "video",
      emoji: "▶",
      published_at: new Date(Date.now() - 6 * 86400000).toISOString(),
      status: "published",
      sort_order: 12,
      is_featured: false
    }
  ];

  const els = {
    form: document.getElementById("mediaForm"),
    mediaId: document.getElementById("mediaId"),
    title: document.getElementById("mediaTitle"),
    description: document.getElementById("mediaDescription"),
    mediaType: document.getElementById("mediaType"),
    emoji: document.getElementById("mediaEmoji"),
    imageUrl: document.getElementById("mediaImageUrl"),
    videoUrl: document.getElementById("mediaVideoUrl"),
    publishedAt: document.getElementById("mediaPublishedAt"),
    sortOrder: document.getElementById("mediaSortOrder"),
    status: document.getElementById("mediaStatus"),
    featured: document.getElementById("mediaFeatured"),
    tbody: document.getElementById("mediaTableBody"),
    empty: document.getElementById("emptyMediaState"),
    total: document.getElementById("totalMedia"),
    photos: document.getElementById("photoMediaCount"),
    videos: document.getElementById("videoMediaCount"),
    seedBtn: document.getElementById("seedMediaBtn"),
    resetBtn: document.getElementById("resetMediaFormBtn"),
    submitBtn: document.querySelector("#mediaForm button[type='submit']")
  };

  let rows = [];
  let mediaCanCreate = false;
  let mediaCanEdit = false;
  let mediaCanPublish = false;
  let mediaCanDelete = false;

  function mediaNotify(msg) {
    if (typeof flashPanelDenied === "function") flashPanelDenied(msg);
    else alert(msg);
  }

  function applyMediaUi() {
    mediaCanCreate = typeof window.canCreateMediaNow === "function" && window.canCreateMediaNow();
    mediaCanEdit = typeof window.canEditMediaNow === "function" && window.canEditMediaNow();
    mediaCanPublish = typeof window.canPublishMediaNow === "function" && window.canPublishMediaNow();
    mediaCanDelete = typeof window.canDeleteMediaNow === "function" && window.canDeleteMediaNow();

    const canUseForm = mediaCanCreate || mediaCanEdit;
    const formInputs = [
      els.title,
      els.description,
      els.mediaType,
      els.emoji,
      els.imageUrl,
      els.videoUrl,
      els.publishedAt,
      els.sortOrder,
      els.featured
    ];
    formInputs.forEach((input) => {
      if (!input) return;
      input.disabled = !canUseForm;
    });

    if (els.status) {
      if (!mediaCanPublish) {
        els.status.value = "draft";
        els.status.disabled = true;
        els.status.querySelectorAll("option").forEach((opt) => {
          opt.hidden = opt.value !== "draft";
          opt.disabled = opt.value !== "draft";
        });
      } else {
        els.status.disabled = !canUseForm;
        els.status.querySelectorAll("option").forEach((opt) => {
          opt.hidden = false;
          opt.disabled = false;
        });
      }
    }

    if (els.submitBtn) {
      els.submitBtn.disabled = !mediaCanCreate && !mediaCanEdit;
      els.submitBtn.textContent = mediaCanPublish ? "حفظ" : "حفظ مسودة";
    }
    if (els.seedBtn) els.seedBtn.hidden = !mediaCanPublish;
    if (els.resetBtn) els.resetBtn.disabled = !canUseForm;

    let note = document.getElementById("mediaRbacNote");
    if (mediaCanCreate && !mediaCanPublish) {
      if (!note && els.form) {
        note = document.createElement("p");
        note.id = "mediaRbacNote";
        note.className = "lead";
        note.style.cssText = "color:#ffe79c;font-weight:800;margin:0 0 14px";
        note.textContent =
          "يُحفظ رفعك كمسودة — النشر يتم من مشرف المحتوى (L3) أو مدير الإعلام (L2).";
        els.form.parentElement?.insertBefore(note, els.form);
      }
    } else if (note) {
      note.remove();
    }
  }

  function esc(v) {
    return String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function fmtDate(v) {
    if (!v) return "—";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("ar-SA", { year: "numeric", month: "2-digit", day: "2-digit" });
  }

  function statusLabel(s) {
    return { published: "منشور", draft: "مسودة", archived: "مؤرشف" }[String(s || "")] || s;
  }

  function typeLabel(t) {
    return t === "video" ? "فيديو" : "صورة";
  }

  function resetForm() {
    if (els.mediaId) els.mediaId.value = "";
    if (els.form) els.form.reset();
    if (els.emoji) els.emoji.value = "📷";
    if (els.mediaType) els.mediaType.value = "photo";
    if (els.sortOrder) els.sortOrder.value = "0";
    if (els.featured) els.featured.checked = false;
    if (els.status) els.status.value = "draft";
    applyMediaUi();
  }

  function renderStats() {
    if (els.total) els.total.textContent = rows.length;
    if (els.photos) els.photos.textContent = rows.filter((r) => r.media_type === "photo").length;
    if (els.videos) els.videos.textContent = rows.filter((r) => r.media_type === "video").length;
  }

  function renderTable() {
    if (!els.tbody) return;
    if (!rows.length) {
      els.tbody.innerHTML = "";
      if (els.empty) els.empty.style.display = "block";
      return;
    }
    if (els.empty) els.empty.style.display = "none";
    els.tbody.innerHTML = rows
      .map(
        (m) => `<tr>
      <td>${esc(m.emoji || "📷")} <b>${esc(m.title)}</b></td>
      <td>${esc(typeLabel(m.media_type))}</td>
      <td>${esc(fmtDate(m.published_at))}</td>
      <td><span class="status-pill status-${esc(m.status)}">${esc(statusLabel(m.status))}</span></td>
      <td>${m.is_featured ? "⭐" : "—"}</td>
      <td><div class="table-actions">
        ${mediaCanPublish && m.status === "draft" ? `<button type="button" class="mini-btn mini-btn-accent" data-pub="${esc(m.id)}">نشر</button>` : ""}
        ${mediaCanEdit ? `<button type="button" class="mini-btn" data-edit="${esc(m.id)}">تعديل</button>` : ""}
        ${mediaCanDelete ? `<button type="button" class="mini-btn" data-del="${esc(m.id)}">حذف</button>` : ""}
        ${!mediaCanEdit && !mediaCanDelete && !(mediaCanPublish && m.status === "draft") ? `<span class="subtext">عرض فقط</span>` : ""}
      </div></td>
    </tr>`
      )
      .join("");
    els.tbody.querySelectorAll("[data-pub]").forEach((btn) => {
      btn.addEventListener("click", () => publishRow(btn.getAttribute("data-pub")));
    });
    els.tbody.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => editRow(btn.getAttribute("data-edit")));
    });
    els.tbody.querySelectorAll("[data-del]").forEach((btn) => {
      btn.addEventListener("click", () => deleteRow(btn.getAttribute("data-del")));
    });
  }

  function editRow(id) {
    if (typeof guardMediaEdit === "function" && !guardMediaEdit(mediaNotify)) return;
    const m = rows.find((r) => String(r.id) === String(id));
    if (!m) return;
    els.mediaId.value = m.id;
    els.title.value = m.title || "";
    els.description.value = m.description || "";
    els.mediaType.value = m.media_type || "photo";
    els.emoji.value = m.emoji || "📷";
    els.imageUrl.value = m.image_url || "";
    els.videoUrl.value = m.video_url || "";
    if (m.published_at && els.publishedAt) {
      const d = new Date(m.published_at);
      els.publishedAt.value = Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 16);
    } else if (els.publishedAt) els.publishedAt.value = "";
    els.sortOrder.value = m.sort_order ?? 0;
    els.status.value = m.status || "draft";
    els.featured.checked = !!m.is_featured;
    applyMediaUi();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function loadRows() {
    const { data, error } = await supabaseClient
      .from("academy_media")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("published_at", { ascending: false });
    if (error) {
      console.error(error);
      rows = [];
      if (els.tbody) els.tbody.innerHTML = `<tr><td colspan="6" class="empty-state">تعذر التحميل</td></tr>`;
      return;
    }
    rows = Array.isArray(data) ? data : [];
    renderStats();
    renderTable();
  }

  async function saveRow(e) {
    e.preventDefault();
    const id = els.mediaId.value.trim();
    if (id) {
      if (typeof guardMediaEdit === "function" && !guardMediaEdit(mediaNotify)) return;
    } else if (typeof guardMediaCreate === "function" && !guardMediaCreate(mediaNotify)) {
      return;
    }

    let status = els.status?.value || "draft";
    if (!mediaCanPublish) status = "draft";
    if (status === "published" && typeof guardMediaPublish === "function" && !guardMediaPublish(mediaNotify)) {
      status = "draft";
    }

    const payload = {
      title: els.title.value.trim(),
      description: els.description.value.trim() || null,
      media_type: els.mediaType.value,
      emoji: els.emoji.value.trim() || (els.mediaType.value === "video" ? "▶" : "📷"),
      image_url: els.imageUrl.value.trim() || null,
      video_url: els.videoUrl.value.trim() || null,
      published_at:
        status === "published" && els.publishedAt.value
          ? new Date(els.publishedAt.value).toISOString()
          : status === "published"
            ? new Date().toISOString()
            : null,
      sort_order: Number(els.sortOrder.value) || 0,
      status,
      is_featured: !!els.featured.checked,
      updated_at: new Date().toISOString()
    };
    if (!payload.title) {
      alert("أدخل عنوان الوسيط.");
      return;
    }
    let error;
    if (id) {
      ({ error } = await supabaseClient.from("academy_media").update(payload).eq("id", id));
    } else {
      ({ error } = await supabaseClient.from("academy_media").insert([payload]));
    }
    if (error) {
      console.error(error);
      alert("تعذر الحفظ.");
      return;
    }
    resetForm();
    await loadRows();
  }

  async function publishRow(id) {
    if (typeof guardMediaPublish === "function" && !guardMediaPublish(mediaNotify)) return;
    const m = rows.find((r) => String(r.id) === String(id));
    if (!m || m.status === "published") return;
    const { error } = await supabaseClient
      .from("academy_media")
      .update({
        status: "published",
        published_at: m.published_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", id);
    if (error) {
      alert("تعذر النشر.");
      return;
    }
    if (typeof logPanelAudit === "function") {
      void logPanelAudit({
        domain: "media",
        action: window.PANEL_AUDIT?.MEDIA_PUBLISH || "media.publish",
        entityType: "academy_media",
        entityId: id,
        summary: `نشر وسيط: ${m.title || id}`,
        meta: { title: m.title || null, media_type: m.media_type || null }
      });
    }
    await loadRows();
  }

  async function deleteRow(id) {
    if (typeof guardMediaDelete === "function" && !guardMediaDelete(mediaNotify)) return;
    if (!id || !confirm("حذف هذا الوسيط؟")) return;
    const { error } = await supabaseClient.from("academy_media").delete().eq("id", id);
    if (error) {
      alert("تعذر الحذف.");
      return;
    }
    if (typeof logPanelAudit === "function") {
      void logPanelAudit({
        domain: "media",
        action: window.PANEL_AUDIT?.MEDIA_DELETE || "media.delete",
        entityType: "academy_media",
        entityId: id,
        summary: "حذف وسيط إعلامي"
      });
    }
    await loadRows();
  }

  async function seedDefaults() {
    if (typeof guardMediaPublish === "function" && !guardMediaPublish(mediaNotify)) return;
    if (!confirm("تحميل وسائط أمثلة؟")) return;
    const { error } = await supabaseClient.from("academy_media").insert(DEFAULT_SEED);
    if (error) {
      console.error(error);
      alert("تعذر التحميل.");
      return;
    }
    await loadRows();
  }

  document.addEventListener("DOMContentLoaded", async () => {
    try {
      if (typeof ensureMediaRbacReady === "function") await ensureMediaRbacReady();
    } catch (e) {
      console.warn("[media-rbac]", e);
    }
    applyMediaUi();
    els.form?.addEventListener("submit", saveRow);
    els.resetBtn?.addEventListener("click", resetForm);
    els.seedBtn?.addEventListener("click", seedDefaults);
    await loadRows();
  });
})();
