import fs from "fs";
const p = new URL("../al_masariha_join_page.html", import.meta.url);
let t = fs.readFileSync(p, "utf8");
const end = t.indexOf("</html>");
if (end >= 0) {
  t = t.slice(0, end + 7) + "\n";
} else {
  const tag = '<script src="js/join-page-app.js"></script>';
  const j = t.indexOf(tag);
  t = t.slice(0, j + tag.length) + "\n</body>\n</html>\n";
}
fs.writeFileSync(p, t);
console.log("trimmed to", t.length, "chars");
