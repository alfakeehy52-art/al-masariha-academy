import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dest = path.join(root, "al_masariha_join_page.html");
const sources = [
  path.join(root, "..", "Downloads", "al_masariha_join_page.html"),
  "C:\\Users\\alfak\\Downloads\\al_masariha_join_page.html",
  path.join(root, "..", "al-masariha-academy-main", "al-masariha-academy-main", "al_masariha_join_page.html"),
  "C:\\Users\\alfak\\Desktop\\al-masariha-academy-main\\al-masariha-academy-main\\al_masariha_join_page.html"
];

const src = sources.find((p) => fs.existsSync(p));
if (!src) {
  console.error("Join page source not found.");
  process.exit(1);
}

let html = fs.readFileSync(src, "utf8");
html = html.replace('src="/supabase-config.js"', 'src="supabase-config.js"');
if (!html.includes("js/supabase-client.js")) {
  html = html.replace(
    '<script src="supabase-config.js"></script>',
    '<script src="supabase-config.js"></script>\n  <script src="js/supabase-client.js"></script>'
  );
}
html = html.replace(
  /const \{ url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY \} = window\.SUPABASE_CONFIG \|\| \{\};\s*if\(!SUPABASE_URL \|\| !SUPABASE_ANON_KEY\)\{ throw new Error\([^)]+\); \}\s*const supabaseClient=window\.supabase\.createClient\(SUPABASE_URL,SUPABASE_ANON_KEY\);/,
  "const supabaseClient = createSupabaseClient();"
);
fs.writeFileSync(dest, html, "utf8");
console.log("Wrote", dest, fs.statSync(dest).size, "bytes from", src);
