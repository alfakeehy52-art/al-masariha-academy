/**
 * رفع ملفات إعدادات الموقع إلى Supabase Storage (bucket: academy_files)
 * مسار مقترح: site-assets/ — يتطلب صلاحية admin على التخزين
 */
(function () {
  const BUCKET = "academy_files";
  const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
  const IMAGE_TYPES = /^image\/(png|jpe?g|webp|gif|svg\+xml)$/i;

  function getClient() {
    if (typeof createSupabaseClient !== "function") {
      throw new Error("Supabase غير متاح");
    }
    return createSupabaseClient();
  }

  function fileExt(name) {
    const m = String(name || "").match(/\.([a-z0-9]+)$/i);
    return m ? m[1].toLowerCase() : "jpg";
  }

  /**
   * @param {File} file
   * @param {{ folder?: string, prefix?: string }} options
   * @returns {Promise<{ path: string, publicUrl: string }>}
   */
  async function uploadSiteAsset(file, options) {
    const folder = (options && options.folder) || "site-assets";
    const prefix = (options && options.prefix) || "asset";

    if (!file) throw new Error("لم تُختر ملفاً");
    if (!IMAGE_TYPES.test(file.type || "")) {
      throw new Error("يُقبل ملفات الصور فقط (PNG, JPG, WEBP, GIF, SVG)");
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw new Error("الحد الأقصى لحجم الصورة: 5 ميجابايت");
    }

    const sb = getClient();
    const path = `${folder}/${prefix}-${Date.now()}.${fileExt(file.name)}`;
    const { error } = await sb.storage.from(BUCKET).upload(path, file, {
      upsert: true,
      cacheControl: "3600",
      contentType: file.type || undefined
    });

    if (error) throw error;

    const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
    return { path, publicUrl: data.publicUrl };
  }

  window.uploadSiteAsset = uploadSiteAsset;
  window.ACADEMY_MEDIA_MAX_BYTES = MAX_IMAGE_BYTES;
})();
