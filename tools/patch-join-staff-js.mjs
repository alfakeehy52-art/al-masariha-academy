import fs from "fs";

const p = new URL("../al_masariha_join_page.html", import.meta.url);
let h = fs.readFileSync(p, "utf8");

if (!h.includes("const roles = ()")) {
  h = h.replace(
    "const policy = () => window.ACADEMY_POLICY || {};",
    `const policy = () => window.ACADEMY_POLICY || {};
    const roles = () => window.ACADEMY_ROLES || {};
    function initStaffForm(){
      const domainSel=$('staffDomain');
      const roleSel=$('staffRole');
      const specSel=$('staffSpecialty');
      const catSel=$('staffCategory');
      if(!domainSel||!roleSel||!roles().getDomains) return;
      domainSel.innerHTML='<option value="">اختر المجال</option>'+roles().getDomains().map(d=>'<option value="'+d.id+'">'+d.label+'</option>').join('');
      if(specSel&&roles().COACH_SPECIALTIES) specSel.innerHTML='<option value="">اختر التخصص</option>'+roles().COACH_SPECIALTIES.map(s=>'<option>'+s+'</option>').join('');
      if(catSel&&roles().AGE_CATEGORIES) catSel.innerHTML='<option value="">اختر الفئة</option>'+roles().AGE_CATEGORIES.map(c=>'<option>'+c+'</option>').join('');
      domainSel.onchange=()=>{const d=domainSel.value;roleSel.disabled=!d;roleSel.innerHTML=d?'<option value="">اختر الدور</option>'+roles().getRoles(d).map(r=>'<option value="'+r.id+'">'+r.label+'</option>').join(''):'<option value="">اختر المجال أولاً</option>';updateStaffSportsFields();};
      roleSel.onchange=updateStaffSportsFields;
    }
    function updateStaffSportsFields(){
      const d=$('staffDomain')?.value||'';
      const r=$('staffRole')?.value||'';
      const show=roles().isSportsDomain&&roles().isSportsDomain(d)&&roles().needsSportsDetail&&roles().needsSportsDetail(r);
      document.querySelectorAll('.staff-sports-only').forEach(el=>{el.style.display=show?'grid':'none';});
    }`
  );
}

h = h.replace(
  "if(activeType==='academy_member'){if(!getSelectedMemberInterests().length){showToast('اختر اهتماماً واحداً على الأقل.','warn');return false}}return true}",
  "if(activeType==='academy_member'){if(!getSelectedMemberInterests().length){showToast('اختر اهتماماً واحداً على الأقل.','warn');return false}}if(activeType==='staff'){if(!formData.staffDomain){showToast('اختر مجال الكادر.','warn');return false}if(!formData.staffRole){showToast('اختر الدور المطلوب.','warn');return false}}return true}"
);

h = h.replace(
  `if(activeType === 'supporter' && cleanText(data.supportNotes)) lines.push(cleanText(data.supportNotes));
      if(activeType === 'volunteer' && cleanText(data.volunteerNotes)) lines.push(cleanText(data.volunteerNotes));

      if(activeType === 'coach'){
        if(cleanText(data.coachJobTitle)) lines.push(\`المسمى الفني: \${cleanText(data.coachJobTitle)}\`);
        if(cleanText(data.coachCategory)) lines.push(\`الفئة المشرف عليها: \${cleanText(data.coachCategory)}\`);
        if(cleanText(data.coachCertification)) lines.push(\`الشهادة / الاعتماد: \${cleanText(data.coachCertification)}\`);
        if(cleanText(data.coachBio)) lines.push(\`نبذة المدرب: \${cleanText(data.coachBio)}\`);
        if(cleanText(data.coachNotes)) lines.push(\`ملاحظات المدرب: \${cleanText(data.coachNotes)}\`);
      }`,
  `if(activeType === 'supporter' && cleanText(data.supportNotes)) lines.push(cleanText(data.supportNotes));
      if(activeType === 'staff'){
        const extra=[];
        if(cleanText(data.staffSpecialty)) extra.push('التخصص: '+cleanText(data.staffSpecialty));
        if(cleanText(data.staffCategory)) extra.push('الفئة: '+cleanText(data.staffCategory));
        if(cleanText(data.staffCertification)) extra.push('المؤهل: '+cleanText(data.staffCertification));
        if(cleanText(data.staffBio)) extra.push('نبذة: '+cleanText(data.staffBio));
        if(cleanText(data.staffNotes)) extra.push(cleanText(data.staffNotes));
        if(roles().formatStaffNotes) lines.push(roles().formatStaffNotes(data.staffDomain,data.staffRole,extra));
      }`
);

h = h.replace(
  `if(activeType === 'volunteer'){
        Object.assign(base, {
          volunteer_field: cleanText(data.volunteerField),
          availability: cleanText(data.availability),
          volunteer_notes: cleanText(data.volunteerNotes)
        });
      }

      if(activeType === 'coach'){
        Object.assign(base, {
          coach_specialty: cleanText(data.coachSpecialty),
          coach_experience: cleanText(data.coachExperienceYears),
          notes
        });
      }`,
  `if(activeType === 'staff'){
        const roleLabel=roles().getRoleLabel?roles().getRoleLabel(data.staffRole):data.staffRole;
        Object.assign(base, {
          volunteer_field: cleanText(data.staffDomain),
          coach_specialty: roleLabel,
          coach_experience: cleanText(data.staffExperienceYears),
          availability: cleanText(data.staffAvailability),
          volunteer_notes: [cleanText(data.staffBio), cleanText(data.staffNotes)].filter(Boolean).join('\\n') || null,
          notes
        });
      }`
);

if (!h.includes("initStaffForm();")) {
  h = h.replace("refreshHijriTodayHint();", "initStaffForm();\n      refreshHijriTodayHint();");
}

fs.writeFileSync(p, h);
console.log("js patched");
