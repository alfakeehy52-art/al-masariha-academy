/**
 * يحدّث sitemap.xml من SITE_URL (متغير بيئة أو وسيطة سطر الأوامر).
 * مثال: node scripts/prepare-sitemap.mjs https://academy.example.com
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const base = (process.argv[2] || process.env.SITE_URL || "").replace(/\/+$/, "");

if (!base || !/^https?:\/\//i.test(base)) {
  console.error("Usage: node scripts/prepare-sitemap.mjs https://YOUR-DOMAIN.com");
  process.exit(1);
}

const pages = [
  "index.html",
  "al_masariha_about_page.html",
  "al_masariha_join_page.html",
  "request_status.html",
  "al_masariha_players_page.html",
  "al_masariha_coaches_page.html",
  "al_masariha_teams_page.html",
  "al_masariha_matches_page.html",
  "al_masariha_news_page.html",
  "al_masariha_media_page.html",
  "al_masariha_stats_page.html",
  "al_masariha_store_page.html",
  "store_order_status.html",
  "al_masariha_contact_page.html",
  "al_masariha_memberships_page.html"
];

const priority = {
  "index.html": "1.0",
  "al_masariha_join_page.html": "0.9",
  "al_masariha_store_page.html": "0.8"
};

const xml =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  pages
    .map((p) => {
      const pr = priority[p] || "0.7";
      return `  <url><loc>${base}/${p}</loc><changefreq>weekly</changefreq><priority>${pr}</priority></url>`;
    })
    .join("\n") +
  `\n</urlset>\n`;

const out = path.join(root, "sitemap.xml");
fs.writeFileSync(out, xml, "utf8");
console.log("Wrote", out, "with base", base);
