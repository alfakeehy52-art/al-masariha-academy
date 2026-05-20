import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");
const src = path.join(root, "volunteers_requests.html");
const dest = path.join(root, "staff_requests.html");

let html = fs.readFileSync(src, "utf8");
html = html.replace("طلبات المتطوعين", "طلبات الكوادر");
html = html.replace(
  '<script src="admin_sidebar.js"></script><script>window.REQUEST_TYPE="volunteer";</script>',
  '<script src="admin_sidebar.js"></script><script src="js/academy-roles.js"></script><script>window.REQUEST_TYPE="staff";</script>'
);
fs.writeFileSync(dest, html, "utf8");
console.log("Wrote", dest, html.length, "bytes");
