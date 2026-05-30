/**
 * فحص محتوى الإطلاق — أخبار «اختبار» ومنتجات المتجر (قراءة فقط عبر anon)
 */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const raw = readFileSync(join(root, "supabase-config.js"), "utf8");
const url = raw.match(/url:\s*["']([^"']+)["']/)?.[1];
const anonKey = raw.match(/anonKey:\s*["']([^"']+)/s)?.[1]?.replace(/\s+/g, "");
if (!url || !anonKey) throw new Error("supabase-config.js");

const headers = {
  apikey: anonKey,
  Authorization: `Bearer ${anonKey}`,
  "Content-Type": "application/json"
};

async function rpc(name, body = {}) {
  const res = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { ok: res.ok, status: res.status, data };
}

const news = await rpc("list_news_public");
console.log("=== أخبار منشورة ===");
if (!news.ok) console.log("خطأ:", news.status, news.data);
else {
  const rows = Array.isArray(news.data) ? news.data : [];
  rows.forEach((n) => console.log(`- ${n.title} (${n.id})`));
  const test = rows.filter((n) => /اختبار/i.test(String(n.title || "")));
  console.log(`إجمالي: ${rows.length} | تجريبي: ${test.length}`);
}

const store = await rpc("list_store_products_public");
console.log("\n=== متجر (عام) ===");
if (!store.ok) console.log("خطأ:", store.status, store.data);
else {
  const rows = Array.isArray(store.data) ? store.data : [];
  rows.forEach((p) => console.log(`- ${p.name} | ${p.status} (${p.id})`));
  const pub = rows.filter((p) => p.status === "published");
  console.log(`إجمالي: ${rows.length} | منشور: ${pub.length}`);
}
