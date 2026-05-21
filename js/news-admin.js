(function () {
  if (typeof createSupabaseClient !== "function") return;
  const supabaseClient = createSupabaseClient();

  const DEFAULT_SEED = [
    {
      title: "الأكاديمية تحقق الفوز في مباراة ودية بنتيجة 3 - 1",
      summary:
        "قدّمت أكاديمية المسارحة أداءً مميزًا في المباراة الودية الأخيرة، وسط تألق لافت من عدد من اللاعبين الشباب.",
      body:
        "قدّمت أكاديمية المسارحة لكرة القدم أداءً مميزًا في المباراة الودية الأخيرة، وسط تألق لافت من عدد من اللاعبين الشباب، واستمرار العمل الفني والتدريبي بوتيرة تصاعدية تعكس التطور الملحوظ في الفريق.",
      category: "مباريات",
      emoji: "📰",
      published_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      status: "published",
      is_featured: true
    },
    {
      title: "اختيار محمد القحطاني نجم الأسبوع",
      summary: "تكريم اللاعب بعد أداء مميز في التدريبات والمباريات الودية.",
      category: "نجوم",
      emoji: "⭐",
      published_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      status: "published",
      is_featured: false
    },
    {
      title: "بدء التحضير لإطلاق الزي الرسمي للأكاديمية",
      summary: "خطوات تجهيز الزي الرياضي للفئات العمرية المختلفة.",
      category: "أكاديمية",
      emoji: "👟",
      published_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      status: "published",
      is_featured: false
    },
    {
      title: "توسيع برنامج التدريب للفئات العمرية الصغيرة",
      summary: "برنامج تدريبي موسّع يستهدف بناء المهارات الأساسية مبكرًا.",
      category: "تدريب",
      emoji: "⚽",
      published_at: new Date(Date.now() - 7 * 86400000).toISOString(),
      status: "published",
      is_featured: false
    }
  ];

  const els = {
    form: document.getElementById("newsForm"),
    newsId: document.getElementById("newsId"),
    title: document.getElementById("newsTitle"),
    summary: document.getElementById("newsSummary"),
    body: document.getElementById("newsBody"),
    category: document.getElementById("newsCategory"),
    emoji: document.getElementById("newsEmoji"),
    imageUrl: document.getElementById("newsImageUrl"),
    publishedAt: document.getElementById("newsPublishedAt"),
    status: document.getElementById("newsStatus"),
    featured: document.getElementById("newsFeatured"),
    tbody: document.getElementById("newsTableBody"),
    empty: document.getElementById("emptyNewsState"),
    total: document.getElementById("totalNews"),
    published: document.getElementById("publishedNewsCount"),
    seedBtn: document.getElementById("seedNewsBtn"),
    resetBtn: document.getElementById("resetNewsFormBtn")
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

  function resetForm() {
    if (els.newsId) els.newsId.value = "";
    if (els.form) els.form.reset();
    if (els.emoji) els.emoji.value = "📰";
    if (els.featured) els.featured.checked = false;
    if (els.status) els.status.value = "draft";
  }

  function renderStats() {
    if (els.total) els.total.textContent = rows.length;
    if (els.published) els.published.textContent = rows.filter((r) => r.status === "published").length;
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
        (n) => `<tr>
      <td>${esc(n.emoji || "📰")} <b>${esc(n.title)}</b></td>
      <td>${esc(n.category || "—")}</td>
      <td>${esc(fmtDate(n.published_at))}</td>
      <td><span class="status-pill status-${esc(n.status)}">${esc(statusLabel(n.status))}</span></td>
      <td>${n.is_featured ? "⭐" : "—"}</td>
      <td><div class="table-actions">
        <button type="button" class="mini-btn" data-edit="${esc(n.id)}">تعديل</button>
        <button type="button" class="mini-btn" data-del="${esc(n.id)}">حذف</button>
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
    const n = rows.find((r) => String(r.id) === String(id));
    if (!n) return;
    els.newsId.value = n.id;
    els.title.value = n.title || "";
    els.summary.value = n.summary || "";
    els.body.value = n.body || "";
    els.category.value = n.category || "";
    els.emoji.value = n.emoji || "📰";
    els.imageUrl.value = n.image_url || "";
    if (n.published_at && els.publishedAt) {
      const d = new Date(n.published_at);
      els.publishedAt.value = Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 16);
    } else if (els.publishedAt) els.publishedAt.value = "";
    els.status.value = n.status || "draft";
    els.featured.checked = !!n.is_featured;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function loadRows() {
    const { data, error } = await supabaseClient
      .from("academy_news")
      .select("*")
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
    const id = els.newsId.value.trim();
    const payload = {
      title: els.title.value.trim(),
      summary: els.summary.value.trim() || null,
      body: els.body.value.trim() || null,
      category: els.category.value.trim() || null,
      emoji: els.emoji.value.trim() || "📰",
      image_url: els.imageUrl.value.trim() || null,
      published_at: els.publishedAt.value ? new Date(els.publishedAt.value).toISOString() : null,
      status: els.status.value,
      is_featured: !!els.featured.checked,
      updated_at: new Date().toISOString()
    };
    if (!payload.title) {
      alert("أدخل عنوان الخبر.");
      return;
    }
    let error;
    if (id) {
      ({ error } = await supabaseClient.from("academy_news").update(payload).eq("id", id));
    } else {
      ({ error } = await supabaseClient.from("academy_news").insert([payload]));
    }
    if (error) {
      console.error(error);
      alert("تعذر الحفظ.");
      return;
    }
    resetForm();
    await loadRows();
  }

  async function deleteRow(id) {
    if (!id || !confirm("حذف هذا الخبر؟")) return;
    const { error } = await supabaseClient.from("academy_news").delete().eq("id", id);
    if (error) {
      alert("تعذر الحذف.");
      return;
    }
    await loadRows();
  }

  async function seedDefaults() {
    if (!confirm("تحميل أخبار أمثلة؟")) return;
    const { error } = await supabaseClient.from("academy_news").insert(DEFAULT_SEED);
    if (error) {
      console.error(error);
      alert("تعذر التحميل.");
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
