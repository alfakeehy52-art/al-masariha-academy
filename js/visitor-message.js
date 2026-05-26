/**
 * رسائل آمنة للزائر — بدون مصطلحات تقنية (Supabase، RLS، SQL…).
 */
(function () {
  const TECH =
    /supabase|postgresql|postgres|pgrst|row\s*level|schema\s*cache|could\s*not\s*find|column\s*of|anon\s*key|api\s*key|service\s*role|jwt|\.sql\b|join_requests|guardian_name|قاعدة\s*البيانات|rpc\b|storage\s*bucket|permission\s*denied|violates|constraint|duplicate\s*key|fetch\s*failed|network\s*error|failed\s*to\s*fetch|401|403|500|internal\s*server|اعتماد\s*الشراكة|بعد\s*اعتماد\s*الشراكة/i;

  function sanitizeVisitorMessage(msg, fallback) {
    const text = String(msg || "").trim();
    if (!text || TECH.test(text)) {
      return (
        fallback ||
        "تعذر إتمام العملية. حاول لاحقاً أو تواصل مع الأكاديمية عبر صفحة التواصل."
      );
    }
    return text;
  }

  window.sanitizeVisitorMessage = sanitizeVisitorMessage;
})();
