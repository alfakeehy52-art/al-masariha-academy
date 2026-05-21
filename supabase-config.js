(function () {
  window.SUPABASE_CONFIG = {
    url: "https://uwmyqlydenrzkzrymhvl.supabase.co",
    anonKey:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3bXlxbHlkZW5yemt6cnltaHZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NDQ2NjAsImV4cCI6MjA5MzAyMDY2MH0.TCPgHAHhILaD5tFsZiFIgLvH7yuxkrtJ29F5J5oHQrw",
    /** بريد المسؤولين المسموح لهم بدخول لوحة الإدارة (فارغ = أي مستخدم مسجّل بدور admin) */
    adminEmails: ["alfakeehy52@gmail.com"],
    /** عند true: يُقبل فقط من لديه role=admin في metadata */
    adminRequireRole: true,
    /** مرجع احتياطي للتاريخ الهجري إذا فشل المتصفح (يُحدَّث دورياً) */
    hijriToday: { year: 1447, month: 11, day: 1 },
    /** إعادة التوجيه بعد تفعيل/رابط بريد الكادر (يُضبط تلقائياً من الصفحة إن تُرك فارغاً) */
    staffActivationRedirect: "",
    /** النطاق العام — Cloudflare Pages */
    siteUrl: "https://al-masariha-academy.pages.dev"
  };
})();
