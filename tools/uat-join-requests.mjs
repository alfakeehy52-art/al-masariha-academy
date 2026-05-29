/**
 * اختبار قبول — إدراج طلبات UAT والتحقق من RPC
 * التشغيل: node tools/uat-join-requests.mjs
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadConfig() {
  const raw = readFileSync(join(root, "supabase-config.js"), "utf8");
  const url = raw.match(/url:\s*["']([^"']+)["']/)?.[1];
  const anonKey = raw.match(/anonKey:\s*["']([^"']+)["']/s)?.[1]?.replace(/\s+/g, "");
  if (!url || !anonKey) throw new Error("Could not parse supabase-config.js");
  return { url, anonKey };
}

const { url: SUPABASE_URL, anonKey: ANON_KEY } = loadConfig();
const REST = `${SUPABASE_URL}/rest/v1`;
const RPC = `${SUPABASE_URL}/rest/v1/rpc`;

const stamp = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
};

const PHONE = "0599001234";
const EMAIL = "uat.acceptance@masariha.test";

const samples = [
  {
    label: "لاعب UAT",
    row: {
      reference_code: `UAT-PLY-${stamp()}`,
      request_type: "player",
      full_name: "لاعب اختبار اعتماد",
      phone: PHONE,
      email: EMAIL,
      city: "جازان",
      status: "new",
      age_category: "ناشئين",
      position: "وسط",
      player_age: 14,
      player_notes: "طلب UAT — يُحذف لاحقاً",
      guardian_name: "ولي اختبار",
      guardian_phone: "0582000000",
      relationship: "أب"
    }
  },
  {
    label: "عضو أكاديمية UAT",
    row: {
      reference_code: `UAT-MEM-${stamp()}`,
      request_type: "academy_member",
      full_name: "عضو متابعة UAT",
      phone: "0599001235",
      email: EMAIL,
      city: "جازان",
      status: "new",
      notes: "الاهتمامات: أخبار، فعاليات"
    }
  }
];

async function api(path, { method = "GET", body, preferReturn = false } = {}) {
  const headers = {
    apikey: ANON_KEY,
    Authorization: `Bearer ${ANON_KEY}`,
    "Content-Type": "application/json"
  };
  if (preferReturn) headers.Prefer = "return=representation";
  const res = await fetch(`${REST}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { ok: res.ok, status: res.status, data };
}

async function rpc(name, params) {
  const res = await fetch(`${RPC}/${name}`, {
    method: "POST",
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(params)
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { ok: res.ok, status: res.status, data };
}

function log(ok, msg, detail) {
  const icon = ok ? "PASS" : "FAIL";
  console.log(`[${icon}] ${msg}`);
  if (detail !== undefined) console.log("       ", typeof detail === "object" ? JSON.stringify(detail).slice(0, 400) : detail);
}

async function main() {
  console.log("=== UAT: join_requests + RPC ===\n");
  const inserted = [];

  for (const s of samples) {
    const ins = await api("/join_requests", {
      method: "POST",
      body: s.row,
      preferReturn: true
    });
    if (ins.ok && Array.isArray(ins.data) && ins.data[0]) {
      inserted.push({ label: s.label, ...ins.data[0] });
      log(true, `Insert: ${s.label}`, s.row.reference_code);
    } else {
      log(false, `Insert: ${s.label}`, ins.data || ins.status);
    }
  }

  if (!inserted.length) {
    console.log("\nNo rows inserted — check RLS / columns. Aborting RPC checks.");
    process.exit(1);
  }

  const ply = inserted.find((r) => r.request_type === "player") || inserted[0];
  const ref = ply.reference_code;
  const phone = ply.phone;

  const lookup1 = await rpc("lookup_join_request_by_ref_phone", { p_ref: ref, p_phone: phone });
  log(
    lookup1.ok && (Array.isArray(lookup1.data) ? lookup1.data.length > 0 : lookup1.data),
    "RPC lookup_join_request_by_ref_phone",
    lookup1.ok ? ref : lookup1.data
  );

  const lookup2 = await rpc("lookup_join_requests_by_contact", { p_phone: phone, p_email: EMAIL });
  log(
    lookup2.ok && Array.isArray(lookup2.data) && lookup2.data.length > 0,
    "RPC lookup_join_requests_by_contact",
    lookup2.ok ? `${lookup2.data?.length || 0} row(s)` : lookup2.data
  );

  const lookup3 = await rpc("lookup_request_completion", { p_ref: ref, p_phone: phone });
  log(
    lookup3.ok,
    "RPC lookup_request_completion (no row expected yet)",
    Array.isArray(lookup3.data) && lookup3.data.length === 0 ? "empty OK" : lookup3.data
  );

  console.log("\n--- Summary for manual UI test ---");
  for (const r of inserted) {
    console.log(`${r.label}: ref=${r.reference_code} phone=${r.phone}`);
  }
  console.log(`\nOpen: request_status.html?ref=${encodeURIComponent(ref)}&phone=${encodeURIComponent(phone)}`);
  console.log("\nTo remove UAT rows later, delete by reference_code prefix UAT- in Supabase Table Editor.\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
