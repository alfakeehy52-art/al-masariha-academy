/**
 * فحص دخان للموقع — تحميل الصفحات والبحث عن نصوص إنجليزية ظاهرة وأخطاء شبكة.
 * التشغيل: node scripts/site-smoke-test.js [baseUrl]
 */
const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const BASE = (process.argv[2] || "http://127.0.0.1:8765").replace(/\/$/, "");

const PUBLIC_PAGES = [
  "index.html",
  "al_masariha_players_page.html",
  "al_masariha_coaches_page.html",
  "al_masariha_teams_page.html",
  "al_masariha_matches_page.html",
  "al_masariha_about_page.html",
  "al_masariha_media_page.html",
  "al_masariha_store_page.html",
  "al_masariha_news_page.html",
  "al_masariha_stats_page.html",
  "al_masariha_contact_page.html",
  "al_masariha_join_page.html",
  "request_status.html",
  "request_completion.html",
  "store_order_status.html",
  "staff_login.html",
  "admin_login.html",
  "al_masariha_privacy.html",
  "al_masariha_terms.html",
  "al_masariha_memberships_page.html",
  "al_masariha_registration_page.html",
  "reset_password.html",
  "join.html"
];

const ADMIN_PAGES = [
  "admin_dashboard.html",
  "admin_requests.html",
  "players_list_dashboard.html",
  "academy_settings_dashboard.html"
];

const ENGLISH_UI =
  /\b(Loading|Error|Success|Submit|Cancel|Delete|Edit|Save|Search|Filter|Login|Logout|Password|Email|Dashboard|Profile|Settings|Welcome|Click|Upload|Download|Supabase|database|PostgreSQL|undefined|null|Failed to fetch|Network error|QR Code|example@email|Export PDF|Filter results)\b/i;

const TECH_LEAK =
  /supabase|postgres|pgrst|row level|schema cache|join_requests|could not find the/i;

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    lib
      .get(url, (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () =>
          resolve({ status: res.statusCode, body: data, headers: res.headers })
        );
      })
      .on("error", reject);
  });
}

function stripScriptsAndStyles(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractScriptSrcs(html) {
  const srcs = [];
  const re = /<script[^>]+src=["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html))) srcs.push(m[1]);
  return srcs;
}

function resolveAsset(page, src) {
  if (/^https?:\/\//i.test(src)) return src;
  const pageDir = path.posix.dirname(page.replace(/\\/g, "/"));
  const joined = path.posix.normalize(path.posix.join("/", pageDir, src));
  return BASE + joined.replace(/\\/g, "/");
}

async function checkPage(page) {
  const url = `${BASE}/${page}`;
  const issues = [];
  let res;
  try {
    res = await fetchUrl(url);
  } catch (e) {
    return { page, ok: false, issues: [`تعذر الاتصال: ${e.message}`] };
  }
  if (res.status !== 200) {
    return { page, ok: false, issues: [`HTTP ${res.status}`] };
  }
  const visible = stripScriptsAndStyles(res.body);
  const en = visible.match(ENGLISH_UI);
  if (en) {
    const uniq = [...new Set(en.map((w) => w.toLowerCase()))];
    issues.push(`نص إنجليزي محتمل: ${uniq.slice(0, 8).join(", ")}`);
  }
  if (TECH_LEAK.test(res.body)) {
    issues.push("تسريب مصطلح تقني في HTML");
  }
  const srcs = extractScriptSrcs(res.body).filter((s) => !/^https?:\/\//i.test(s));
  for (const src of srcs.slice(0, 12)) {
    const assetUrl = resolveAsset(page, src.split("?")[0]);
    try {
      const ar = await fetchUrl(assetUrl);
      if (ar.status !== 200) issues.push(`سكربت مفقود (${ar.status}): ${src}`);
    } catch {
      issues.push(`سكربت غير قابل للتحميل: ${src}`);
    }
  }
  const titleM = res.body.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleM ? titleM[1].trim() : "";
  if (title && !/[\u0600-\u06FF]/.test(title)) {
    issues.push(`عنوان بدون عربي: ${title}`);
  }
  return { page, ok: issues.length === 0, issues, title };
}

async function main() {
  console.log(`\n=== فحص دخان الموقع ===\nالقاعدة: ${BASE}\n`);
  let fail = 0;
  for (const group of [
    ["صفحات الزوار", PUBLIC_PAGES],
    ["لوحة الإدارة (تحميل HTML فقط)", ADMIN_PAGES]
  ]) {
    console.log(`--- ${group[0]} ---`);
    for (const page of group[1]) {
      const r = await checkPage(page);
      if (r.ok) {
        console.log(`  OK  ${page}`);
      } else {
        fail++;
        console.log(`  FAIL ${page}`);
        r.issues.forEach((i) => console.log(`       - ${i}`));
      }
    }
  }
  const localOnly = fs
    .readdirSync(ROOT)
    .filter((f) => f.endsWith(".html"))
    .filter((f) => ![...PUBLIC_PAGES, ...ADMIN_PAGES].includes(f));
  if (localOnly.length) {
    console.log(`\nملاحظة: ${localOnly.length} صفحة HTML إضافية لم تُفحص في هذه القائمة.`);
  }
  console.log(`\nالنتيجة: ${fail ? `فشل ${fail} صفحة/فحص` : "جميع الصفحات المفحوصة OK"}\n`);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
