/**
 * صفحة استكمال الطلب — تحميل المرفقات وإعادة الرفع بعد ملاحظات الإدارة
 */
(function () {
  const $ = (id) => document.getElementById(id);
  const CAT = () => window.JOIN_ATTACHMENT_CATALOG;

  let sb = null;
  let currentRequest = null;
  let currentCompletion = null;

  function toast(msg) {
    const el = $("toast");
    if (!el) return;
    const safe =
      typeof sanitizeVisitorMessage === "function"
        ? sanitizeVisitorMessage(msg, msg)
        : msg;
    el.textContent = safe;
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 4000);
  }

  function esc(v) {
    return String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normPhone(v) {
    return String(v || "").replace(/\s/g, "").trim();
  }

  function ext(name) {
    return String(name || "file").split(".").pop().toLowerCase() || "file";
  }

  function isApprovedStatus(s) {
    return ["approved", "accepted", "معتمد", "مقبول"].includes(
      String(s || "").toLowerCase()
    );
  }

  function profile() {
    return CAT() ? CAT().completionProfile(currentRequest) : { blocked: false };
  }

  function docsFor() {
    return CAT() ? CAT().getFormDocs(currentRequest) : [];
  }

  function attachmentsFor() {
    return CAT() ? CAT().getAttachments(currentRequest) : [];
  }

  function labelFor(type) {
    return CAT() ? CAT().labelForType(type) : type || "الطلب";
  }

  function catalogItemForUpload(item) {
    return {
      url: item.url,
      status: item.status,
      note: item.note
    };
  }

  function needsUpload(item) {
    const cat = CAT();
    if (cat && cat.fileNeedsVisitorReupload) {
      return cat.fileNeedsVisitorReupload(
        currentCompletion,
        catalogItemForUpload(item)
      );
    }
    if (!currentCompletion) return true;
    if (!currentCompletion[item.url]) return true;
    const s = String(currentCompletion[item.status] || "pending").toLowerCase();
    return s === "rejected" || s === "reupload" || !!String(currentCompletion[item.note] || "").trim();
  }

  function fileStatusOf(item) {
    return currentCompletion
      ? String(currentCompletion[item.status] || "pending")
      : "pending";
  }

  function statusText(item) {
    if (!currentCompletion || !currentCompletion[item.url]) return "مطلوب الرفع";
    const cat = CAT();
    const note = currentCompletion[item.note];
    if (cat && cat.fileReviewStatusLabel) {
      return cat.fileReviewStatusLabel(fileStatusOf(item), note);
    }
    return fileStatusOf(item);
  }

  function needsReuploadStyle(item) {
    return needsUpload(item) && !!currentCompletion && !!currentCompletion[item.url];
  }

  function printPagesLabel(docType) {
    if (docType === "medical-form") return "صفحة واحدة";
    if (docType === "player-unified") return "صفحتان";
    return "";
  }

  function printLinkFor(item) {
    const cat = CAT();
    const dt =
      item.printDocType ||
      (cat && cat.inferPrintDocType ? cat.inferPrintDocType(item) : "");
    if (!dt || !currentRequest) return "";
    const href = `smart_contract.html?type=${encodeURIComponent(dt)}&ref=${encodeURIComponent(currentRequest.reference_code)}&phone=${encodeURIComponent(currentRequest.phone)}`;
    const pages = printPagesLabel(dt);
    return `<p class="hint" style="margin-top:10px"><a class="btn secondary" style="min-height:44px;padding:0 14px" target="_blank" href="${href}">طباعة النموذج الصحيح${pages ? ` (${pages})` : ""}</a></p>${item.uploadHint ? `<p class="hint" style="color:#ffe79c;font-weight:800;margin-top:6px">${esc(item.uploadHint)}</p>` : ""}`;
  }

  function renderReuploadSummary(list) {
    const box = $("reuploadSummary");
    if (!box) return;
    const flagged = list.filter((item) => needsUpload(item));
    if (!flagged.length) {
      box.style.display = "none";
      box.innerHTML = "";
      return;
    }
    box.style.display = "block";
    box.innerHTML = `<h3 style="margin:0 0 10px;color:var(--gold2)">ملاحظات الإدارة — مطلوب إعادة الرفع</h3>
      <div class="hint" style="margin-bottom:10px">اختر ملفاً جديداً لكل مرفق أدناه ثم اضغط «إرسال المرفقات».</div>
      ${flagged
        .map(
          (item) =>
            `<div class="review-note" style="margin-bottom:8px"><b>${esc(item.label)}</b>${
              currentCompletion && currentCompletion[item.note]
                ? `<br>${esc(currentCompletion[item.note])}`
                : "<br><span style=\"color:var(--muted)\">أعد رفع الملف الصحيح.</span>"
            }</div>`
        )
        .join("")}`;
  }

  function renderForms() {
    const p = profile();
    const card = $("officialFormsCard");
    if (!card) return;
    if (p.blocked || p.noAttachments) {
      card.style.display = "none";
      return;
    }
    const type = currentRequest.request_type;
    $("formsTitle").textContent =
      type === "guardian"
        ? "النماذج الرسمية لولي الأمر"
        : `النماذج الرسمية لـ ${labelFor(type)}`;
    $("officialFormsGrid").innerHTML =
      docsFor()
        .map(([title, desc, docType]) => {
          const pages = printPagesLabel(docType);
          return `<div class="doc-card"><h3>${esc(title)}</h3><p>${esc(desc)}</p>${pages ? `<p class="hint" style="color:var(--gold2);font-weight:800">عند الطباعة: ${pages}</p>` : ""}<a class="btn secondary" target="_blank" href="smart_contract.html?type=${encodeURIComponent(docType)}&ref=${encodeURIComponent(currentRequest.reference_code)}&phone=${encodeURIComponent(currentRequest.phone)}">فتح / طباعة النموذج</a></div>`;
        })
        .join("") || '<p class="hint">لا توجد نماذج مخصصة لهذا النوع.</p>';
    card.style.display = "block";
  }

  function bindCompletionCrops() {
    if (!window.ImageCropDialog) return;
    document.querySelectorAll("#attachmentsGrid input[type=file]").forEach((inp) => {
      if (inp.__cropWired) return;
      const isPhoto =
        inp.id === "personalPhoto" || String(inp.accept || "").includes("image");
      if (!isPhoto) return;
      inp.__cropWired = true;
      inp.addEventListener("change", async () => {
        const file = inp.files && inp.files[0];
        if (!file || !String(file.type || "").startsWith("image/")) return;
        try {
          const cropped = await ImageCropDialog.open(file, {
            title: "ضبط الصورة قبل الرفع",
            aspect: 1,
            outputSize: 900
          });
          const dt = new DataTransfer();
          dt.items.add(cropped);
          inp.files = dt.files;
        } catch (e) {
          if (String(e.message) !== "cancelled") toast("تعذر ضبط الصورة.");
          inp.value = "";
        }
      });
    });
  }

  function renderAttachments() {
    const p = profile();
    const form = $("completionForm");
    if (!form) return;
    form.style.display = "block";

    if (p.blocked || p.noAttachments) {
      $("attachmentsTitle").textContent = "مرفقات الطلب";
      $("attachmentsGrid").innerHTML = `<div class="filebox full"><b>${esc(p.message || "لا مرفقات مطلوبة.")}</b></div>`;
      renderReuploadSummary([]);
      return;
    }

    const all = attachmentsFor();
    const list = all.filter((item) => needsUpload(item));
    $("attachmentsTitle").textContent = list.length
      ? `رفع المرفقات المطلوبة (${list.length})`
      : `مرفقات ${labelFor(currentRequest.request_type)}`;
    renderReuploadSummary(all);

    if (!list.length) {
      $("attachmentsGrid").innerHTML =
        '<div class="filebox full"><b>لا توجد مرفقات مطلوبة لإعادة الرفع الآن.</b><p class="hint">إذا أضافت الإدارة ملاحظة على ملف، حدّث الصفحة. يمكنك أيضاً متابعة الحالة من «متابعة حالة الطلب».</p></div>';
      return;
    }

    $("attachmentsGrid").innerHTML = list
      .map(
        (item) =>
          `<div class="filebox ${needsReuploadStyle(item) ? "rejected" : ""}">
            <label>${esc(item.label)} ${item.required ? '<span style="color:var(--gold2)">*</span>' : ""}</label>
            <div class="hint">الحالة: ${esc(statusText(item))}</div>
            ${currentCompletion && currentCompletion[item.note] ? `<div class="review-note">ملاحظة الإدارة: ${esc(currentCompletion[item.note])}</div>` : ""}
            ${printLinkFor(item)}
            <input type="file" id="${esc(item.key)}" accept="${esc(item.accept || ".pdf,image/*")}" ${item.required ? "required" : ""}>
          </div>`
      )
      .join("");
    bindCompletionCrops();
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function loadRequestAndAttachments() {
    if (!ensureSupabase()) return false;
    const ref = $("refInput").value.trim();
    const phone = normPhone($("phoneInput").value);
    if (!ref || !phone) {
      toast("اكتب رقم المرجع ورقم الجوال.");
      return false;
    }

    const btn = $("verifyBtn");
    const prevLabel = btn ? btn.textContent : "";
    if (btn) {
      btn.disabled = true;
      btn.textContent = "جاري التحميل...";
    }

    try {
      let data = null;
      try {
        data = await lookupJoinRequestByRefPhone(ref, phone);
      } catch (error) {
        console.error(error);
        toast("تعذر الاتصال بالخادم. تحقق من الإنترنت وحاول مرة أخرى.");
        return false;
      }
      if (!data) {
        toast("لم يتم العثور على طلب مطابق لرقم المرجع والجوال.");
        return false;
      }

      currentRequest = data;
      const back = $("statusBackLink");
      if (back) {
        back.href = `request_status.html?ref=${encodeURIComponent(data.reference_code)}&phone=${encodeURIComponent(data.phone)}`;
      }

      const TYPE_AR = {
        player: "لاعب",
        guardian: "ولي أمر",
        staff: "كادر",
        coach: "كادر",
        supporter: "داعم",
        academy_member: "عضو أكاديمية"
      };
      const STATUS_AR = {
        new: "جديد",
        review: "تحت المراجعة",
        reviewing: "تحت المراجعة",
        approved: "مقبول",
        rejected: "مرفوض",
        pending: "بانتظار استكمال",
        needs_completion: "بانتظار استكمال"
      };
      $("requestInfo").textContent = `${data.full_name || "-"} — ${TYPE_AR[data.request_type] || data.request_type || "-"} — ${STATUS_AR[data.status] || data.status || "-"}`;

      if (isApprovedStatus(data.status)) {
        $("officialFormsCard").style.display = "none";
        $("completionForm").style.display = "none";
        toast("تم اعتماد هذا الطلب ولا يمكن إعادة رفع المرفقات.");
        return false;
      }

      try {
        currentCompletion = await lookupRequestCompletion(ref, phone);
      } catch (error) {
        console.error(error);
        currentCompletion = null;
        toast("تم التعرف على الطلب، لكن تعذر قراءة المرفقات. حاول مرة أخرى.");
      }

      renderForms();
      renderAttachments();
      const pending = attachmentsFor().filter((item) => needsUpload(item)).length;
      if (pending) {
        toast(`تم التحميل. ${pending} مرفق/مرفقات تحتاج رفعاً جديداً.`);
      } else {
        toast("تم التحميل. لا توجد مرفقات مطلوبة حالياً.");
      }
      return true;
    } catch (err) {
      console.error(err);
      toast("حدث خطأ غير متوقع. حدّث الصفحة وحاول مرة أخرى.");
      return false;
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = prevLabel || "عرض المرفقات وإعادة الرفع";
      }
    }
  }

  async function uploadFile(file, folder) {
    if (!file) return null;
    if (window.CompletionUpload && CompletionUpload.uploadCompletionFile) {
      return CompletionUpload.uploadCompletionFile(
        sb,
        file,
        folder,
        currentRequest.reference_code
      );
    }
    const path = `${folder}/${currentRequest.reference_code}-${Date.now()}.${ext(file.name)}`;
    const { error } = await sb.storage
      .from("academy_files")
      .upload(path, file, { upsert: true, contentType: file.type || undefined });
    if (error) throw error;
    const { data } = sb.storage.from("academy_files").getPublicUrl(path);
    return data.publicUrl;
  }

  function completionErrMsg(err) {
    if (window.CompletionUpload && CompletionUpload.uploadErrorMessage) {
      return CompletionUpload.uploadErrorMessage(err);
    }
    const m = String((err && err.message) || err || "").trim();
    return m || "تعذر رفع أو حفظ المرفقات.";
  }

  async function submitCompletion(e) {
    e.preventDefault();
    if (!ensureSupabase()) return;
    if (!currentRequest) {
      toast("اضغط «عرض المرفقات» أولاً بعد إدخال المرجع والجوال.");
      return;
    }
    const p = profile();
    if (p.blocked || p.noAttachments) {
      toast(p.message || "لا مرفقات لرفعها.");
      return;
    }
    const items = attachmentsFor().filter((item) => needsUpload(item));
    if (!items.length) {
      toast("لا توجد مرفقات مطلوبة لإعادة الرفع حالياً.");
      return;
    }
    const submitBtn = document.querySelector('#completionForm button[type="submit"]');
    const prevBtnLabel = submitBtn ? submitBtn.textContent : "";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "جاري الإرسال...";
    }
    try {
      for (const item of items) {
        const el = $(item.key);
        if (item.required && (!el || !el.files.length)) {
          toast(`يجب إرفاق: ${item.label}`);
          return;
        }
      }
      toast("جاري رفع الملفات...");
      const payload = {
        request_type: currentRequest.request_type,
        full_name: currentRequest.full_name,
        phone: currentRequest.phone,
        email: currentRequest.email,
        status: "completed",
        notes: ($("notes") && $("notes").value.trim()) || null
      };
      let uploaded = 0;
      for (const item of items) {
        const el = $(item.key);
        if (el && el.files.length) {
          const uploadedUrl = await uploadFile(el.files[0], item.folder);
          if (!uploadedUrl) {
            throw new Error(`تعذر رفع «${item.label}». حاول مرة أخرى.`);
          }
          payload[item.url] = uploadedUrl;
          payload[item.status] = "pending";
          payload[item.note] = null;
          uploaded++;
        }
      }
      if (!uploaded) {
        toast("لم يُرفع أي ملف. اختر الملفات من الخانات أعلاه.");
        return;
      }
      const saved = await upsertRequestCompletion(
        currentRequest.reference_code,
        currentRequest.phone,
        payload
      );
      if (!saved) {
        throw new Error("تم رفع الملفات لكن تعذر حفظ بيانات الاستكمال.");
      }
      try {
        await markJoinRequestReviewing(
          currentRequest.id,
          currentRequest.reference_code,
          currentRequest.phone
        );
      } catch (reviewErr) {
        console.warn(reviewErr);
      }
      toast("تم إرسال المرفقات بنجاح.");
      document.querySelectorAll("#attachmentsGrid input[type=file]").forEach((inp) => {
        inp.value = "";
      });
      const notesEl = $("notes");
      if (notesEl) notesEl.value = "";
      setTimeout(
        () =>
          (location.href = `request_status.html?ref=${encodeURIComponent(currentRequest.reference_code)}&phone=${encodeURIComponent(currentRequest.phone)}`),
        1200
      );
    } catch (err) {
      console.error(err);
      toast(completionErrMsg(err));
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = prevBtnLabel || "إرسال المرفقات";
      }
    }
  }

  function ensureSupabase() {
    if (sb) return true;
    try {
      sb = createSupabaseClient();
      return true;
    } catch (err) {
      console.error(err);
      toast(
        "تعذر الاتصال بالخادم. تحقق من الإنترنت ثم حدّث الصفحة (Ctrl+F5)."
      );
      return false;
    }
  }

  function init() {
    window.__reqCompletionReady = true;

    const verifyBtn = $("verifyBtn");
    const form = $("completionForm");
    if (verifyBtn) {
      verifyBtn.addEventListener("click", async () => {
        if (!ensureSupabase()) return;
        await loadRequestAndAttachments();
      });
    }
    if (form) {
      form.addEventListener("submit", submitCompletion);
    }

    const params = new URLSearchParams(location.search);
    if (params.get("ref")) $("refInput").value = params.get("ref");
    if (params.get("phone")) $("phoneInput").value = params.get("phone");
    if (params.get("ref") && params.get("phone")) {
      if (ensureSupabase()) loadRequestAndAttachments();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
