/**
 * Phase 1: unify Supabase on supabase-config.js + js/supabase-client.js
 * Run: node tools/migrate-supabase-config.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3bXlxbHlkZW5yemt6cnltaHZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NDQ2NjAsImV4cCI6MjA5MzAyMDY2MH0.TCPgHAHhILaD5tFsZiFIgLvH7yuxkrtJ29F5J5oHQrw";
const URL = "https://uwmyqlydenrzkzrymhvl.supabase.co";

const CONFIG_BLOCK =
  '<script src="supabase-config.js"></script><script src="js/supabase-client.js"></script>';

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    if (name === ".git" || name === "node_modules") continue;
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(html|js)$/i.test(name) && name !== "supabase-config.js")
      out.push(p);
  }
  return out;
}

function injectConfigScripts(text) {
  if (text.includes("supabase-config.js")) {
    if (!text.includes("js/supabase-client.js")) {
      text = text.replace(
        /<script src="supabase-config\.js"><\/script>/,
        CONFIG_BLOCK
      );
    }
    return text;
  }
  return text.replace(
    /<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2"><\/script>/g,
    (m) => m + CONFIG_BLOCK
  );
}

function stripInlineConfig(text) {
  text = text.replace(
    new RegExp(
      `const\\s+SUPABASE_URL\\s*=\\s*["'\`]${URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'\`]\\s*;?\\s*`,
      "g"
    ),
    ""
  );
  text = text.replace(
    new RegExp(
      `const\\s+SUPABASE_KEY\\s*=\\s*["'\`]${ANON.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'\`]\\s*;?\\s*`,
      "g"
    ),
    ""
  );
  text = text.replace(
    new RegExp(
      `const\\s+SUPABASE_KEY_SAFE\\s*=\\s*["'\`]${ANON.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'\`]\\s*;?\\s*`,
      "g"
    ),
    ""
  );
  text = text.replace(
    new RegExp(
      `const\\s+REAL_SUPABASE_KEY\\s*=\\s*["'\`]${ANON.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'\`]\\s*;?\\s*`,
      "g"
    ),
    ""
  );
  // minified inline pairs
  text = text.replace(
    new RegExp(
      `const\\s+SUPABASE_URL\\s*=\\s*["'\`]${URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'\`]\\s*;\\s*const\\s+SUPABASE_KEY\\s*=\\s*["'\`]${ANON.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'\`]\\s*;\\s*`,
      "g"
    ),
    ""
  );
  text = text.replace(
    /\/\/ تصحيح احتياطي:[\s\S]*?const REAL_SUPABASE_KEY[\s\S]*?;\s*/g,
    ""
  );
  return text;
}

function unifyClientCreation(text) {
  text = text.replace(
    /const\s+supabaseClient\s*=\s*window\.supabase\.createClient\s*\(\s*SUPABASE_URL\s*,\s*SUPABASE_KEY\s*\)\s*;?/g,
    "const supabaseClient = createSupabaseClient();"
  );
  text = text.replace(
    /const\s+sb\s*=\s*window\.supabase\.createClient\s*\(\s*SUPABASE_URL\s*,\s*SUPABASE_KEY\s*\)\s*;?/g,
    "const sb = createSupabaseClient();"
  );
  text = text.replace(
    /const\s+supabaseClient\s*=\s*window\.supabase\.createClient\s*\(\s*SUPABASE_URL\s*,\s*SUPABASE_ANON_KEY\s*\)\s*;?/g,
    "const supabaseClient = createSupabaseClient();"
  );
  text = text.replace(
    /const\s*\{\s*url\s*,\s*anonKey\s*\}\s*=\s*window\.SUPABASE_CONFIG\s*\|\|\s*\{\}\s*;\s*const\s+sb\s*=\s*window\.supabase\.createClient\s*\(\s*url\s*,\s*anonKey\s*\)\s*;?/g,
    "const sb = createSupabaseClient();"
  );
  return text;
}

function migrateStatsDashboard(text) {
  if (!text.includes("stats_dashboard")) return text;
  text = text.replace(
    /const\s*\{\s*url:\s*SUPABASE_URL,\s*anonKey:\s*SUPABASE_ANON_KEY\s*\}\s*=\s*window\.SUPABASE_CONFIG\s*\|\|\s*\{\}\s*;\s*if\s*\(!SUPABASE_URL\s*\|\|\s*!SUPABASE_ANON_KEY\)\s*\{\s*throw new Error\([^)]+\);\s*\}\s*const\s+supabaseClient\s*=\s*window\.supabase\.createClient\s*\(\s*SUPABASE_URL,\s*SUPABASE_ANON_KEY\s*\)\s*;/,
    "const supabaseClient = createSupabaseClient();"
  );
  return text;
}

function migratePublicProfile(text) {
  if (!text.includes("al_masariha_player_profile_public")) return text;
  text = text.replace(
    /const\s+SUPABASE_URL\s*=\s*["'`][^"'`]+["'`]\s*;\s*const\s+SUPABASE_KEY\s*=\s*["'`][^"'`]+["'`]\s*;/,
    'const { url: SUPABASE_URL, anonKey: SUPABASE_KEY } = getSupabaseConfig();'
  );
  return text;
}

let changed = 0;
for (const file of walk(root)) {
  const rel = path.relative(root, file);
  if (rel.startsWith("tools" + path.sep) && !rel.endsWith(".html")) continue;

  let text = fs.readFileSync(file, "utf8");
  const before = text;

  if (!text.includes(URL) && !text.includes(ANON) && !text.includes("@supabase/supabase-js"))
    continue;

  if (text.includes("@supabase/supabase-js") || text.includes("createClient")) {
    text = injectConfigScripts(text);
  }
  text = stripInlineConfig(text);
  text = unifyClientCreation(text);
  text = migrateStatsDashboard(text);
  if (rel.endsWith("al_masariha_player_profile_public.html")) {
    text = migratePublicProfile(text);
  }

  if (text !== before) {
    fs.writeFileSync(file, text, "utf8");
    console.log("updated:", rel);
    changed++;
  }
}

console.log("Done.", changed, "file(s).");
