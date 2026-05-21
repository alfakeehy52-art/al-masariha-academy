(function () {
  const COACH_REVIEW_FILES = [
    { key: "id_document", title: "الهوية / المستند الرسمي", url: "id_document_url", status: "id_document_status", required: true },
    { key: "personal_photo", title: "الصورة الشخصية", url: "personal_photo_url", status: "personal_photo_status", required: true },
    { key: "contract_file", title: "عقد المدرب", url: "contract_file_url", status: "contract_file_status", required: true },
    { key: "pledge_file", title: "تعهد المدرب", url: "pledge_file_url", status: "pledge_file_status", required: true },
    { key: "certificate_file", title: "الشهادة / المؤهل", url: "certificate_file_url", status: "certificate_file_status", required: false }
  ];

  const PLAYER_REVIEW_FILES = [
    { key: "id_document", title: "الهوية / الإقامة", url: "id_document_url", status: "id_document_status", required: true },
    { key: "personal_photo", title: "صورة اللاعب", url: "personal_photo_url", status: "personal_photo_status", required: true },
    { key: "player_join_file", title: "نموذج انضمام اللاعب", url: "player_join_file_url", status: "player_join_file_status", required: true },
    { key: "guardian_approval_file", title: "موافقة ولي الأمر", url: "guardian_approval_file_url", status: "guardian_approval_file_status", required: true },
    { key: "player_commitment_file", title: "تعهد الالتزام", url: "player_commitment_file_url", status: "player_commitment_file_status", required: true },
    { key: "medical_file", title: "الشهادة الطبية", url: "medical_file_url", status: "medical_file_status", required: true }
  ];

  function getReviewFilesByType(type) {
    return String(type || "") === "player" ? PLAYER_REVIEW_FILES : COACH_REVIEW_FILES;
  }

  function completionIsFullyApproved(completion, requestType) {
    if (!completion) return false;
    const files = getReviewFilesByType(requestType || completion.request_type);
    return files
      .filter((f) => f.required)
      .every(
        (f) =>
          String(completion[f.status] || "pending") === "approved" &&
          String(completion[f.url] || "").trim()
      );
  }

  function reviewMissingItems(completion, requestType) {
    if (!completion) return ["لم يتم استكمال المرفقات لهذا الطلب حتى الآن."];
    const files = getReviewFilesByType(requestType || completion.request_type);
    return files
      .filter((f) => f.required)
      .filter(
        (f) =>
          !String(completion[f.url] || "").trim() ||
          String(completion[f.status] || "pending") !== "approved"
      )
      .map((f) => f.title);
  }

  function reviewProgressLabel(completion, requestType) {
    const files = getReviewFilesByType(requestType || completion?.request_type);
    const required = files.filter((f) => f.required);
    const approved = required.filter(
      (f) =>
        String(completion?.[f.status] || "pending") === "approved" &&
        String(completion?.[f.url] || "").trim()
    ).length;
    return `${approved} / ${required.length} معتمد`;
  }

  function primaryExtraFileUrl(completion, requestType) {
    const type = requestType || completion?.request_type;
    if (type === "player") {
      return completion?.player_join_file_url || completion?.medical_file_url || null;
    }
    return completion?.contract_file_url || completion?.certificate_file_url || null;
  }

  window.getReviewFilesByType = getReviewFilesByType;
  window.completionIsFullyApproved = completionIsFullyApproved;
  window.reviewMissingItems = reviewMissingItems;
  window.reviewProgressLabel = reviewProgressLabel;
  window.primaryExtraFileUrl = primaryExtraFileUrl;
})();
