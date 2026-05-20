import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const GUARD_SNIPPET = `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script><script src="supabase-config.js"></script><script src="js/supabase-client.js"></script><script src="js/admin-auth.js"></script><script>requireAdmin();</script>`;

const GUARD_SNIPPET_FORMATTED = `  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="supabase-config.js"></script>
  <script src="js/supabase-client.js"></script>
  <script src="js/admin-auth.js"></script>
  <script>requireAdmin();</script>`;

const INLINE_ONE_LINE =
  /<script>if\s*\(\s*localStorage\.getItem\s*\(\s*['"]adminLoggedIn['"]\s*\)\s*!==?\s*['"]true['"]\s*\)\s*\{[^<]*admin_login\.html[^<]*\}\s*function\s+adminLogout\s*\(\s*\)\s*\{[^<]*\}\s*<\/script>/gi;

const INLINE_MULTILINE =
  /<script>\s*if\s*\(\s*localStorage\.getItem\s*\(\s*["']adminLoggedIn["']\s*\)\s*!==?\s*["']true["']\s*\)\s*\{[\s\S]*?function\s+adminLogout\s*\(\s*\)\s*\{[\s\S]*?\}\s*<\/script>/gi;

const PARTIAL_AUTH =
  /<script\s+src=["']js\/admin-auth\.js["']><\/script>\s*<script>requireAdmin\(\);<\/script>/gi;

function patchFile(filePath) {
  let html = fs.readFileSync(filePath, "utf8");
  const before = html;

  if (filePath.endsWith("admin_login.html")) return false;

  html = html.replace(INLINE_ONE_LINE, GUARD_SNIPPET);
  html = html.replace(INLINE_MULTILINE, (match) => {
    return match.includes("\n") ? GUARD_SNIPPET_FORMATTED : GUARD_SNIPPET;
  });
  html = html.replace(PARTIAL_AUTH, GUARD_SNIPPET);

  if (html === before) return false;
  fs.writeFileSync(filePath, html, "utf8");
  return true;
}

const files = fs
  .readdirSync(root)
  .filter((f) => f.endsWith(".html"))
  .map((f) => path.join(root, f));

let updated = 0;
for (const file of files) {
  if (patchFile(file)) {
    updated += 1;
    console.log("updated:", path.basename(file));
  }
}

console.log(`Done. ${updated} file(s) updated.`);
