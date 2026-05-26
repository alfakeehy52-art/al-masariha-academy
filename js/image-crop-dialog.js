/**
 * حوار قص/تموضع الصورة قبل الرفع — مربع قص ظاهر مع سحب وتكبير.
 */
(function () {
  let active = null;

  function slugId() {
    return "imgCropDlg_" + Math.random().toString(36).slice(2, 9);
  }

  function ensureStyles() {
    if (document.getElementById("image-crop-dialog-style")) return;
    const style = document.createElement("style");
    style.id = "image-crop-dialog-style";
    style.textContent = `
      .icd-overlay{position:fixed;inset:0;z-index:20000;display:none;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.78);backdrop-filter:blur(8px);font-family:'Cairo',system-ui,sans-serif}
      .icd-overlay.show{display:flex}
      .icd-box{width:min(520px,100%);max-height:92vh;overflow:auto;border-radius:24px;border:1px solid rgba(213,177,90,.28);background:linear-gradient(180deg,#102217,#07130d);color:#f3f4ef;box-shadow:0 28px 90px rgba(0,0,0,.5)}
      .icd-head{padding:18px 20px 10px;display:flex;justify-content:space-between;align-items:center;gap:12px}
      .icd-head h3{margin:0;font-size:20px;color:#f0d58f}
      .icd-close{width:42px;height:42px;border-radius:14px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#fff;font-size:22px;cursor:pointer}
      .icd-stage-wrap{padding:0 20px}
      .icd-stage{position:relative;width:100%;max-width:460px;margin:0 auto;aspect-ratio:1;border-radius:18px;overflow:hidden;background:#0a1811;border:2px solid rgba(213,177,90,.45);touch-action:none;cursor:grab}
      .icd-stage.dragging{cursor:grabbing}
      .icd-canvas{display:block;width:100%;height:100%}
      .icd-frame{position:absolute;inset:12%;border:2px dashed rgba(240,213,143,.85);border-radius:12px;pointer-events:none;box-shadow:0 0 0 999px rgba(0,0,0,.42)}
      .icd-controls{padding:14px 20px 6px;display:grid;gap:10px}
      .icd-controls label{font-size:13px;font-weight:800;color:#b6c1b8}
      .icd-controls input[type=range]{width:100%;accent-color:#d5b15a}
      .icd-hint{padding:0 20px 8px;font-size:13px;color:#b6c1b8;line-height:1.8}
      .icd-actions{padding:14px 20px 20px;display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
      .icd-btn{min-height:48px;padding:0 20px;border-radius:14px;font-weight:900;font-family:inherit;cursor:pointer;border:1px solid rgba(255,255,255,.1)}
      .icd-btn-primary{background:linear-gradient(180deg,#e4c36f,#d5b15a);color:#08110b;border-color:rgba(213,177,90,.4)}
      .icd-btn-ghost{background:rgba(255,255,255,.05);color:#fff}
    `;
    document.head.appendChild(style);
  }

  function ensureOverlay() {
    ensureStyles();
    if (document.getElementById("imageCropDialogOverlay")) return;
    const el = document.createElement("div");
    el.id = "imageCropDialogOverlay";
    el.className = "icd-overlay";
    el.innerHTML = `
      <div class="icd-box" role="dialog" aria-modal="true">
        <div class="icd-head"><h3 id="icdTitle">ضبط الصورة</h3><button type="button" class="icd-close" id="icdClose">×</button></div>
        <p class="icd-hint" id="icdHint">اسحب الصورة داخل الإطار، وكبّر/صغّر حتى يظهر الوجه بشكل سليم.</p>
        <div class="icd-stage-wrap">
          <div class="icd-stage" id="icdStage">
            <canvas class="icd-canvas" id="icdCanvas"></canvas>
            <div class="icd-frame" aria-hidden="true"></div>
          </div>
        </div>
        <div class="icd-controls">
          <label for="icdZoom">التكبير</label>
          <input type="range" id="icdZoom" min="100" max="300" value="100" />
        </div>
        <div class="icd-actions">
          <button type="button" class="icd-btn icd-btn-primary" id="icdOk">اعتماد الصورة</button>
          <button type="button" class="icd-btn icd-btn-ghost" id="icdCancel">إلغاء</button>
        </div>
      </div>`;
    document.body.appendChild(el);
  }

  function isImageFile(file) {
    if (!file) return false;
    const type = String(file.type || "").toLowerCase();
    if (type.startsWith("image/")) return true;
    return /\.(jpe?g|png|gif|webp|bmp|heic|heif)$/i.test(String(file.name || ""));
  }

  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const fromDataUrl = (dataUrl) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("تعذر قراءة الصورة"));
        img.src = dataUrl;
      };
      const fromBlob = () => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(url);
          resolve(img);
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          const reader = new FileReader();
          reader.onload = () => fromDataUrl(reader.result);
          reader.onerror = () => reject(new Error("تعذر قراءة الصورة"));
          reader.readAsDataURL(file);
        };
        img.src = url;
      };
      fromBlob();
    });
  }

  function open(file, options) {
    ensureOverlay();
    const opts = options || {};
    const aspect = opts.aspect > 0 ? opts.aspect : 1;
    const outSize = opts.outputSize || 900;
    const title = opts.title || "ضبط صورة اللاعب";
    const mime = opts.mimeType || "image/jpeg";
    const quality = opts.quality != null ? opts.quality : 0.9;

    return new Promise((resolve, reject) => {
      if (!isImageFile(file)) {
        reject(new Error("ملف غير صالح"));
        return;
      }

      const overlay = document.getElementById("imageCropDialogOverlay");
      const stage = document.getElementById("icdStage");
      const canvas = document.getElementById("icdCanvas");
      const zoom = document.getElementById("icdZoom");
      document.getElementById("icdTitle").textContent = title;

      let img = null;
      let scale = 1;
      let offsetX = 0;
      let offsetY = 0;
      let dragging = false;
      let lastX = 0;
      let lastY = 0;
      let frame = { x: 0, y: 0, w: 0, h: 0 };

      function close(cancelled) {
        overlay.classList.remove("show");
        document.body.style.overflow = "";
        stage.onpointerdown = null;
        stage.onpointermove = null;
        stage.onpointerup = null;
        stage.onpointercancel = null;
        zoom.oninput = null;
        document.getElementById("icdOk").onclick = null;
        document.getElementById("icdCancel").onclick = null;
        document.getElementById("icdClose").onclick = null;
        active = null;
        if (cancelled) reject(new Error("cancelled"));
      }

      function layout() {
        const rect = stage.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(rect.width * dpr);
        canvas.height = Math.floor(rect.height * dpr);
        const pad = Math.min(rect.width, rect.height) * 0.12;
        frame = {
          x: pad * dpr,
          y: pad * dpr,
          w: (rect.width - pad * 2) * dpr,
          h: (rect.height - pad * 2) * dpr
        };
        if (aspect !== 1) {
          const targetH = frame.w / aspect;
          if (targetH <= frame.h) {
            frame.h = targetH;
            frame.y += ((rect.height - pad * 2) * dpr - targetH) / 2;
          }
        }
      }

      function baseScale() {
        if (!img) return 1;
        const cover = Math.max(frame.w / img.width, frame.h / img.height);
        return cover * (Number(zoom.value) / 100);
      }

      function draw() {
        if (!img) return;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#0a1811";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const s = baseScale();
        const dw = img.width * s;
        const dh = img.height * s;
        const cx = canvas.width / 2 + offsetX * (window.devicePixelRatio || 1);
        const cy = canvas.height / 2 + offsetY * (window.devicePixelRatio || 1);
        const x = cx - dw / 2;
        const y = cy - dh / 2;
        ctx.drawImage(img, x, y, dw, dh);
      }

      function exportBlob() {
        const out = document.createElement("canvas");
        out.width = outSize;
        out.height = Math.round(outSize / aspect);
        const ctx = out.getContext("2d");
        const s = baseScale();
        const dw = img.width * s;
        const dh = img.height * s;
        const cx = canvas.width / 2 + offsetX * (window.devicePixelRatio || 1);
        const cy = canvas.height / 2 + offsetY * (window.devicePixelRatio || 1);
        const sx = cx - dw / 2;
        const sy = cy - dh / 2;
        const scaleOut = out.width / frame.w;
        ctx.drawImage(
          canvas,
          frame.x,
          frame.y,
          frame.w,
          frame.h,
          0,
          0,
          out.width,
          out.height
        );
        return new Promise((res) => {
          out.toBlob(
            (blob) => res(blob),
            mime,
            quality
          );
        });
      }

      function bindDrag() {
        stage.onpointerdown = (e) => {
          dragging = true;
          stage.classList.add("dragging");
          lastX = e.clientX;
          lastY = e.clientY;
          stage.setPointerCapture(e.pointerId);
        };
        stage.onpointermove = (e) => {
          if (!dragging) return;
          offsetX += e.clientX - lastX;
          offsetY += e.clientY - lastY;
          lastX = e.clientX;
          lastY = e.clientY;
          draw();
        };
        const end = () => {
          dragging = false;
          stage.classList.remove("dragging");
        };
        stage.onpointerup = end;
        stage.onpointercancel = end;
      }

      function primeView() {
        layout();
        zoom.value = "100";
        offsetX = 0;
        offsetY = 0;
        draw();
      }

      loadImage(file)
        .then((loaded) => {
          img = loaded;
          active = { file };
          overlay.classList.add("show");
          document.body.style.overflow = "hidden";
          bindDrag();
          zoom.oninput = () => draw();
          requestAnimationFrame(() => {
            primeView();
            requestAnimationFrame(primeView);
          });

          document.getElementById("icdOk").onclick = async () => {
            const blob = await exportBlob();
            if (!blob) {
              reject(new Error("تعذر حفظ الصورة"));
              return;
            }
            const base = String(file.name || "photo").replace(/\.[^.]+$/, "");
            const cropped = new File([blob], base + "-cropped.jpg", {
              type: mime,
              lastModified: Date.now()
            });
            overlay.classList.remove("show");
            document.body.style.overflow = "";
            active = null;
            resolve(cropped);
          };
          document.getElementById("icdCancel").onclick = () => close(true);
          document.getElementById("icdClose").onclick = () => close(true);
        })
        .catch(reject);
    });
  }

  function bindImageInput(input, options) {
    if (!input || input.__cropBound) return;
    input.__cropBound = true;
    input.addEventListener("change", async () => {
      const file = input.files && input.files[0];
      if (!file) return;
      if (!isImageFile(file)) return;
      try {
        const cropped = await open(file, options);
        const dt = new DataTransfer();
        dt.items.add(cropped);
        input.files = dt.files;
        if (options.onCropped) options.onCropped(cropped, input);
      } catch (e) {
        if (String(e.message) !== "cancelled") console.warn(e);
        input.value = "";
      }
    });
  }

  window.ImageCropDialog = { open, bindImageInput };
})();
