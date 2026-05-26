/**
 * رمز QR لمتابعة الطلب — يفتح صفحة المتابعة برقم المرجع والجوال.
 */
(function () {
  function trackUrl(ref, phone) {
    const url = new URL("request_status.html", window.location.href);
    if (ref) url.searchParams.set("ref", String(ref).trim());
    if (phone) url.searchParams.set("phone", String(phone).trim());
    return url.toString();
  }

  function ensureStyles() {
    if (document.getElementById("request-track-qr-style")) return;
    const st = document.createElement("style");
    st.id = "request-track-qr-style";
    st.textContent = `
      .request-qr-box{margin-top:14px;padding:16px;border:1px solid rgba(213,177,90,.22);border-radius:18px;background:rgba(255,255,255,.03);text-align:center}
      .request-qr-box h4{margin:0 0 8px;font-size:16px;color:#f0d58f}
      .request-qr-box p{margin:0 0 12px;color:#b6c1b8;font-size:13px;line-height:1.8}
      .request-qr-canvas-wrap{display:flex;justify-content:center;margin:8px 0 12px}
      .request-qr-canvas-wrap canvas{border-radius:12px;background:#fff;padding:8px}
      .request-qr-actions{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
      .request-qr-btn{min-height:42px;padding:0 16px;border-radius:14px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#fff;font-weight:800;cursor:pointer;font-family:inherit}
    `;
    document.head.appendChild(st);
  }

  function loadQrLib() {
    if (window.QRCode) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/qrcode@1.5.4/build/qrcode.min.js";
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("QR library load failed"));
      document.head.appendChild(s);
    });
  }

  async function renderRequestTrackQr(container, ref, phone, options) {
    if (!container) return;
    ensureStyles();
    const opts = options || {};
    const title = opts.title || "رمز متابعة الطلب";
    const hint =
      opts.hint ||
      "امسح الرمز من جوالك أو احفظ الصورة — يفتح صفحة متابعة طلبك برقم المرجع والجوال.";
    const url = trackUrl(ref, phone);
    container.innerHTML =
      `<h4>${title}</h4><p>${hint}</p>` +
      `<div class="request-qr-canvas-wrap"><canvas id="requestTrackQrCanvas" aria-label="رمز متابعة الطلب"></canvas></div>` +
      `<div class="request-qr-actions"><button type="button" class="request-qr-btn" data-qr-dl>حفظ الرمز كصورة</button></div>`;
    const wrap = container.querySelector(".request-qr-canvas-wrap");
    if (!wrap) return;
    const canvas = container.querySelector("#requestTrackQrCanvas");
    try {
      await loadQrLib();
      await window.QRCode.toCanvas(canvas, url, {
        width: 168,
        margin: 1,
        color: { dark: "#05110b", light: "#ffffff" }
      });
    } catch (e) {
      console.error(e);
      wrap.innerHTML = `<p style="color:#ffd7d7">تعذر إنشاء الرمز. احفظ رقم المرجع: <strong>${ref || "-"}</strong></p>`;
      return;
    }
    container.querySelector("[data-qr-dl]")?.addEventListener("click", () => {
      const a = document.createElement("a");
      a.download = `masarha-track-${String(ref || "request").replace(/[^\w-]+/g, "")}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    });
  }

  window.renderRequestTrackQr = renderRequestTrackQr;
  window.buildRequestTrackUrl = trackUrl;
})();
