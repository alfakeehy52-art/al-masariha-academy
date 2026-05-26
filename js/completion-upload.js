/**
 * رفع مرفقات استكمال الطلب — ضغط صور + رسائل خطأ أوضح
 */
(function () {
  const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
  const MAX_IMAGE_DIM = 1600;

  function safeRefSegment(ref) {
    return String(ref || "REQ")
      .replace(/[^A-Za-z0-9-]/g, "")
      .slice(0, 48) || "REQ";
  }

  function uploadErrorMessage(err) {
    const msg = String((err && (err.message || err.error_description)) || err || "").trim();
    if (/row-level security|policy|403|401/i.test(msg)) {
      return "رفض التخزين: صلاحيات الرفع غير مفعّلة. نفّذ REQUEST_COMPLETIONS_STORAGE_FIX.sql في Supabase.";
    }
    if (/payload too large|413|size/i.test(msg)) {
      return "حجم الملف كبير جداً. جرّب صورة أصغر أو PDF مضغوط.";
    }
    if (/network|fetch|timeout|failed/i.test(msg)) {
      return "تعذر الاتصال أثناء الرفع. تحقق من الإنترنت وحاول مرة أخرى.";
    }
    return msg || "تعذر رفع الملف.";
  }

  function readAsImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("تعذر قراءة الصورة"));
      };
      img.src = url;
    });
  }

  async function compressImageIfNeeded(file) {
    if (!file || !String(file.type || "").startsWith("image/")) return file;
    if (file.size <= MAX_IMAGE_BYTES) return file;
    try {
      const img = await readAsImage(file);
      let w = img.naturalWidth || img.width;
      let h = img.naturalHeight || img.height;
      if (!w || !h) return file;
      const scale = Math.min(1, MAX_IMAGE_DIM / Math.max(w, h));
      w = Math.max(1, Math.round(w * scale));
      h = Math.max(1, Math.round(h * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      const blob = await new Promise((res) =>
        canvas.toBlob(res, "image/jpeg", 0.82)
      );
      if (!blob) return file;
      const base = String(file.name || "photo").replace(/\.[^.]+$/, "");
      return new File([blob], base + "-upload.jpg", {
        type: "image/jpeg",
        lastModified: Date.now()
      });
    } catch (e) {
      console.warn("compress skipped", e);
      return file;
    }
  }

  function ext(name) {
    const n = String(name || "file");
    const p = n.split(".").pop();
    return p && p !== n ? p.toLowerCase() : "bin";
  }

  async function uploadCompletionFile(sb, file, folder, referenceCode) {
    if (!sb || !file) return null;
    const prepared = await compressImageIfNeeded(file);
    const ref = safeRefSegment(referenceCode);
    const path = `${folder}/${ref}-${Date.now()}.${ext(prepared.name)}`;
    const type =
      prepared.type ||
      (String(prepared.name).endsWith(".pdf")
        ? "application/pdf"
        : "application/octet-stream");
    const { error } = await sb.storage.from("academy_files").upload(path, prepared, {
      upsert: false,
      contentType: type,
      cacheControl: "3600"
    });
    if (error) {
      const wrapped = new Error(uploadErrorMessage(error));
      wrapped.cause = error;
      throw wrapped;
    }
    const { data } = sb.storage.from("academy_files").getPublicUrl(path);
    return data.publicUrl;
  }

  window.CompletionUpload = {
    uploadCompletionFile,
    compressImageIfNeeded,
    uploadErrorMessage,
    safeRefSegment
  };
})();
