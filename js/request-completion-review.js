(function () {
  const COACH_REVIEW_FILES = [
    { key: "id_document", title: "الهوية / المستند الرسمي", url: "id_document_url", status: "id_document_status", note: "id_document_note", required: true },
    { key: "personal_photo", title: "الصورة الشخصية", url: "personal_photo_url", status: "personal_photo_status", note: "personal_photo_note", required: true },
    { key: "contract_file", title: "عقد المدرب", url: "contract_file_url", status: "contract_file_status", note: "contract_file_note", required: true },
    { key: "pledge_file", title: "تعهد المدرب", url: "pledge_file_url", status: "pledge_file_status", note: "pledge_file_note", required: true },
    { key: "certificate_file", title: "الشهادة / المؤهل", url: "certificate_file_url", status: "certificate_file_status", note: "certificate_file_note", required: false }
  ];

  const PLAYER_REVIEW_FILES = [
    { key: "id_document", title: "الهوية / الإقامة", url: "id_document_url", status: "id_document_status", note: "id_document_note", required: true },
    { key: "personal_photo", title: "صورة اللاعب", url: "personal_photo_url", status: "personal_photo_status", note: "personal_photo_note", required: true },
    { key: "player_join_file", title: "نموذج انضمام اللاعب", url: "player_join_file_url", status: "player_join_file_status", note: "player_join_file_note", required: true },
    { key: "guardian_approval_file", title: "موافقة ولي الأمر", url: "guardian_approval_file_url", status: "guardian_approval_file_status", note: "guardian_approval_file_note", required: true },
    { key: "player_commitment_file", title: "تعهد الالتزام", url: "player_commitment_file_url", status: "player_commitment_file_status", note: "player_commitment_file_note", required: true },
    { key: "medical_file", title: "الشهادة الطبية", url: "medical_file_url", status: "medical_file_status", note: "medical_file_note", required: true }
  ];

  const GUARDIAN_LINK_REVIEW_FILES = [
    { key: "id_document", title: "هوية / إقامة ولي الأمر", url: "id_document_url", status: "id_document_status", note: "id_document_note", required: true },
    { key: "personal_photo", title: "الصورة الشخصية لولي الأمر", url: "personal_photo_url", status: "personal_photo_status", note: "personal_photo_note", required: false },
    { key: "guardian_link_file", title: "نموذج ربط ولي الأمر بلاعب", url: "guardian_link_file_url", status: "guardian_link_file_status", note: "guardian_link_file_note", required: true }
  ];

  const GUARDIAN_NEW_REVIEW_FILES = [
    { key: "id_document", title: "هوية / إقامة ولي الأمر", url: "id_document_url", status: "id_document_status", note: "id_document_note", required: true },
    { key: "personal_photo", title: "الصورة الشخصية لولي الأمر", url: "personal_photo_url", status: "personal_photo_status", note: "personal_photo_note", required: false },
    { key: "guardian_pledge_file", title: "نموذج تسجيل لاعب جديد عبر ولي الأمر", url: "guardian_pledge_file_url", status: "guardian_pledge_file_status", note: "guardian_pledge_file_note", required: true },
    { key: "medical_file", title: "نموذج الكشف الطبي", url: "medical_file_url", status: "medical_file_status", note: "medical_file_note", required: true }
  ];

  const SUPPORTER_REVIEW_FILES = [
    { key: "id_document", title: "هوية الداعم / السجل التجاري", url: "id_document_url", status: "id_document_status", note: "id_document_note", required: true },
    { key: "supporter_logo", title: "شعار الجهة / الداعم", url: "supporter_logo_url", status: "supporter_logo_status", note: "supporter_logo_note", required: false },
    { key: "supporter_contract_file", title: "عقد الداعم الموقّع", url: "supporter_contract_file_url", status: "supporter_contract_file_status", note: "supporter_contract_file_note", required: true }
  ];

  const VOLUNTEER_REVIEW_FILES = [
    { key: "id_document", title: "هوية / إقامة المتطوع", url: "id_document_url", status: "id_document_status", note: "id_document_note", required: true },
    { key: "personal_photo", title: "الصورة الشخصية للمتطوع", url: "personal_photo_url", status: "personal_photo_status", note: "personal_photo_note", required: true },
    { key: "volunteer_agreement_file", title: "اتفاقية المتطوع الموقّعة", url: "volunteer_agreement_file_url", status: "volunteer_agreement_file_status", note: "volunteer_agreement_file_note", required: true },
    { key: "certificate_file", title: "الشهادات / الخبرات", url: "certificate_file_url", status: "certificate_file_status", note: "certificate_file_note", required: false }
  ];

  function guardianGoalFrom(ctx) {
    if (!ctx) return "";
    return String(ctx.guardian_goal || "").trim();
  }

  function getReviewFilesByType(type, ctx) {
    const t = String(type || ctx?.request_type || "").toLowerCase();
    if (t === "player") return PLAYER_REVIEW_FILES;
    if (t === "coach") return COACH_REVIEW_FILES;
    if (t === "guardian") {
      return guardianGoalFrom(ctx) === "register_new_player"
        ? GUARDIAN_NEW_REVIEW_FILES
        : GUARDIAN_LINK_REVIEW_FILES;
    }
    if (t === "supporter") return SUPPORTER_REVIEW_FILES;
    if (t === "volunteer") return VOLUNTEER_REVIEW_FILES;
    return COACH_REVIEW_FILES;
  }

  function completionIsFullyApproved(completion, requestType, ctx) {
    if (!completion) return false;
    const files = getReviewFilesByType(requestType || completion.request_type, ctx || completion);
    return files
      .filter((f) => f.required)
      .every(
        (f) =>
          String(completion[f.status] || "pending") === "approved" &&
          String(completion[f.url] || "").trim()
      );
  }

  function reviewMissingItems(completion, requestType, ctx) {
    if (!completion) return ["لم يتم استكمال المرفقات لهذا الطلب حتى الآن."];
    const files = getReviewFilesByType(requestType || completion.request_type, ctx || completion);
    return files
      .filter((f) => f.required)
      .filter(
        (f) =>
          !String(completion[f.url] || "").trim() ||
          String(completion[f.status] || "pending") !== "approved"
      )
      .map((f) => f.title);
  }

  function reviewProgressLabel(completion, requestType, ctx) {
    const files = getReviewFilesByType(requestType || completion?.request_type, ctx || completion);
    const required = files.filter((f) => f.required);
    const approved = required.filter(
      (f) =>
        String(completion?.[f.status] || "pending") === "approved" &&
        String(completion?.[f.url] || "").trim()
    ).length;
    return `${approved} / ${required.length} معتمد`;
  }

  function primaryExtraFileUrl(completion, requestType, ctx) {
    const type = requestType || completion?.request_type;
    if (type === "player") {
      return completion?.player_join_file_url || completion?.medical_file_url || null;
    }
    if (type === "guardian") {
      return completion?.guardian_link_file_url || completion?.guardian_pledge_file_url || null;
    }
    if (type === "supporter") {
      return completion?.supporter_contract_file_url || null;
    }
    if (type === "volunteer") {
      return completion?.volunteer_agreement_file_url || null;
    }
    return completion?.contract_file_url || completion?.certificate_file_url || null;
  }

  window.getReviewFilesByType = getReviewFilesByType;
  window.completionIsFullyApproved = completionIsFullyApproved;
  window.reviewMissingItems = reviewMissingItems;
  window.reviewProgressLabel = reviewProgressLabel;
  window.primaryExtraFileUrl = primaryExtraFileUrl;
})();
