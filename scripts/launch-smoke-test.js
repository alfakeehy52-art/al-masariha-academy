/**
 * اختبار دخان قبل الإطلاق — تحميل الصفحات + فحص نصوص إنجليزية ظاهرة.
 * التشغيل: node scripts/launch-smoke-test.js [baseUrl]
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const base = (process.argv[2] || "http://127.0.0.1:8765").replace(/\/$/, "");

const PUBLIC_PAGES = [
  "index.html",
  "al_masariha_about_page.html",
  "al_masariha_players_page.html",
  "al_masariha_coaches_page.html",
  "al_masariha_teams_page.html",
  "al_masariha_matches_page.html",
  "al_masariha_news_page.html",
  "al_masariha_media_page.html",
  "al_masariha_store_page.html",
  "al_masariha_stats_page.html",
  "al_masariha_contact_page.html",
  "al_masariha_join_page.html",
  "al_masariha_memberships_page.html",
  "al_masariha_terms.html",
  "al_masariha_privacy.html",
  "request_status.html",
  "request_completion.html",
  "store_order_status.html",
  "staff_login.html",
  "admin_login.html",
  "smart_contract.html"
];

const ADMIN_PAGES = [
  "admin_login.html",
  "admin_dashboard.html",
  "players_list_dashboard.html",
  "admin_requests.html"
];

const EN_UI =
  /\b(Loading|Error|Success|Submit|Cancel|Delete|Edit|Save|Search|Filter|Login|Logout|Password|Email|Database|Supabase|Failed|Welcome|Click|Upload|Download|Admin|Dashboard|Profile|Pending|Approved|Rejected|undefined|null|example@|QR Code|PDF|Excel|COA-|PLY-|REQ-2026)\b/i;

const TECH_UI =
  /(قاعدة\s*البيانات|supabase|postgres|schema\s*cache|row\s*level|\brls\b)/i;

function get(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => resolve({ status: res.statusCode, body }));
      })
      .on("error", reject);
  });
}

function stripScripts(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");
}

function visibleText(html) {
  return stripScripts(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function checkPage(file) {
  const url = `${base}/${file}`;
  try {
    const { status, body } = await get(url);
    if (status !== 200) {
      return { file, ok: false, issue: `HTTP ${status}` };
    }
    const text = visibleText(body);
    const en = text.match(EN_UI);
    const tech = text.match(TECH_UI);
    const issues = [];
    if (en) issues.push(`نص إنجليزي: ${[...new Set(en)].slice(0, 5).join(", ")}`);
    if (tech) issues.push(`مصطلح تقني: ${tech[0]}`);
    return { file, ok: issues.length === 0, issues, title: (body.match(/<title[^>]*>([^<]+)/i) || [])[1] };
  } catch (e) {
    return { file, ok: false, issue: e.message };
  }
}

async function main() {
  const files = [...new Set([...PUBLIC_PAGES, ...ADMIN_PAGES])];
  const missing = files.filter((f) => !fs.existsSync(path.join(root, f)));
  if (missing.length) console.warn("ملفات غير موجودة:", missing.join(", "));

  console.log(`\n=== اختبار دخان — ${base} ===\n`);
  const results = [];
  for (const file of files) {
    if (!fs.existsSync(path.join(root, file))) continue;
    const r = await checkPage(file);
    results.push(r);
    const mark = r.ok ? "OK" : "!!";
    console.log(`${mark}  ${file}${r.title ? " — " + r.title.trim() : ""}`);
    if (!r.ok) {
      if (r.issue) console.log(`     ${r.issue}`);
      (r.issues || []).forEach((i) => console.log(`     ${i}`));
    }
  }
  const bad = results.filter((r) => !r.ok);
  console.log(`\nالنتيجة: ${results.length - bad.length}/${results.length} صفحة بدون مشاكل ثابتة`);
  if (bad.length) process.exitCode = 1;
}

main();
