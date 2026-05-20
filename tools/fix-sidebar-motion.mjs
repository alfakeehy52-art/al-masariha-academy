import fs from "fs";
const p = new URL("../admin_sidebar.js", import.meta.url);
let s = fs.readFileSync(p, "utf8");
s = s.replaceAll('<motion id="admin-sidebar">', '<div id="admin-sidebar">');
fs.writeFileSync(p, s);
console.log("fixed");
