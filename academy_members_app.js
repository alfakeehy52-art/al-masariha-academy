const supabaseClient = createSupabaseClient();

let members = [];
let currentMemberId = null;

const STATUS_LABELS = {
  pending: "بانتظار الموافقة",
  approved: "مقبول",
  rejected: "مرفوض",
  suspended: "موقوف"
};

function interestLabelsMap() {
  const AMP = window.ACADEMY_MEMBER_PROFILE;
  if (AMP && AMP.INTERESTS) {
    return Object.fromEntries(Object.values(AMP.INTERESTS).map((o) => [o.id, o.label]));
  }
  return {
    news: "أخبار الأكاديمية",
    store: "عروض المتجر",
    future_player: "تسجيل لاعب مستقبلًا",
    support: "الرعاية والدعم",
    events: "حضور الفعاليات"
  };
}

function $(id){ return document.getElementById(id); }
function escapeHtml(value){ return String(value ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"); }
function shortText(v,n=60){ const s=String(v||""); return s.length>n?s.slice(0,n)+"…":s; }
function statusLabel(s){ return STATUS_LABELS[String(s||"pending")] || s || "بانتظار الموافقة"; }
function statusClass(s){
  s=String(s||"pending");
  if(s==="approved") return "status-approved";
  if(s==="rejected") return "status-rejected";
  if(s==="suspended") return "status-rejected";
  return "status-pending";
}
function formatDate(value){
  if(!value)return "-";
  const d=new Date(value);
  if(Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("ar-SA",{year:"numeric",month:"2-digit",day:"2-digit"});
}
function formatTime(value){
  if(!value)return "";
  const d=new Date(value);
  if(Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("ar-SA",{hour:"2-digit",minute:"2-digit"});
}
function interestsText(arr){
  if(!Array.isArray(arr) || !arr.length) return "-";
  const labels = interestLabelsMap();
  return arr.map((x) => labels[x] || (window.ACADEMY_MEMBER_PROFILE?.interestLabel?.(x) || x)).join("، ");
}
function memberCode(m){
  if(m.member_code) return m.member_code;
  const shortId=String(m.id||"").replace(/-/g,"").slice(0,6).toUpperCase()||"000000";
  return `MEM-${shortId}`;
}
function showToast(message,type="success"){
  const wrap=$("toastWrap");
  if(!wrap)return;
  const t=document.createElement("div");
  t.className="toast "+type;
  t.textContent=message;
  wrap.appendChild(t);
  setTimeout(()=>{t.style.opacity="0";t.style.transform="translateY(8px)";t.style.transition=".2s ease";setTimeout(()=>t.remove(),220)},3000);
}


function ensureSmartConfirm(){
  if(document.getElementById("memberConfirmOverlay")) return;
  const style=document.createElement("style");
  style.id="member-confirm-style";
  style.textContent=`
    .member-confirm-overlay{position:fixed;inset:0;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(0,0,0,.68);backdrop-filter:blur(10px);z-index:12000}
    .member-confirm-overlay.show{display:flex}
    .member-confirm-box{width:min(540px,100%);border:1px solid rgba(213,177,90,.24);border-radius:28px;background:linear-gradient(180deg,#102217,#07130d);box-shadow:0 28px 90px rgba(0,0,0,.52);overflow:hidden;color:#f3f4ef;font-family:'Cairo',system-ui,sans-serif}
    .member-confirm-head{padding:24px 24px 12px;display:flex;gap:14px;align-items:flex-start}
    .member-confirm-icon{width:56px;height:56px;min-width:56px;border-radius:18px;display:grid;place-items:center;background:rgba(213,177,90,.12);border:1px solid rgba(213,177,90,.28);font-size:28px}
    .member-confirm-title{margin:0;font-size:23px;font-weight:900;color:#f0d58f}
    .member-confirm-text{margin:8px 0 0;color:#b6c1b8;line-height:1.9;font-size:14px}
    .member-confirm-actions{display:flex;gap:10px;justify-content:flex-start;padding:16px 24px 24px;flex-wrap:wrap}
    .member-confirm-btn{min-height:50px;padding:0 20px;border-radius:16px;border:1px solid rgba(255,255,255,.10);font-weight:900;cursor:pointer;font-family:inherit}
    .member-confirm-ok{background:linear-gradient(180deg,#e4c36f,#d5b15a);color:#08110b;border-color:rgba(213,177,90,.42)}
    .member-confirm-cancel{background:rgba(255,255,255,.05);color:#fff}
  `;
  document.head.appendChild(style);
  const overlay=document.createElement("div");
  overlay.id="memberConfirmOverlay";
  overlay.className="member-confirm-overlay";
  overlay.innerHTML=`<div class="member-confirm-box" role="dialog" aria-modal="true">
    <div class="member-confirm-head"><div class="member-confirm-icon" id="memberConfirmIcon">⭐</div><div><h3 class="member-confirm-title" id="memberConfirmTitle">تأكيد الإجراء</h3><p class="member-confirm-text" id="memberConfirmText">هل تريد المتابعة؟</p></div></div>
    <div class="member-confirm-actions"><button type="button" class="member-confirm-btn member-confirm-ok" id="memberConfirmOk">تأكيد</button><button type="button" class="member-confirm-btn member-confirm-cancel" id="memberConfirmCancel">إلغاء</button></div>
  </div>`;
  document.body.appendChild(overlay);
}
function smartConfirm({title="تأكيد الإجراء",message="هل تريد المتابعة؟",icon="⭐",okText="تأكيد"}={}){
  ensureSmartConfirm();
  return new Promise(resolve=>{
    const overlay=document.getElementById("memberConfirmOverlay");
    const ok=document.getElementById("memberConfirmOk");
    const cancel=document.getElementById("memberConfirmCancel");
    document.getElementById("memberConfirmTitle").textContent=title;
    document.getElementById("memberConfirmText").textContent=message;
    document.getElementById("memberConfirmIcon").textContent=icon;
    ok.textContent=okText;
    const onEsc=e=>{if(e.key==="Escape") cleanup(false)};
    const cleanup=value=>{overlay.classList.remove("show");ok.onclick=null;cancel.onclick=null;overlay.onclick=null;document.removeEventListener("keydown",onEsc);resolve(value)};
    ok.onclick=()=>cleanup(true);
    cancel.onclick=()=>cleanup(false);
    overlay.onclick=e=>{if(e.target===overlay) cleanup(false)};
    document.addEventListener("keydown",onEsc);
    overlay.classList.add("show");
  });
}

async function loadMembers(){
  const tbody=$("membersTableBody");
  if(tbody) tbody.innerHTML=`<tr><td colspan="8" class="empty-cell">جاري تحميل العضويات...</td></tr>`;
  const {data,error}=await supabaseClient.from("academy_members").select("*").order("created_at",{ascending:false});
  if(error){
    console.error(error);
    members=[];
    if(tbody) tbody.innerHTML=`<tr><td colspan="8" class="empty-cell error-cell">تعذر تحميل عضويات الأكاديمية. تحقق من الاتصال أو تواصل مع مسؤول النظام.</td></tr>`;
    showToast("تعذر تحميل العضويات حالياً.","error");
    renderStats();
    return;
  }
  members=Array.isArray(data)?data:[];
  renderStats();
  renderTable();
}

function renderStats(){
  $("statAll").textContent=members.length;
  $("statPending").textContent=members.filter(m=>String(m.status||"pending")==="pending").length;
  $("statApproved").textContent=members.filter(m=>String(m.status||"")==="approved").length;
  $("statRejected").textContent=members.filter(m=>["rejected","suspended"].includes(String(m.status||""))).length;
}

function filtered(){
  const search=($("searchInput")?.value||"").trim().toLowerCase();
  const status=$("statusFilter")?.value||"all";
  const sort=$("sortFilter")?.value||"newest";
  let data=[...members];
  data=data.filter(m=>{
    const blob=[memberCode(m),m.full_name,m.phone,m.email,m.city,interestsText(m.interests),m.notes].join(" ").toLowerCase();
    const okSearch=!search||blob.includes(search);
    const okStatus=status==="all" || String(m.status||"pending")===status;
    return okSearch && okStatus;
  });
  data.sort((a,b)=>{
    const da=new Date(a.created_at||0).getTime();
    const db=new Date(b.created_at||0).getTime();
    return sort==="oldest"?da-db:db-da;
  });
  return data;
}

function renderTable(){
  const tbody=$("membersTableBody");
  if(!tbody)return;
  const rows=filtered().map(m=>`<tr>
    <td><span class="tag tag-ref">${escapeHtml(memberCode(m))}</span></td>
    <td><b class="request-title">${escapeHtml(m.full_name||"عضو بدون اسم")}</b><span class="subtext">${escapeHtml(m.phone||"-")} • ${escapeHtml(m.city||"-")}</span></td>
    <td>${escapeHtml(m.email||"-")}</td>
    <td>${escapeHtml(shortText(interestsText(m.interests),55))}</td>
    <td><span class="tag ${statusClass(m.status)}">${escapeHtml(statusLabel(m.status))}</span></td>
    <td><div>${escapeHtml(formatDate(m.created_at))}</div><span class="subtext">${escapeHtml(formatTime(m.created_at))}</span></td>
    <td><div class="row-actions">
      <button class="mini-btn review" onclick="openMember('${m.id}')">عرض</button>
      ${String(m.status||"pending")==="approved"?"":`<button class="mini-btn accept" onclick="updateMemberStatus('${m.id}','approved')">قبول</button>`}
      ${String(m.status||"pending")==="rejected"?"":`<button class="mini-btn reject" onclick="updateMemberStatus('${m.id}','rejected')">رفض</button>`}
      ${String(m.status||"pending")==="suspended"?"":`<button class="mini-btn more" onclick="updateMemberStatus('${m.id}','suspended')">إيقاف</button>`}
    </div></td>
  </tr>`).join("");
  tbody.innerHTML=rows||`<tr><td colspan="7" class="empty-cell">لا توجد عضويات مطابقة حاليًا.</td></tr>`;
}

function findMember(id){ return members.find(m=>String(m.id)===String(id)); }

function openMember(id){
  const m=findMember(id);
  if(!m)return;
  currentMemberId=id;
  $("d_name").textContent=m.full_name||"-";
  $("d_code").textContent=memberCode(m);
  $("d_status").textContent=statusLabel(m.status);
  $("d_phone").textContent=m.phone||"-";
  $("d_email").textContent=m.email||"-";
  $("d_city").textContent=m.city||"-";
  $("d_verified").textContent=m.email_verified?"نعم":"لا";
  $("d_date").textContent=`${formatDate(m.created_at)} ${formatTime(m.created_at)}`;
  $("d_interests").innerHTML=Array.isArray(m.interests)&&m.interests.length
    ? m.interests.map((x) => `<span class="tag tag-ref">${escapeHtml((window.ACADEMY_MEMBER_PROFILE?.interestLabel?.(x)) || interestLabelsMap()[x] || x)}</span>`).join(" ")
    : `<span class="subtext">لا توجد اهتمامات محددة.</span>`;
  $("d_notes").textContent=m.notes||"-";
  $("memberModal").classList.add("show");
  document.body.style.overflow="hidden";
}

function closeMember(){
  currentMemberId=null;
  $("memberModal")?.classList.remove("show");
  document.body.style.overflow="";
}

async function updateMemberStatus(id,status){
  const m=findMember(id);
  if(!m)return;
  const ok=await smartConfirm({
    title:"تأكيد تحديث العضوية",
    message:`سيتم تحديث حالة العضوية إلى: ${statusLabel(status)}. هل تريد المتابعة؟`,
    icon: status==="approved" ? "✅" : (status==="rejected" ? "⛔" : "⏸️"),
    okText: status==="approved" ? "نعم، قبول العضوية" : "تأكيد"
  });
  if(!ok)return;
  try{
    const payload={status,updated_at:new Date().toISOString()};
    if(status==="approved") payload.approved_at=new Date().toISOString();
    const {data,error}=await supabaseClient.from("academy_members").update(payload).eq("id",id).select("*").single();
    if(error)throw error;
    const idx=members.findIndex(x=>String(x.id)===String(id));
    if(idx>-1) members[idx]=data;
    renderStats();
    renderTable();
    if(currentMemberId===id) openMember(id);
    showToast("تم تحديث حالة العضوية بنجاح.", status==="rejected"?"error":"success");
  }catch(e){
    console.error(e);
    showToast("تعذر تحديث حالة العضوية.","error");
  }
}

function buildMemberExportRows(){
  const data=filtered();
  const rows=[["رمز العضوية","الاسم","الجوال","البريد","المدينة","الاهتمامات","الحالة","التاريخ","ملاحظات"]];
  data.forEach(m=>rows.push([memberCode(m),m.full_name||"",m.phone||"",m.email||"",m.city||"",interestsText(m.interests),statusLabel(m.status),`${formatDate(m.created_at)} ${formatTime(m.created_at)}`,m.notes||""]));
  return { data, rows };
}
function exportPdf(){
  const { data, rows }=buildMemberExportRows();
  if(!data.length){ showToast("لا توجد بيانات للتصدير.","warn"); return; }
  const AE=window.AdminExport;
  if(!AE){ showToast("وحدة التصدير غير متوفرة.","error"); return; }
  const stamp=AE.exportDateStamp();
  const pdf=AE.openPdfPrint({
    title:"عضويات الأكاديمية",
    fileBase:`academy_members_${stamp}`,
    headers:rows[0],
    bodyRows:rows.slice(1),
    mainColCount:6,
    stampLabel:"ختم عضويات الأكاديمية"
  });
  if(!pdf.ok){ showToast("تعذر فتح نافذة الطباعة.","warn"); return; }
  showToast(`تم تجهيز ملف الطباعة (${data.length} عضوية).`,"success");
}
function exportExcel(){
  const { data, rows }=buildMemberExportRows();
  if(!data.length){ showToast("لا توجد بيانات للتصدير.","warn"); return; }
  const AE=window.AdminExport;
  const stamp=AE?AE.exportDateStamp():String(Date.now());
  if(AE && AE.downloadExcel(`academy_members_${stamp}.xlsx`, rows, [{wch:14},{wch:22},{wch:14},{wch:24},{wch:12},{wch:20},{wch:12},{wch:18},{wch:24}])){
    showToast(`تم تصدير ${data.length} عضوية إلى جدول.`,"success");
    return;
  }
  showToast("مكتبة الجداول غير متاحة.","error");
}

document.addEventListener("DOMContentLoaded",()=>{
  ["searchInput","statusFilter","sortFilter"].forEach(id=>$(id)?.addEventListener(id==="searchInput"?"input":"change",renderTable));
  $("exportPdfBtn")?.addEventListener("click",exportPdf);
  $("exportExcelBtn")?.addEventListener("click",exportExcel);
  $("exportBtn")?.addEventListener("click",exportPdf);
  $("closeModal")?.addEventListener("click",closeMember);
  $("closeModal2")?.addEventListener("click",closeMember);
  $("modalApproveBtn")?.addEventListener("click",()=>currentMemberId&&updateMemberStatus(currentMemberId,"approved"));
  $("modalRejectBtn")?.addEventListener("click",()=>currentMemberId&&updateMemberStatus(currentMemberId,"rejected"));
  $("modalSuspendBtn")?.addEventListener("click",()=>currentMemberId&&updateMemberStatus(currentMemberId,"suspended"));
  $("memberModal")?.addEventListener("click",e=>{if(e.target===$("memberModal"))closeMember()});
  document.addEventListener("keydown",e=>{if(e.key==="Escape")closeMember()});
  loadMembers();
});
