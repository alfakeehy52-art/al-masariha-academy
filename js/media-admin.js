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
    resetBtn: document.getElementById("resetMediaFormBtn")
  };

  let rows = [];

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
        <button type="button" class="mini-btn" data-edit="${esc(m.id)}">تعديل</button>
        <button type="button" class="mini-btn" data-del="${esc(m.id)}">حذف</button>
      </div></td>
    </tr>`
      )
      .join("");
    els.tbody.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => editRow(btn.getAttribute("data-edit")));
    });
    els.tbody.querySelectorAll("[data-del]").forEach((btn) => {
      btn.addEventListener("click", () => deleteRow(btn.getAttribute("data-del")));
    });
  }

  function editRow(id) {
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
      if (els.tbody) els.tbody.innerHTML = `<tr><td colspan="6" class="empty-state">تعذر التحميل — نفّذ NEWS_MEDIA_RLS.sql</td></tr>`;
      return;
    }
    rows = Array.isArray(data) ? data : [];
    renderStats();
    renderTable();
  }

  async function saveRow(e) {
    e.preventDefault();
    const id = els.mediaId.value.trim();
    const payload = {
      title: els.title.value.trim(),
      description: els.description.value.trim() || null,
      media_type: els.mediaType.value,
      emoji: els.emoji.value.trim() || (els.mediaType.value === "video" ? "▶" : "📷"),
      image_url: els.imageUrl.value.trim() || null,
      video_url: els.videoUrl.value.trim() || null,
      published_at: els.publishedAt.value ? new Date(els.publishedAt.value).toISOString() : null,
      sort_order: Number(els.sortOrder.value) || 0,
      status: els.status.value,
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
      alert("تعذر الحفظ. تأكد من سياسات RLS.");
      return;
    }
    resetForm();
    await loadRows();
  }

  async function deleteRow(id) {
    if (!id || !confirm("حذف هذا الوسيط؟")) return;
    const { error } = await supabaseClient.from("academy_media").delete().eq("id", id);
    if (error) {
      alert("تعذر الحذف.");
      return;
    }
    await loadRows();
  }

  async function seedDefaults() {
    if (!confirm("تحميل وسائط أمثلة؟")) return;
    const { error } = await supabaseClient.from("academy_media").insert(DEFAULT_SEED);
    if (error) {
      console.error(error);
      alert("تعذر التحميل — ربما الجدول غير جاهز بعد.");
      return;
    }
    await loadRows();
  }

  document.addEventListener("DOMContentLoaded", () => {
    els.form?.addEventListener("submit", saveRow);
    els.resetBtn?.addEventListener("click", resetForm);
    els.seedBtn?.addEventListener("click", seedDefaults);
    loadRows();
  });
})();
