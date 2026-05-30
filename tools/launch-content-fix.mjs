/**
 * إصلاح محتوى الإطلاق:
 * - حذف خبر «اختبار»
 * - (اختياري) نشر طقم الأكاديمية إن لم يوجد منتج منشور
 *
 * التشغيل مع صلاحية الإدارة:
 *   set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
 *   node tools/launch-content-fix.mjs
 *
 * بدون المفتاح: يطبع SQL للتنفيذ في Supabase SQL Editor
 */
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const raw = readFileSync(join(root, "supabase-config.js"), "utf8");
const url = raw.match(/url:\s*["']([^"']+)["']/)?.[1];
const anonKey = raw.match(/anonKey:\s*["']([^"']+)/s)?.[1]?.replace(/\s+/g, "");
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

const TEST_NEWS_ID = "400c7fef-b72f-4352-b1ef-014da123e22a";
const KIT_PRODUCT_ID = "23aef5bd-d31c-4439-b124-c20c9804e958";

const SQL_PATH = join(root, "docs", "LAUNCH_UAT_CONTENT_FIX.sql");

const SQL = `-- إصلاح محتوى ما قبل الإطلاق (نفّذ في Supabase → SQL Editor)
-- حذف خبر تجريبي
DELETE FROM public.academy_news
WHERE id = '${TEST_NEWS_ID}'::uuid
   OR trim(title) = 'اختبار';

-- نشر طقم الأكاديمية (اختياري — يوجد بالفعل منتج «كرات تدريب» منشور)
UPDATE public.store_products
SET status = 'published', updated_at = now()
WHERE id = '${KIT_PRODUCT_ID}'::uuid
  AND status = 'coming_soon';
`;

function adminHeaders(key) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Prefer: "return=representation"
  };
}

async function rest(path, key, opts = {}) {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method: opts.method || "GET",
    headers: adminHeaders(key),
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { ok: res.ok, status: res.status, data };
}

async function main() {
  writeFileSync(SQL_PATH, SQL, "utf8");
  console.log("SQL saved:", SQL_PATH);

  if (!serviceKey) {
    console.log("\n⚠️  SUPABASE_SERVICE_ROLE_KEY غير مضبوط — نفّذ الملف أعلاه يدوياً في Supabase.");
    return;
  }

  const del = await rest(`academy_news?id=eq.${TEST_NEWS_ID}`, serviceKey, { method: "DELETE" });
  console.log("حذف خبر اختبار:", del.status, del.ok ? "OK" : del.data);

  const storeCheck = await fetch(`${url}/rest/v1/rpc/list_store_products_public`, {
    method: "POST",
    headers: adminHeaders(anonKey),
    body: "{}"
  }).then((r) => r.json());
  const published = (Array.isArray(storeCheck) ? storeCheck : []).filter(
    (p) => p.status === "published"
  );
  if (published.length > 0) {
    console.log("متجر: يوجد منتج منشور بالفعل —", published.map((p) => p.name).join(", "));
    return;
  }

  const pub = await rest(`store_products?id=eq.${KIT_PRODUCT_ID}`, serviceKey, {
    method: "PATCH",
    body: { status: "published" }
  });
  console.log("نشر الطقم:", pub.status, pub.ok ? "OK" : pub.data);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
