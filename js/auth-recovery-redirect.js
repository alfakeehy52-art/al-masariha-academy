/**
 * إذا فُتح رابط استعادة كلمة المرور على صفحة خاطئة (مثل انضم إلينا)،
 * انقل المستخدم إلى reset_password.html مع نفس الرموز.
 */
(function () {
  if (/reset_password\.html/i.test(location.pathname)) return;

  const hash = location.hash || "";
  const search = location.search || "";
  const isRecovery =
    /type=recovery/i.test(hash) ||
    /access_token=/i.test(hash) ||
    /[?&]code=/i.test(search);

  if (!isRecovery) return;

  const target = new URL("reset_password.html", location.href);
  if (search) target.search = search;
  if (hash) target.hash = hash;
  location.replace(target.href);
})();
