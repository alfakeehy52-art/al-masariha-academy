(function () {
  function catalog() {
    return window.JOIN_ATTACHMENT_CATALOG;
  }

  function getReviewFilesByType(type, ctx) {
    const cat = catalog();
    if (cat && cat.getReviewFilesByType) {
      return cat.getReviewFilesByType(type, ctx);
    }
    return [];
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
    if (type === "staff" || type === "coach") {
      return completion?.contract_file_url || completion?.certificate_file_url || null;
    }
    return completion?.contract_file_url || completion?.player_join_file_url || null;
  }

  window.getReviewFilesByType = getReviewFilesByType;
  window.completionIsFullyApproved = completionIsFullyApproved;
  window.reviewMissingItems = reviewMissingItems;
  window.reviewProgressLabel = reviewProgressLabel;
  window.primaryExtraFileUrl = primaryExtraFileUrl;
})();
