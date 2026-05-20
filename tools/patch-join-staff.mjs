import fs from "fs";

const p = new URL("../al_masariha_join_page.html", import.meta.url);
let h = fs.readFileSync(p, "utf8");

const staffPanel = `
        <section class="section type-panel" data-panel="staff">
          <h3 class="section-title">انضمام ككادر للأكاديمية</h3>
          <div class="policy-note">اختر المجال ثم الدور (رياضي، طبي، إداري، تشغيلي، إعلامي وتقني). يُراجع الطلب قبل التفعيل.</motion>
          <div class="grid">
            <div class="field"><label for="staffDomain">المجال <span style="color:#f5d46b">*</span></label><select id="staffDomain" name="staffDomain" required><option value="">اختر المجال</option></select></div>
            <div class="field"><label for="staffRole">الدور <span style="color:#f5d46b">*</span></label><select id="staffRole" name="staffRole" required disabled><option value="">اختر المجال أولاً</option></select></div>
            <div class="field staff-sports-only" style="display:none"><label for="staffSpecialty">التخصص</label><select id="staffSpecialty" name="staffSpecialty"><option value="">اختر التخصص</option></select></div>
            <motion class="field staff-sports-only" style="display:none"><label for="staffCategory">الفئة المشرف عليها</label><select id="staffCategory" name="staffCategory"><option value="">اختر الفئة</option></select></div>
            <div class="field"><label for="staffExperienceYears">سنوات الخبرة</label><input id="staffExperienceYears" name="staffExperienceYears" type="number" min="0" placeholder="مثال: 3" /></div>
            <div class="field"><label for="staffCertification">الشهادة / المؤهل</label><input id="staffCertification" name="staffCertification" type="text" placeholder="شهادة أو مؤهل مهني" /></div>
            <div class="field"><label for="staffAvailability">الوقت المتاح</label><select id="staffAvailability" name="staffAvailability"><option value="">اختر</option><option>صباحًا</option><option>مساءً</option><option>دوام كامل</option><option>حسب المناسبة</option></select></div>
            <div class="field full"><label for="staffBio">نبذة مختصرة</label><textarea id="staffBio" name="staffBio" placeholder="خبراتك ومهاراتك"></textarea></div>
            <div class="field full"><label for="staffNotes">ملاحظات إضافية</label><textarea id="staffNotes" name="staffNotes" placeholder="تفاصيل تساعد الإدارة"></textarea></div>
          </div>
        </section>`;

const staffPanelClean = staffPanel
  .replace(/<\/?motion\b[^>]*>/g, "")
  .replace(/<motion class="/g, '<motion class="')
  .replace(/motion>/g, "motion>");

// simpler: just write clean version
const clean = `
        <section class="section type-panel" data-panel="staff">
          <h3 class="section-title">انضمام ككادر للأكاديمية</h3>
          <div class="policy-note">اختر المجال ثم الدور (رياضي، طبي، إداري، تشغيلي، إعلامي وتقني). يُراجع الطلب قبل التفعيل.</div>
          <div class="grid">
            <div class="field"><label for="staffDomain">المجال <span style="color:#f5d46b">*</span></label><select id="staffDomain" name="staffDomain" required><option value="">اختر المجال</option></select></div>
            <div class="field"><label for="staffRole">الدور <span style="color:#f5d46b">*</span></label><select id="staffRole" name="staffRole" required disabled><option value="">اختر المجال أولاً</option></select></div>
            <div class="field staff-sports-only" style="display:none"><label for="staffSpecialty">التخصص</label><select id="staffSpecialty" name="staffSpecialty"><option value="">اختر التخصص</option></select></div>
            <div class="field staff-sports-only" style="display:none"><label for="staffCategory">الفئة المشرف عليها</label><select id="staffCategory" name="staffCategory"><option value="">اختر الفئة</option></select></div>
            <div class="field"><label for="staffExperienceYears">سنوات الخبرة</label><input id="staffExperienceYears" name="staffExperienceYears" type="number" min="0" placeholder="مثال: 3" /></div>
            <div class="field"><label for="staffCertification">الشهادة / المؤهل</label><input id="staffCertification" name="staffCertification" type="text" placeholder="شهادة أو مؤهل مهني" /></div>
            <div class="field"><label for="staffAvailability">الوقت المتاح</label><select id="staffAvailability" name="staffAvailability"><option value="">اختر</option><option>صباحًا</option><option>مساءً</option><option>دوام كامل</option><option>حسب المناسبة</option></select></div>
            <div class="field full"><label for="staffBio">نبذة مختصرة</label><textarea id="staffBio" name="staffBio" placeholder="خبراتك ومهاراتك"></textarea></div>
            <div class="field full"><label for="staffNotes">ملاحظات إضافية</label><textarea id="staffNotes" name="staffNotes" placeholder="تفاصيل تساعد الإدارة"></textarea></div>
          </div>
        </section>`.replace(/<motion class="field">/g, '<div class="field">').replace(/<\/motion>/g, "</div>");

const re =
  /\s*<section class="section type-panel" data-panel="volunteer">[\s\S]*?<\/section>\s*\n\s*<section class="section type-panel" data-panel="coach">[\s\S]*?<\/section>/;

if (!re.test(h)) {
  console.error("pattern not found");
  process.exit(1);
}

h = h.replace(re, clean);

if (!h.includes("academy-roles.js")) {
  h = h.replace(
    '<script src="js/academy-policy.js"></script>',
    '<script src="js/academy-policy.js"></script>\n  <script src="js/academy-roles.js"></script>'
  );
}

fs.writeFileSync(p, h);
console.log("patched");
