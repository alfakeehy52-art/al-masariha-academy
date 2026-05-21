(function () {
  if (typeof createSupabaseClient !== "function") {
    console.error("store-products-admin: load supabase-client.js first");
    return;
  }

  const supabaseClient = createSupabaseClient();

  const DEFAULT_SEED = [
    {
      name: "طقم الأكاديمية الأساسي",
      price: 129,
      product_type: "طقم أكاديمية",
      category: "ملابس",
      status: "coming_soon",
      image: "",
      emoji: "👕",
      description:
        "الطقم الرسمي المتوقع للأكاديمية مع هوية بصرية موحدة وإمكانية تخصيص الاسم والرقم عند الإطلاق.",
      is_featured: true,
      is_customizable: true,
      player_id: null,
      player_name: ""
    },
    {
      name: "أقماع تدريب احترافية",
      price: 85,
      product_type: "احتياج أكاديمية",
      category: "أدوات تدريب",
      status: "draft",
      image: "",
      emoji: "🔶",
      description:
        "مجموعة أقماع مناسبة لتنظيم الحصص التدريبية وتوزيع المحطات المهارية داخل الملعب.",
      is_featured: false,
      is_customizable: false,
      player_id: null,
      player_name: ""
    },
    {
      name: "كرات تدريب الأكاديمية",
      price: 159,
      product_type: "احتياج أكاديمية",
      category: "معدات رياضية",
      status: "published",
      image: "",
      emoji: "⚽",
      description:
        "كرات تدريب موحدة للجلسات والمباريات الودية وللاستخدام اليومي داخل الأكاديمية.",
      is_featured: false,
      is_customizable: false,
      player_id: null,
      player_name: ""
    },
    {
      name: "شال الجماهير",
      price: 59,
      product_type: "منتج جماهيري",
      category: "جماهير",
      status: "coming_soon",
      image: "",
      emoji: "🧣",
      description:
        "منتج يرفع هوية الأكاديمية بصريًا ويمنح الجمهور حضورًا موحدًا داخل الفعاليات.",
      is_featured: true,
      is_customizable: false,
      player_id: null,
      player_name: ""
    }
  ];

  const els = {
    form: document.getElementById("storeProductForm"),
    productId: document.getElementById("productId"),
    name: document.getElementById("productName"),
    price: document.getElementById("productPrice"),
    type: document.getElementById("productType"),
    category: document.getElementById("productCategory"),
    status: document.getElementById("productStatus"),
    image: document.getElementById("productImage"),
    emoji: document.getElementById("productEmoji"),
    player: document.getElementById("productPlayer"),
    description: document.getElementById("productDescription"),
    featured: document.getElementById("productFeatured"),
    customizable: document.getElementById("productCustomizable"),
    resetBtn: document.getElementById("resetFormBtn"),
    seedBtn: document.getElementById("seedDefaultsBtn"),
    clearBtn: document.getElementById("clearProductsBtn"),
    submitBtn: document.getElementById("submitBtn"),
    totalProducts: document.getElementById("totalProducts"),
    comingSoonCount: document.getElementById("comingSoonCount"),
    publishedCount: document.getElementById("publishedCount"),
    featuredCount: document.getElementById("featuredCount"),
    tableBody: document.getElementById("productsTableBody"),
    emptyState: document.getElementById("emptyProductsState"),
    previewImage: document.getElementById("previewImage"),
    previewType: document.getElementById("previewType"),
    previewStatus: document.getElementById("previewStatus"),
    previewName: document.getElementById("previewName"),
    previewDescription: document.getElementById("previewDescription"),
    previewPrice: document.getElementById("previewPrice"),
    previewCategory: document.getElementById("previewCategory"),
    previewPlayer: document.getElementById("previewPlayer")
  };

  let playersCache = [];
  let productsCache = [];

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getStatusLabel(status) {
    const map = {
      draft: "مسودة",
      coming_soon: "قريبًا",
      published: "منشور",
      hidden: "مخفي"
    };
    return map[status] || "—";
  }

  function getStatusClass(status) {
    const map = {
      draft: "status-draft",
      coming_soon: "status-coming",
      published: "status-published",
      hidden: "status-hidden"
    };
    return map[status] || "status-draft";
  }

  function rowToUi(row) {
    return {
      id: row.id,
      name: row.name || "",
      price: Number(row.price || 0),
      type: row.product_type || "منتج عام",
      category: row.category || "ملابس",
      status: row.status || "coming_soon",
      image: row.image || "",
      emoji: row.emoji || "📦",
      description: row.description || "",
      featured: !!row.is_featured,
      customizable: !!row.is_customizable,
      playerId: row.player_id || "",
      playerName: row.player_name || ""
    };
  }

  function uiToDb(data) {
    const body = {
      name: data.name,
      price: data.price,
      product_type: data.type,
      category: data.category,
      status: data.status,
      image: data.image || null,
      emoji: (data.emoji || "📦").slice(0, 4),
      description: data.description || null,
      is_featured: !!data.featured,
      is_customizable: !!data.customizable,
      player_id: data.playerId || null,
      player_name: data.playerName || null,
      updated_at: new Date().toISOString()
    };
    return body;
  }

  async function fetchPlayers() {
    const { data, error } = await supabaseClient
      .from("players")
      .select("id, full_name")
      .in("status", ["active", "نشط"])
      .order("full_name", { ascending: true });
    if (error) {
      console.warn("store-products-admin players:", error);
      return [];
    }
    return Array.isArray(data) ? data : [];
  }

  async function fetchProducts() {
    const { data, error } = await supabaseClient
      .from("store_products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (Array.isArray(data) ? data : []).map(rowToUi);
  }

  function fillPlayersSelect() {
    const currentValue = els.player.value;
    const options = ['<option value="">بدون ربط</option>'].concat(
      playersCache.map(
        (p) =>
          `<option value="${escapeHtml(p.id)}">${escapeHtml(p.full_name || "لاعب")}</option>`
      )
    );
    els.player.innerHTML = options.join("");
    if (currentValue) els.player.value = currentValue;
  }

  function getFormData() {
    const selected = playersCache.find((p) => String(p.id) === String(els.player.value));
    return {
      id: els.productId.value ? String(els.productId.value) : "",
      name: els.name.value.trim(),
      price: Number(els.price.value || 0),
      type: els.type.value,
      category: els.category.value,
      status: els.status.value,
      image: els.image.value.trim(),
      emoji: (els.emoji.value.trim() || "📦").slice(0, 4),
      description: els.description.value.trim(),
      featured: els.featured.checked,
      customizable: els.customizable.checked,
      playerId: selected ? selected.id : "",
      playerName: selected ? selected.full_name || "" : ""
    };
  }

  function resetForm() {
    els.form.reset();
    els.productId.value = "";
    els.status.value = "coming_soon";
    els.type.value = "منتج عام";
    els.category.value = "ملابس";
    els.emoji.value = "👕";
    els.submitBtn.textContent = "حفظ المنتج";
    fillPlayersSelect();
    updatePreview();
  }

  function updateStats(products) {
    els.totalProducts.textContent = products.length;
    els.comingSoonCount.textContent = products.filter((p) => p.status === "coming_soon").length;
    els.publishedCount.textContent = products.filter((p) => p.status === "published").length;
    els.featuredCount.textContent = products.filter((p) => p.featured).length;
  }

  function updatePreview() {
    const data = getFormData();
    if (data.image) {
      els.previewImage.innerHTML = `<img src="${escapeHtml(data.image)}" alt="${escapeHtml(data.name || "product")}" style="width:100%;height:100%;object-fit:cover;display:block">`;
    } else {
      els.previewImage.textContent = data.emoji || "📦";
    }
    els.previewType.textContent = data.type || "منتج عام";
    els.previewStatus.textContent = getStatusLabel(data.status);
    els.previewName.textContent = data.name || "اسم المنتج";
    els.previewDescription.textContent =
      data.description || "سيظهر هنا وصف مختصر للمنتج أو الخدمة الرياضية بعد تعبئة الحقول.";
    els.previewPrice.textContent = data.price > 0 ? `${data.price} ر.س` : "— ر.س";
    els.previewCategory.textContent = data.category || "ملابس";
    els.previewPlayer.textContent = data.playerName ? `مرتبط: ${data.playerName}` : "بدون ربط";
  }

  function renderTable() {
    const products = productsCache.slice();
    updateStats(products);
    if (!products.length) {
      els.tableBody.innerHTML = "";
      els.emptyState.style.display = "block";
      return;
    }
    els.emptyState.style.display = "none";
    els.tableBody.innerHTML = products
      .map((product) => {
        const imageContent = product.image
          ? `<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" style="width:100%;height:100%;object-fit:cover;border-radius:15px">`
          : escapeHtml(product.emoji || "📦");
        return `
          <tr>
            <td>
              <div class="product-cell">
                <div class="thumb">${imageContent}</div>
                <div>
                  <b>${escapeHtml(product.name || "-")}</b>
                  <span>${escapeHtml(product.description || "بدون وصف مختصر")}</span>
                </div>
              </div>
            </td>
            <td>${escapeHtml(product.type || "-")}</td>
            <td>${escapeHtml(product.category || "-")}</td>
            <td>${product.price ? `${escapeHtml(product.price)} ر.س` : "—"}</td>
            <td><span class="status-pill ${getStatusClass(product.status)}">${getStatusLabel(product.status)}</span></td>
            <td>${escapeHtml(product.playerName || "—")}</td>
            <td>${product.featured ? "نعم" : "لا"}</td>
            <td>${product.customizable ? "نعم" : "لا"}</td>
            <td>
              <div class="table-actions">
                <button class="mini-btn" type="button" data-edit="${escapeHtml(product.id)}">تعديل</button>
                <button class="mini-btn" type="button" data-dup="${escapeHtml(product.id)}">نسخ</button>
                <button class="mini-btn" type="button" data-del="${escapeHtml(product.id)}">حذف</button>
              </div>
            </td>
          </tr>
        `;
      })
      .join("");

    els.tableBody.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => editProduct(btn.getAttribute("data-edit")));
    });
    els.tableBody.querySelectorAll("[data-dup]").forEach((btn) => {
      btn.addEventListener("click", () => duplicateProduct(btn.getAttribute("data-dup")));
    });
    els.tableBody.querySelectorAll("[data-del]").forEach((btn) => {
      btn.addEventListener("click", () => deleteProduct(btn.getAttribute("data-del")));
    });
  }

  function editProduct(id) {
    const product = productsCache.find((item) => String(item.id) === String(id));
    if (!product) return;
    els.productId.value = product.id;
    els.name.value = product.name || "";
    els.price.value = product.price ?? "";
    els.type.value = product.type || "منتج عام";
    els.category.value = product.category || "ملابس";
    els.status.value = product.status || "coming_soon";
    els.image.value = product.image || "";
    els.emoji.value = product.emoji || "📦";
    fillPlayersSelect();
    els.player.value = product.playerId ? String(product.playerId) : "";
    els.description.value = product.description || "";
    els.featured.checked = !!product.featured;
    els.customizable.checked = !!product.customizable;
    els.submitBtn.textContent = "حفظ التعديلات";
    updatePreview();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function duplicateProduct(id) {
    const product = productsCache.find((item) => String(item.id) === String(id));
    if (!product) return;
    const copy = uiToDb({
      ...product,
      name: `${product.name} - نسخة`
    });
    delete copy.updated_at;
    const { error } = await supabaseClient.from("store_products").insert([copy]);
    if (error) {
      alert("تعذر نسخ المنتج: " + (error.message || error));
      return;
    }
    await reloadProducts();
  }

  async function deleteProduct(id) {
    if (!confirm("هل تريد حذف هذا المنتج من قاعدة البيانات؟")) return;
    const { error } = await supabaseClient.from("store_products").delete().eq("id", id);
    if (error) {
      alert("تعذر الحذف: " + (error.message || error));
      return;
    }
    if (String(els.productId.value) === String(id)) resetForm();
    await reloadProducts();
  }

  async function reloadProducts() {
    try {
      productsCache = await fetchProducts();
      renderTable();
    } catch (error) {
      console.error(error);
      els.tableBody.innerHTML = "";
      els.emptyState.style.display = "block";
      els.emptyState.textContent =
        "تعذر تحميل المنتجات. نفّذ docs/STORE_PRODUCTS_RLS.sql في Supabase ثم أعد التحميل.";
    }
  }

  async function seedDefaults() {
    if (productsCache.length) {
      alert("يوجد منتجات بالفعل. احذفها أولاً إن أردت إعادة تحميل الأمثلة.");
      return;
    }
    const { error } = await supabaseClient.from("store_products").insert(DEFAULT_SEED);
    if (error) {
      alert("تعذر تحميل الأمثلة: " + (error.message || error));
      return;
    }
    await reloadProducts();
    alert("تمت إضافة أمثلة المتجر إلى Supabase.");
  }

  async function clearAllProducts() {
    if (!confirm("سيتم حذف جميع منتجات المتجر من قاعدة البيانات. هل أنت متأكد؟")) return;
    const { error } = await supabaseClient
      .from("store_products")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) {
      alert("تعذر الحذف: " + (error.message || error));
      return;
    }
    productsCache = [];
    renderTable();
    resetForm();
  }

  async function init() {
    if (!els.form) return;

    els.form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = getFormData();
      if (!data.name) {
        alert("يرجى إدخال اسم المنتج أولاً.");
        return;
      }
      const payload = uiToDb(data);
      let error;
      if (data.id) {
        const res = await supabaseClient.from("store_products").update(payload).eq("id", data.id);
        error = res.error;
      } else {
        const res = await supabaseClient.from("store_products").insert([payload]);
        error = res.error;
      }
      if (error) {
        alert("تعذر الحفظ: " + (error.message || error));
        return;
      }
      await reloadProducts();
      resetForm();
      alert("تم حفظ المنتج في Supabase.");
    });

    [els.name, els.price, els.type, els.category, els.status, els.image, els.emoji, els.player, els.description, els.featured, els.customizable].forEach(
      (input) => input && input.addEventListener("input", updatePreview)
    );

    els.resetBtn.addEventListener("click", resetForm);
    els.seedBtn.addEventListener("click", () => seedDefaults());
    els.clearBtn.addEventListener("click", () => clearAllProducts());

    playersCache = await fetchPlayers();
    fillPlayersSelect();
    resetForm();
    await reloadProducts();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
