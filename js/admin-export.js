/**
 * تصدير موحّد — Excel + PDF (طباعة رسمية: شعار، ترويسة، سطران لكل سجل)
 */
(function (global) {
  function exportDateStamp() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
  }

  function toExportText(value) {
    return String(value ?? "")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .trim();
  }

  function flattenMultiline(value) {
    return toExportText(value).replace(/\n+/g, " | ");
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatPdfCell(value, maxLen) {
    const clean = flattenMultiline(value).replace(/\s+/g, " ").trim();
    if (!maxLen || clean.length <= maxLen) return clean;
    return `${clean.slice(0, maxLen - 1)}…`;
  }

  function getAcademyBrand() {
    let cached = null;
    try {
      cached = JSON.parse(global.localStorage?.getItem("academy_brand_cache_v1") || "null");
    } catch (_e) {}
    const logoFromSidebar = global.document?.getElementById("adminSidebarLogo")?.getAttribute("src") || "";
    const fallbackLogo = "academy-logo.svg";
    return {
      name: (cached?.brand_name_ar || "أكاديمية المسارحة").trim(),
      subtitle: (cached?.brand_subtitle_ar || "لكرة القدم").trim(),
      logoUrl: (cached?.logo_url || logoFromSidebar || fallbackLogo).trim() || fallbackLogo
    };
  }

  function downloadExcel(filename, rows, colWidths, sheetName) {
    if (!global.XLSX) return false;
    try {
      const wb = global.XLSX.utils.book_new();
      const ws = global.XLSX.utils.aoa_to_sheet(rows);
      if (colWidths) ws["!cols"] = colWidths;
      const range = global.XLSX.utils.decode_range(ws["!ref"] || "A1");
      for (let row = 1; row <= range.e.r; row += 1) {
        for (let col = 0; col <= range.e.c; col += 1) {
          const addr = global.XLSX.utils.encode_cell({ r: row, c: col });
          const cell = ws[addr];
          if (!cell) continue;
          cell.t = "s";
          cell.v = toExportText(cell.v);
        }
      }
      global.XLSX.utils.book_append_sheet(wb, ws, sheetName || "البيانات");
      global.XLSX.writeFile(wb, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  function buildTwoRowBodyHtml(headers, bodyRows, mainColCount) {
    const mainCount = Math.min(mainColCount || 6, headers.length);
    const mainHeaders = headers.slice(0, mainCount);
    return bodyRows
      .map((row) => {
        const mainCells = row
          .slice(0, mainCount)
          .map((v, i) => {
            const cls =
              i === 0 ? "cell-ref" : i === 1 ? "cell-name" : i === 4 ? "cell-phone" : "";
            return `<td class="${cls}">${escapeHtml(formatPdfCell(v, i === 1 ? 42 : 36))}</td>`;
          })
          .join("");
        const rest = row.slice(mainCount);
        const detailParts = rest
          .map((v, i) => {
            const label = headers[mainCount + i] || "";
            return `<b>${escapeHtml(label)}:</b> ${escapeHtml(formatPdfCell(v, 200))}`;
          })
          .filter(Boolean);
        const detailRow =
          detailParts.length > 0
            ? `<tr class="detail-row"><td colspan="${mainCount}">${detailParts.join('<span class="sep">|</span>')}</td></tr>`
            : "";
        return `<tr class="main-row">${mainCells}</tr>${detailRow}`;
      })
      .join("");
  }

  function openPdfPrint(options) {
    const opts = options || {};
    const headers = opts.headers || [];
    const bodyRows = opts.bodyRows || [];
    if (!bodyRows.length) return { ok: false, reason: "empty" };

    const printWin = global.open("", "_blank", "width=1280,height=900");
    if (!printWin) return { ok: false, reason: "popup" };

    const brand = { ...getAcademyBrand(), ...(opts.brand || {}) };
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const reportNumber = `RPT-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const title = opts.title || "تقرير";
    const subtitle = opts.subtitle || "";
    const fileBase = opts.fileBase || "report";
    const stampLabel = opts.stampLabel || "ختم إدارة النظام";
    const mainColCount = opts.mainColCount || Math.min(9, Math.max(4, Math.ceil(headers.length * 0.55)));
    const useTwoRow = opts.twoRow !== false && headers.length > mainColCount;

    const mainHeaders = useTwoRow ? headers.slice(0, mainColCount) : headers;
    const headCols = mainHeaders.map((h) => `<th>${escapeHtml(h)}</th>`).join("");
    const bodyHtml = useTwoRow
      ? buildTwoRowBodyHtml(headers, bodyRows, mainColCount)
      : bodyRows
          .map((cells) => {
            const cols = cells.map((v) => `<td>${escapeHtml(formatPdfCell(v, 80))}</td>`).join("");
            return `<tr class="main-row">${cols}</tr>`;
          })
          .join("");

    const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${escapeHtml(fileBase)}</title>
<style>
:root{--bg:#f5f7fa;--ink:#0f1720;--line:#d7deea;--panel:#fff;--accent:#0f3f2b}
*{box-sizing:border-box}body{font-family:"Cairo","Tahoma",Arial,sans-serif;margin:0;background:var(--bg);color:var(--ink)}
.page{padding:16mm 12mm}
.hero{background:linear-gradient(135deg,#0f3f2b,#102c22 55%,#0b1f18);border-radius:14px;color:#fff;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;gap:14px;border:2px solid rgba(213,177,90,.22)}
.hero-brand{display:flex;align-items:center;gap:12px}
.hero-logo{width:64px;height:64px;border-radius:16px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;overflow:hidden}
.hero-logo img{width:100%;height:100%;object-fit:contain;padding:7px}
.hero-title{margin:0;font-size:23px;line-height:1.2}.hero-sub{margin:3px 0 0;font-size:12px;color:#dbe7df}
.hero-meta{font-size:12px;line-height:1.9;text-align:left;color:#f7e9c3}
.hero-report{margin-top:4px;font-size:11px;color:#ffe7a6;font-weight:800}
.sheet{margin-top:10px;background:var(--panel);border:1px solid var(--line);border-radius:12px;overflow:hidden}
table{width:100%;border-collapse:collapse;table-layout:fixed}
thead th{background:#f4f7fb;color:#1d2733;font-size:11px;padding:8px 6px;border-bottom:1px solid var(--line)}
th,td{padding:7px 6px;font-size:11px;vertical-align:top;word-break:break-word;border-bottom:1px solid #edf1f7}
.main-row td{background:#fff}
.main-row .cell-ref{font-weight:800;color:#0c4a34}
.main-row .cell-name{font-weight:800}
.main-row .cell-phone{font-family:"Tahoma",Arial,sans-serif}
.detail-row td{background:#fcfdfd;line-height:1.8;color:#2b3442}
.detail-row b{color:#102c22}
.sep{display:inline-block;margin:0 8px;color:#a5afbe}
.report-footer{margin-top:12px;display:flex;justify-content:flex-start}
.report-stamp{border:2px dashed rgba(15,63,43,.55);color:#0f3f2b;border-radius:14px;padding:10px 14px;font-weight:900;font-size:12px;background:rgba(15,63,43,.05);display:inline-flex;flex-direction:column;gap:3px;min-width:220px;text-align:center}
.report-stamp small{font-weight:700;color:#355647;font-size:10px}
@media print{body{background:#fff}.page{padding:8mm}tr{page-break-inside:avoid}.hero{print-color-adjust:exact;-webkit-print-color-adjust:exact}.print-page-counter{position:fixed;left:8mm;bottom:6mm;font-size:10px;color:#6b7787}.print-page-counter::after{content:"صفحة " counter(page) " / " counter(pages)}}
</style></head><body><div class="page">
<section class="hero"><div class="hero-brand"><div class="hero-logo"><img src="${escapeHtml(brand.logoUrl)}" alt="شعار الأكاديمية"></div><div><h1 class="hero-title">${escapeHtml(brand.name)}</h1><p class="hero-sub">${escapeHtml(brand.subtitle)} — ${escapeHtml(title)}</p>${subtitle ? `<p class="hero-sub">${escapeHtml(subtitle)}</p>` : ""}</div></div>
<div class="hero-meta"><div class="hero-report">رقم التقرير: <b>${escapeHtml(reportNumber)}</b></div><div>عدد السجلات: <b>${bodyRows.length}</b></div><div>تاريخ التصدير: ${now.toLocaleDateString("ar-SA")}</div><div>الوقت: ${now.toLocaleTimeString("ar-SA")}</div></div></section>
<section class="sheet"><table><thead><tr>${headCols}</tr></thead><tbody>${bodyHtml}</tbody></table></section>
<div class="report-footer"><div class="report-stamp"><span>${escapeHtml(stampLabel)}</span><small>${escapeHtml(brand.name)} — ${escapeHtml(brand.subtitle)}</small><small>رقم التقرير: ${escapeHtml(reportNumber)}</small></div></div>
</div><div class="print-page-counter"></div></body></html>`;

    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => printWin.print(), 450);
    return { ok: true, reportNumber };
  }

  /** تصدير Excel + PDF من صف واحد (headers + bodyRows بدون صف العناوين المكرر) */
  function exportTable(baseName, rows, options) {
    if (!rows || rows.length <= 1) return { ok: false, reason: "empty", count: 0 };
    const headers = rows[0];
    const bodyRows = rows.slice(1);
    const stamp = exportDateStamp();
    const base = `${baseName}_${stamp}`;
    const result = { ok: true, count: bodyRows.length, excel: false, pdf: false };

    if (options?.excel !== false) {
      result.excel = downloadExcel(`${base}.xlsx`, rows, options?.colWidths, options?.sheetName);
    }
    if (options?.pdf !== false) {
      const pdf = openPdfPrint({
        title: options?.pdfTitle || baseName,
        subtitle: options?.pdfSubtitle || "",
        fileBase: base,
        headers,
        bodyRows,
        mainColCount: options?.mainColCount,
        twoRow: options?.twoRow,
        stampLabel: options?.stampLabel,
        brand: options?.brand
      });
      result.pdf = pdf.ok;
    }
    return result;
  }

  global.AdminExport = {
    exportDateStamp,
    toExportText,
    flattenMultiline,
    escapeHtml,
    formatPdfCell,
    getAcademyBrand,
    downloadExcel,
    openPdfPrint,
    exportTable
  };

  function injectExportUiStyles() {
    if (document.getElementById("admin-export-ui-styles")) return;
    const style = document.createElement("style");
    style.id = "admin-export-ui-styles";
    style.textContent = `
.export-actions{display:inline-flex;align-items:center;gap:10px;flex-wrap:nowrap;flex-shrink:0}
.export-actions .btn,.export-actions .btn-secondary,.export-actions select{flex-shrink:0}
.panel-head .export-actions,.card-head .export-actions{margin-inline-start:auto}
.actions .export-actions{margin-inline-end:4px}
.panel-head,.card-head{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
.panel-head>:first-child:not(.export-actions),.card-head>:first-child:not(.export-actions){flex:1 1 auto;min-width:min(100%,220px)}
@media(max-width:720px){.export-actions{width:100%;justify-content:flex-start}.panel-head .export-actions{margin-inline-start:0}}
`;
    document.head.appendChild(style);
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", injectExportUiStyles);
    } else {
      injectExportUiStyles();
    }
  }
})(typeof window !== "undefined" ? window : globalThis);
