const supabaseClient = createSupabaseClient();

const TYPE_LABELS = { player:'لاعب', guardian:'ولي أمر', staff:'كادر', coach:'مدرب', supporter:'داعم', academy_member:'عضو أكاديمي' };
const STATUS_LABELS = { new:'جديد', review:'جاهز للمراجعة', reviewing:'جاهز للمراجعة', approved:'مقبول', rejected:'مرفوض', pending:'بانتظار استكمال', needs_completion:'بانتظار استكمال' };
const TYPE_CONFIG = {
  player:{title:'طلبات اللاعبين',desc:'مراجعة طلبات انضمام اللاعبين وتحويل المقبول مباشرة إلى قائمة اللاعبين.',icon:'👤',href:'players_requests.html',cols:['الفئة','المركز','العمر'],fields:r=>[r.age_category||'-',r.position||'-',r.player_age||'-']},
  guardian:{title:'طلبات أولياء الأمور',desc:'تسجيل ولي أمر، إنشاء لاعب جديد، أو ربط ولي الأمر بلاعب موجود.',icon:'👨‍👦',href:'guardians_requests.html',cols:['الغرض','صلة القرابة','اللاعب / الأبناء'],fields:r=>{const mode=guardianMode(r);const linkNames=window.GUARDIAN_GOALS?.linkedPlayerNames?window.GUARDIAN_GOALS.linkedPlayerNames(r):'';return [goalLabel(r.guardian_goal),r.relationship||'-',mode==='existing_player'?(r.children_count?`${r.children_count} — ${linkNames||'-'}`:linkNames||'-'):mode==='new_player'?(r.child_name||'-'):(r.children_count||'-')];}},
  staff:{title:'طلبات الكوادر',desc:'رياضي، طبي، إداري، تشغيلي، إعلامي وتقني — مراجعة واعتماد الكوادر.',icon:'👥',href:'staff_requests.html',cols:['المجال','الدور','الخبرة'],fields:r=>staffRequestFields(r)},
  coach:{title:'طلبات المدربين (قديم)',desc:'طلبات مدربين قبل توحيد تبويب الكادر.',icon:'🧑‍🏫',href:'coaches_requests.html',cols:['المسمى','التخصص','الخبرة'],fields:r=>[r.coach_job_title||r.coach_specialty||'-',r.coach_specialty||'-',r.coach_experience||r.coach_experience_years?`${r.coach_experience||r.coach_experience_years} سنوات`:'-']},
  supporter:{title:'طلبات الداعمين',desc:'متابعة الجهات والأفراد الراغبين بالدعم والرعاية والشراكات.',icon:'💰',href:'supporters_requests.html',cols:['نوع الداعم','المستوى','طريقة الدعم'],fields:r=>{const m=supporterMeta(r);return [m.typeLabel,m.levelLabel,m.methodLabel];}},
  academy_member:{title:'طلبات عضوية الأكاديمية',desc:'متابعة الأخبار والفعاليات والعروض — بدون مرفقات. بعد القبول تُدار العضويات من لوحة الأعضاء.',icon:'⭐',href:'academy_members_requests.html',cols:['البريد','الاهتمامات','المدينة'],fields:r=>{const m=memberMeta(r);return [r.email||'-',shortText(m.interestsLabel,36),r.city||'-'];}}
};
let requests = [];
let academyMembers = [];
let currentRequestId = null;
let currentCompletion = null;
function reviewContext(){
  const req=findReq(currentRequestId);
  return req || currentCompletion || null;
}
/** لا تُسمّى getReviewFilesByType — الاسم على window يُستبدل ويسبب تكراراً لا نهائياً */
function resolveAdminReviewFiles(type, ctx){
  const cat=window.JOIN_ATTACHMENT_CATALOG;
  if(cat&&typeof cat.getReviewFilesByType==='function'){
    const files=cat.getReviewFilesByType(type,ctx);
    return Array.isArray(files)?files:[];
  }
  const fn=window.__reviewFilesResolver;
  if(typeof fn==='function'){
    const files=fn(type,ctx);
    return Array.isArray(files)?files:[];
  }
  return [];
}
function getCurrentReviewFiles(){
  const ctx=reviewContext();
  const type=ctx?.request_type||currentCompletion?.request_type;
  return resolveAdminReviewFiles(type,ctx);
}
function approvalRequiresAttachments(r){
  if(!r)return false;
  const cat=window.JOIN_ATTACHMENT_CATALOG;
  if(cat&&typeof cat.requiresAttachments==='function')return cat.requiresAttachments(r);
  return ['player','guardian','staff','coach','supporter'].includes(String(r.request_type||'').toLowerCase());
}
function normalizeStatusFilterValue(val){
  const v=String(val||'').trim();
  if(!v||v==='active'||v==='الطلبات النشطة')return 'active';
  if(v==='all'||v==='كل الحالات')return 'all';
  const map={جديد:'new','جاهز للمراجعة':'review',مقبول:'approved',مرفوض:'rejected','بانتظار استكمال':'pending'};
  return map[v]||v;
}
function normalizeTypeFilterValue(val){
  const v=String(val||'').trim();
  if(!v||v==='كل أنواع الطلبات')return '';
  const map={لاعب:'player','ولي أمر':'guardian',مدرب:'coach',داعم:'supporter',كادر:'staff','عضو أكاديمية':'academy_member'};
  return map[v]||v;
}
const FILE_STATUS_LABELS = {pending:'قيد المراجعة', approved:'مقبول', rejected:'مرفوض', reupload:'مطلوب إعادة رفع'};

function $(id){return document.getElementById(id)}
function escapeHtml(value){return String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;')}
function shortText(v,n=70){const s=String(v||'');return s.length>n?s.slice(0,n)+'…':s}
function getTypeLabel(type){return TYPE_LABELS[type]||type||'-'}
function getStatusLabel(status){return STATUS_LABELS[status]||status||'جديد'}
function goalLabel(v){return window.GUARDIAN_GOALS?.goalLabel?window.GUARDIAN_GOALS.goalLabel(v):v||'-'}
function parseInterestsLine(notes){
  const m=String(notes||'').match(/الاهتمامات:\s*([^\n]+)/);
  return m?m[1].trim():'';
}
function parseInterestsArray(notes){
  const AMP=window.ACADEMY_MEMBER_PROFILE;
  if(AMP&&AMP.parseInterestIdsFromNotes) return AMP.parseInterestIdsFromNotes(notes);
  const line=parseInterestsLine(notes);
  if(!line) return [];
  return line.split(/[،,]/).map(s=>s.trim()).filter(Boolean);
}
function memberMeta(r){
  const AMP=window.ACADEMY_MEMBER_PROFILE;
  if(AMP&&AMP.parseFromRequest) return AMP.parseFromRequest(r);
  const ids=parseInterestsArray(r.notes||r.guardian_notes||'');
  const labelFn=(id)=>{const AMP2=window.ACADEMY_MEMBER_PROFILE;return AMP2&&AMP2.interestLabel?AMP2.interestLabel(id):id;};
  return {interestIds:ids,interestsLabel:ids.map(labelFn).filter(Boolean).join('، ')||'-'};
}
function showCompletionAction(r){
  if(!r||!approvalRequiresAttachments(r)) return false;
  const label=getStatusLabel(r.status||'new');
  if(label==='مقبول'||label==='مرفوض') return false;
  return true;
}
function getTableDetailCell(r){
  if(r.request_type==='academy_member'){
    const m=memberMeta(r);
    return shortText(m.interestsLabel,48);
  }
  const parts=[];
  if(r.phone) parts.push(r.phone);
  if(r.email) parts.push(r.email);
  return parts.length?parts.join(' • '):shortText(displayNotes(r),40);
}
function displayNotes(r){
  const raw=notes(r);
  if(r.request_type!=='academy_member') return raw;
  const m=memberMeta(r);
  const lines=String(raw||'').split('\n').filter(line=>{
    const t=line.trim();
    if(!t) return false;
    if(/^الاهتمامات:/.test(t)) return false;
    if(/^معرّ?فات:/.test(t)) return false;
    return true;
  });
  if(m.interestsLabel&&m.interestsLabel!=='-') lines.unshift(`الاهتمامات: ${m.interestsLabel}`);
  return lines.join('\n')||'-';
}
function buildRowActions(r){
  const id=r.id;
  let html=`<button class="mini-btn review" onclick="openRequest('${id}')">عرض</button><button class="mini-btn chat" type="button" onclick="openChatForRequest('${id}')">تواصل</button>`;
  if(getStatusLabel(r.status)!=='مقبول') html+=`<button class="mini-btn accept" onclick="updateStatus('${id}','approved')">قبول</button>`;
  if(getStatusLabel(r.status)!=='مرفوض') html+=`<button class="mini-btn reject" onclick="updateStatus('${id}','rejected')">رفض</button>`;
  if(showCompletionAction(r)) html+=`<button class="mini-btn more" onclick="updateStatus('${id}','pending')">استكمال</button>`;
  return html;
}
function syncModalActions(r){
  const btn=$('modalCompleteBtn');
  if(btn) btn.style.display=showCompletionAction(r)?'':'none';
}
function staffMeta(r){
  const AR=window.ACADEMY_ROLES;
  if(AR&&AR.parseStaffFromRequest) return AR.parseStaffFromRequest(r);
  return {domain:r.volunteer_field||'',roleId:'',roleLabel:r.coach_specialty||'-'};
}
function supporterMeta(r){
  const SP=window.SUPPORTER_PROFILE;
  if(SP&&SP.parseFromRequest) return SP.parseFromRequest(r);
  return {typeId:r.support_type||'',levelId:r.support_level||'',methodId:r.support_method||'',typeLabel:r.support_type||'-',levelLabel:r.support_level||'-',methodLabel:r.support_method||'-'};
}
function supportTypeLabel(id){return window.SUPPORTER_PROFILE?.typeLabel?window.SUPPORTER_PROFILE.typeLabel(id):id||'-';}
function staffRequestFields(r){
  const m=staffMeta(r);
  const domain=AR_DOMAIN_LABEL(m.domain);
  return [domain,m.roleLabel||'-',r.coach_experience?`${r.coach_experience} سنوات`:'-'];
}
function AR_DOMAIN_LABEL(id){
  const AR=window.ACADEMY_ROLES;
  if(AR&&AR.getDomainLabel) return AR.getDomainLabel(id);
  return id||'-';
}
function statusClass(status){const l=getStatusLabel(status);if(l==='جديد')return 'status-new';if(l==='جاهز للمراجعة')return 'status-review';if(l==='مقبول')return 'status-approved';if(l==='مرفوض')return 'status-rejected';return 'status-pending'}
function formatDate(value){if(!value)return '-';const d=new Date(value);if(Number.isNaN(d.getTime()))return String(value);return d.toLocaleDateString('ar-SA',{year:'numeric',month:'2-digit',day:'2-digit'})}
function formatTime(value){if(!value)return '';const d=new Date(value);if(Number.isNaN(d.getTime()))return '';return d.toLocaleTimeString('ar-SA',{hour:'2-digit',minute:'2-digit'})}
function refCode(r){if(r.reference_code)return r.reference_code;const shortId=String(r.id||'').replace(/-/g,'').slice(0,6).toUpperCase()||'000000';return `REQ-${shortId}`}
function notes(r){return r.player_notes||r.guardian_notes||r.coach_notes||r.coach_bio||r.support_notes||r.volunteer_notes||r.notes||'-'}
function showToast(message,type='success'){const wrap=$('toastWrap');if(!wrap)return;const t=document.createElement('div');t.className='toast '+type;t.textContent=message;wrap.appendChild(t);setTimeout(()=>{t.style.opacity='0';t.style.transform='translateY(8px)';t.style.transition='.2s ease';setTimeout(()=>t.remove(),220)},3000)}
function isActive(r){return ['new','review','reviewing','pending','needs_completion'].includes(String(r.status||'new'))}

function ensureConfirmDialog(){
  if(document.getElementById('smartConfirmOverlay')) return;
  const style=document.createElement('style');
  style.id='smart-confirm-style';
  style.textContent=`
    .smart-confirm-overlay{position:fixed;inset:0;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(0,0,0,.68);backdrop-filter:blur(10px);z-index:12000}
    .smart-confirm-overlay.show{display:flex}
    .smart-confirm-box{width:min(520px,100%);border:1px solid rgba(213,177,90,.22);border-radius:26px;background:linear-gradient(180deg,#102217,#07130d);box-shadow:0 28px 90px rgba(0,0,0,.48);overflow:hidden;color:#f3f4ef;font-family:'Cairo',system-ui,sans-serif}
    .smart-confirm-head{padding:22px 22px 12px;display:flex;gap:14px;align-items:flex-start}
    .smart-confirm-icon{width:54px;height:54px;min-width:54px;border-radius:18px;display:grid;place-items:center;background:rgba(213,177,90,.12);border:1px solid rgba(213,177,90,.24);font-size:26px}
    .smart-confirm-title{margin:0;font-size:22px;font-weight:900;color:#f0d58f}
    .smart-confirm-text{margin:8px 0 0;color:#b6c1b8;line-height:1.9;font-size:14px}
    .smart-confirm-actions{display:flex;gap:10px;justify-content:flex-start;padding:14px 22px 22px;flex-wrap:wrap}
    .smart-confirm-btn{min-height:48px;padding:0 18px;border-radius:15px;border:1px solid rgba(255,255,255,.10);font-weight:900;cursor:pointer;font-family:inherit}
    .smart-confirm-ok{background:linear-gradient(180deg,#e4c36f,#d5b15a);color:#08110b;border-color:rgba(213,177,90,.42)}
    .smart-confirm-cancel{background:rgba(255,255,255,.05);color:#fff}
  `;
  document.head.appendChild(style);
  const overlay=document.createElement('div');
  overlay.id='smartConfirmOverlay';
  overlay.className='smart-confirm-overlay';
  overlay.innerHTML=`<div class="smart-confirm-box" role="dialog" aria-modal="true">
    <div class="smart-confirm-head"><div class="smart-confirm-icon" id="smartConfirmIcon">⚠️</div><div><h3 class="smart-confirm-title" id="smartConfirmTitle">تأكيد الإجراء</h3><p class="smart-confirm-text" id="smartConfirmText">هل تريد المتابعة؟</p></div></div>
    <div class="smart-confirm-actions"><button type="button" class="smart-confirm-btn smart-confirm-ok" id="smartConfirmOk">تأكيد</button><button type="button" class="smart-confirm-btn smart-confirm-cancel" id="smartConfirmCancel">إلغاء</button></div>
  </div>`;
  document.body.appendChild(overlay);
}
function requestConfirmation({title='تأكيد الإجراء', message='هل تريد المتابعة؟', icon='⚠️', okText='تأكيد'}={}){
  ensureConfirmDialog();
  return new Promise(resolve=>{
    const overlay=document.getElementById('smartConfirmOverlay');
    const ok=document.getElementById('smartConfirmOk');
    const cancel=document.getElementById('smartConfirmCancel');
    document.getElementById('smartConfirmTitle').textContent=title;
    document.getElementById('smartConfirmText').textContent=message;
    document.getElementById('smartConfirmIcon').textContent=icon;
    ok.textContent=okText;
    const cleanup=(val)=>{overlay.classList.remove('show');ok.onclick=null;cancel.onclick=null;overlay.onclick=null;document.removeEventListener('keydown',esc);resolve(val)};
    const esc=(e)=>{if(e.key==='Escape')cleanup(false)};
    ok.onclick=()=>cleanup(true);
    cancel.onclick=()=>cleanup(false);
    overlay.onclick=(e)=>{if(e.target===overlay)cleanup(false)};
    document.addEventListener('keydown',esc);
    overlay.classList.add('show');
  });
}



async function loadAcademyMembers(){
  const {data,error}=await supabaseClient.from('academy_members').select('*').order('created_at',{ascending:false});
  if(error){
    console.error(error);
    academyMembers=[];
    showToast('تعذر تحميل عضويات الأكاديمية.','error');
    return;
  }
  academyMembers=Array.isArray(data)?data:[];
}

async function loadRequests(type=null){
  const tbody=$('requestsTableBody'); if(tbody) tbody.innerHTML=`<tr><td colspan="8" class="empty-cell">جاري تحميل الطلبات...</td></tr>`;
  let q=supabaseClient.from('join_requests').select('*').order('created_at',{ascending:false});
  if(type) q=q.eq('request_type',type);
  const {data,error}=await q;
  if(error){
    console.error(error);
    requests=[];
    if($('requestsCards')) renderDashboard();
    if(tbody) tbody.innerHTML=`<tr><td colspan="8" class="empty-cell error-cell">تعذر تحميل الطلبات.</td></tr>`;
    showToast('تعذر تحميل الطلبات حالياً، لكن بطاقات التنقل ظاهرة ويمكن فتح الصفحات.','error');
    return;
  }
  requests=(Array.isArray(data)?data:[]).filter((r)=>String(r.request_type||"")!=="volunteer");
  if($('requestsCards')) await loadAcademyMembers();
  if($('requestsTableBody')) renderTable(type);
  if($('requestsCards')) renderDashboard();
}
function countsFor(type){const arr=requests.filter(r=>!type||r.request_type===type);return {all:arr.length,new:arr.filter(r=>getStatusLabel(r.status||'new')==='جديد').length,review:arr.filter(r=>getStatusLabel(r.status)==='جاهز للمراجعة').length,approved:arr.filter(r=>getStatusLabel(r.status)==='مقبول').length,pending:arr.filter(r=>getStatusLabel(r.status)==='بانتظار استكمال').length,active:arr.filter(isActive).length}}
function renderDashboard(){
  const cards=$('requestsCards'); if(!cards)return;
  const total=countsFor(null); const grandTotal={all:total.all,new:total.new,review:total.review,approved:total.approved};
  $('totalAll').textContent=grandTotal.all; $('totalNew').textContent=grandTotal.new; $('totalReview').textContent=grandTotal.review; $('totalApproved').textContent=grandTotal.approved;
  cards.innerHTML=Object.entries(TYPE_CONFIG).map(([type,cfg])=>{const c=countsFor(type);return `<a class="request-card" href="${cfg.href}"><div class="card-icon">${cfg.icon}</div><div class="card-main"><h3>${cfg.title}</h3><p>${cfg.desc}</p><div class="mini-stats"><span>الإجمالي <b>${c.all}</b></span><span>الجديد <b>${c.new}</b></span><span>نشطة <b>${c.active}</b></span></div></div><div class="open-arrow">←</div></a>`}).join('')+`<a class="request-card all-card" href="admin_requests.html"><div class="card-icon">📋</div><div class="card-main"><h3>كل الطلبات</h3><p>عرض متقدم لكل الأنواع عند الحاجة للبحث العام والتصدير الشامل.</p><div class="mini-stats"><span>الإجمالي <b>${grandTotal.all}</b></span><span>المقبولة <b>${grandTotal.approved}</b></span></div></div><div class="open-arrow">←</div></a>`;
}
function filtered(){
  const search=($('searchInput')?.value||'').trim().toLowerCase();
  const status=normalizeStatusFilterValue($('statusFilter')?.value||(window.REQUEST_TYPE?'all':'active'));
  const sortRaw=$('sortFilter')?.value||'newest';
  const sort=sortRaw==='الأقدم أولاً'||sortRaw==='oldest'?'oldest':'newest';
  const typeWant=normalizeTypeFilterValue($('typeFilter')?.value||'');
  const dateFilter=$('dateFilter')?.value||'الكل';
  const now=new Date();
  const goalFilter=$('guardianGoalFilter')?.value||'';
  const staffDomainFilter=$('staffDomainFilter')?.value||'';
  const supporterTypeFilter=$('supporterTypeFilter')?.value||'';
  const supporterMethodFilter=$('supporterMethodFilter')?.value||'';
  const memberInterestFilter=$('memberInterestFilter')?.value||'';
  let data=[...requests];
  data=data.filter(r=>{
    const blob=[refCode(r),r.full_name,r.phone,r.email,r.city,notes(r),JSON.stringify(r)].join(' ').toLowerCase();
    const s=!search||blob.includes(search);
    const st=status==='active'?isActive(r):(status==='all'||String(r.status||'new')===status);
    const matchesType=!typeWant||String(r.request_type||'')===typeWant;
    let matchesDate=true;
    if(dateFilter!=='الكل'&&r.created_at){
      const created=new Date(r.created_at);
      if(dateFilter==='اليوم')matchesDate=created.toDateString()===now.toDateString();
      else if(dateFilter==='آخر 7 أيام')matchesDate=(now-created)<=7*24*60*60*1000;
      else if(dateFilter==='هذا الشهر')matchesDate=created.getFullYear()===now.getFullYear()&&created.getMonth()===now.getMonth();
    }
    const g=!goalFilter||String(r.guardian_goal||'')===goalFilter;
    const staffDomain=!staffDomainFilter||staffMeta(r).domain===staffDomainFilter;
    const sm=supporterMeta(r);
    const supType=!supporterTypeFilter||sm.typeId===supporterTypeFilter;
    const supMethod=!supporterMethodFilter||sm.methodId===supporterMethodFilter;
    const mm=memberMeta(r);
    const memInt=!memberInterestFilter||mm.interestIds.includes(memberInterestFilter);
    return s&&st&&matchesType&&matchesDate&&g&&staffDomain&&supType&&supMethod&&memInt;
  });
  data.sort((a,b)=>{const da=new Date(a.created_at||0).getTime();const db=new Date(b.created_at||0).getTime();return sort==='oldest'?da-db:db-da}); return data;
}
function renderTable(type){
  const tbody=$('requestsTableBody'); const cfg=TYPE_CONFIG[type]||null; if(!tbody)return;
  if(cfg){$('pageTitle').textContent=cfg.title; $('pageDesc').textContent=cfg.desc; $('typeIcon').textContent=cfg.icon; const heads=$('typeColumns'); if(heads) heads.innerHTML=cfg.cols.map(c=>`<th>${c}</th>`).join('');}
  const c=countsFor(type); if($('statAll')){$('statAll').textContent=c.all;$('statNew').textContent=c.new;$('statReview').textContent=c.review;$('statApproved').textContent=c.approved;}
  const colLabels=cfg?['','',...cfg.cols,'الحالة','تاريخ الإرسال','الإجراءات']:['','النوع','الحالة','بيانات التواصل','تاريخ الإرسال','الإجراءات'];
  const rows=filtered().map(r=>{
    const actionHtml=buildRowActions(r);
    if(!cfg){
      return `<tr><td data-label="رقم المرجع"><span class="tag tag-ref">${escapeHtml(refCode(r))}</span></td><td data-label="الطلب"><b class="request-title">${escapeHtml(r.full_name||'طلب بدون اسم')}</b><span class="subtext">${escapeHtml(r.phone||'-')} • ${escapeHtml(r.city||'-')}</span></td><td data-label="النوع">${escapeHtml(getTypeLabel(r.request_type))}</td><td data-label="الحالة"><span class="tag ${statusClass(r.status||'new')}">${escapeHtml(getStatusLabel(r.status||'new'))}</span></td><td data-label="بيانات التواصل">${escapeHtml(getTableDetailCell(r))}</td><td data-label="تاريخ الإرسال"><div>${escapeHtml(formatDate(r.created_at))}</div><span class="subtext">${escapeHtml(formatTime(r.created_at))}</span></td><td data-label="الإجراءات"><div class="row-actions">${actionHtml}</div></td></tr>`;
    }
    const vals=cfg.fields(r);
    const cells=[`<td data-label="رقم المرجع"><span class="tag tag-ref">${escapeHtml(refCode(r))}</span></td>`,`<td data-label="صاحب الطلب"><b class="request-title">${escapeHtml(r.full_name||'طلب بدون اسم')}</b><span class="subtext">${escapeHtml(r.phone||'-')} • ${escapeHtml(r.city||'-')}</span></td>`,...vals.map((v,i)=>`<td data-label="${escapeHtml(colLabels[i+2]||'تفصيل')}">${escapeHtml(v)}</td>`),`<td data-label="الحالة"><span class="tag ${statusClass(r.status||'new')}">${escapeHtml(getStatusLabel(r.status||'new'))}</span></td>`,`<td data-label="تاريخ الإرسال"><div>${escapeHtml(formatDate(r.created_at))}</div><span class="subtext">${escapeHtml(formatTime(r.created_at))}</span></td>`,`<td data-label="الإجراءات"><div class="row-actions">${actionHtml}</div></td>`];
    return `<tr>${cells.join('')}</tr>`;
  }).join('');
  const colspan=cfg?cfg.cols.length+5:7; tbody.innerHTML=rows||`<tr><td colspan="${colspan}" class="empty-cell">لا توجد طلبات مطابقة حاليًا.</td></tr>`;
}
function getRequestSummary(r){if(r.request_type==='player')return r.position||r.age_category||'-'; if(r.request_type==='guardian')return goalLabel(r.guardian_goal); if(r.request_type==='staff'){const m=staffMeta(r);return m.roleLabel||'-'} if(r.request_type==='academy_member'){const m=memberMeta(r);return m.hasLegacyGoal?(m.legacyGoalLabel||'طلب قديم'):shortText(m.interestsLabel,32);} if(r.request_type==='coach')return r.coach_specialty||r.coach_job_title||'-'; if(r.request_type==='supporter'){const m=supporterMeta(r);return m.methodLabel||'-'} return '-'}
function findReq(id){return requests.find(r=>String(r.id)===String(id))}

function ensureChatUi(){
  if(!document.getElementById('chat-mini-style')){
    const st=document.createElement('style');
    st.id='chat-mini-style';
    st.textContent=`.mini-btn.chat,.btn.chat{color:#c8e4ff;border-color:rgba(106,200,255,.35)}`;
    document.head.appendChild(st);
  }
  const actions=document.querySelector('#requestModal .modal-actions');
  if(actions&&!document.getElementById('modalChatBtn')){
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='btn chat';
    btn.id='modalChatBtn';
    btn.textContent='تواصل';
    btn.addEventListener('click',()=>{if(currentRequestId)openChatForRequest(currentRequestId)});
    actions.insertBefore(btn,actions.firstChild);
  }
}
function ensureChatDrawerScript(){
  if(window.ChatDrawer)return Promise.resolve();
  return new Promise((resolve,reject)=>{
    if(document.querySelector('script[data-chat-drawer]')){document.querySelector('script[data-chat-drawer]').addEventListener('load',()=>resolve());return;}
    const s=document.createElement('script');
    s.src='js/chat-drawer.js';
    s.dataset.chatDrawer='1';
    s.onload=()=>resolve();
    s.onerror=()=>reject(new Error('chat-drawer load failed'));
    document.body.appendChild(s);
  });
}
async function openChatForRequest(id){
  const r=findReq(id);
  if(!r){showToast('الطلب غير موجود.','warn');return;}
  try{
    await ensureChatDrawerScript();
    if(!window.ChatDrawer){showToast('وحدة التواصل غير متوفرة.','error');return;}
    await ChatDrawer.openForJoinRequest({
      joinRequestId:r.id,
      referenceCode:refCode(r),
      phone:r.phone||'',
      fullName:r.full_name||''
    });
  }catch(e){
    console.error(e);
    showToast('تعذر فتح المحادثة.','error');
  }
}
window.openChatForRequest=openChatForRequest;

function getFileStatusLabel(status){return FILE_STATUS_LABELS[String(status||'pending')]||status||'قيد المراجعة'}
function fileStatusClass(status){const s=String(status||'pending'); if(s==='approved')return 'status-approved'; if(s==='rejected')return 'status-rejected'; if(s==='reupload')return 'status-pending'; return 'status-review'}
function safeUrl(url){const v=String(url||'').trim(); if(!v)return ''; if(/^https?:\/\//i.test(v) || v.startsWith('./') || v.startsWith('../') || v.startsWith('/')) return v; return v;}
function isImageUrl(url){return /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i.test(String(url||''))}
function isPdfUrl(url){return /\.pdf(\?.*)?$/i.test(String(url||''))}
function completionIsFullyApproved(completion){
  if(!completion) return false;
  const ctx=reviewContext();
  if(typeof window.completionIsFullyApproved==='function'){
    return window.completionIsFullyApproved(completion, ctx?.request_type || completion.request_type, ctx);
  }
  const files=getCurrentReviewFiles();
  return files.filter(f=>f.required).every(f=>String(completion[f.status]||'pending')==='approved' && String(completion[f.url]||'').trim());
}
function reviewMissingItems(completion){
  if(!completion) return ['لم يتم استكمال المرفقات لهذا الطلب حتى الآن.'];
  const ctx=reviewContext();
  if(typeof window.reviewMissingItems==='function'){
    return window.reviewMissingItems(completion, ctx?.request_type || completion.request_type, ctx);
  }
  const files=getCurrentReviewFiles();
  return files.filter(f=>f.required).filter(f=>!String(completion[f.url]||'').trim() || String(completion[f.status]||'pending')!=='approved').map(f=>f.title);
}

function ensureFileReviewUi(){
  if(!document.getElementById('file-review-style')){
    const style=document.createElement('style');
    style.id='file-review-style';
    style.textContent=`
      .review-summary{margin-top:18px;padding:16px;border-radius:20px;background:rgba(213,177,90,.07);border:1px solid rgba(213,177,90,.18);display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;color:var(--muted,#b6c1b8);font-weight:800}.review-summary strong{color:var(--gold2,#f0d58f)}
      .attachments-review{margin-top:18px;display:grid;grid-template-columns:1fr;gap:12px}.attachment-card{border:1px solid var(--line,rgba(255,255,255,.08));border-radius:20px;background:rgba(255,255,255,.03);padding:15px}.attachment-top{display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap}.attachment-title{font-size:17px;font-weight:900;color:#fff}.attachment-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.attachment-note{margin-top:12px;display:grid;grid-template-columns:1fr auto;gap:8px}.attachment-note textarea{width:100%;min-height:72px;resize:vertical;padding:12px 14px;border-radius:14px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.09);color:var(--text,#f3f4ef);font-family:inherit;outline:none}.file-preview-frame{width:100%;height:64vh;border:0;border-radius:18px;background:#fff}.file-preview-img{display:block;max-width:100%;max-height:68vh;margin:auto;border-radius:18px}.file-preview-empty{padding:40px;text-align:center;color:var(--muted,#b6c1b8);font-weight:900}.review-lock{margin-top:14px;padding:14px;border-radius:16px;border:1px solid rgba(197,82,82,.25);background:rgba(197,82,82,.10);color:#ffd7d7;font-weight:900;line-height:1.8}
      @media(max-width:760px){.attachment-note{grid-template-columns:1fr}.review-summary{display:block}.review-summary span{display:block;margin-bottom:8px}}
    `;
    document.head.appendChild(style);
  }
  const modalBody=document.querySelector('#requestModal .modal-body');
  if(modalBody && !document.getElementById('attachmentsReviewPanel')){
    const panel=document.createElement('section');
    panel.className='detail-panel';
    panel.id='attachmentsReviewPanel';
    panel.style.marginTop='18px';
    panel.style.display='none';
    panel.innerHTML=`<h4>مراجعة واعتماد المرفقات</h4><div id="attachmentsReviewSummary" class="review-summary"></div><div id="attachmentsReviewList" class="attachments-review"></div>`;
    const note=document.getElementById('d_notes');
    if(note && note.parentNode===modalBody) modalBody.insertBefore(panel,note); else modalBody.appendChild(panel);
  }
  if(!document.getElementById('filePreviewModal')){
    const preview=document.createElement('div');
    preview.className='modal-overlay';
    preview.id='filePreviewModal';
    preview.innerHTML=`<div class="modal"><div class="modal-head"><div><h3 id="filePreviewTitle">معاينة المرفق</h3><p class="subtext">عرض مباشر للصور وملفات PDF.</p></div><button class="close-btn" type="button" id="closeFilePreview">×</button></div><div class="modal-body" id="filePreviewBody"><div class="file-preview-empty">لا يوجد ملف للمعاينة.</div></div></div>`;
    document.body.appendChild(preview);
    document.getElementById('closeFilePreview')?.addEventListener('click',closeFilePreview);
    preview.addEventListener('click',e=>{if(e.target===preview)closeFilePreview()});
  }
}

function completionLoadErrorHtml(msg, requestId){
  const rid=escapeHtml(String(requestId||''));
  return `<div class="review-lock">${escapeHtml(msg||'تعذر تحميل المرفقات.')}</div><div class="attachment-actions" style="margin-top:10px"><button type="button" class="mini-btn review" onclick="loadCompletionForRequest('${rid}')">إعادة المحاولة</button></div>`;
}
async function loadCompletionForRequest(requestId){
  ensureFileReviewUi();
  const loadId=String(requestId||'');
  const panel=$('attachmentsReviewPanel'); const list=$('attachmentsReviewList'); const summary=$('attachmentsReviewSummary');
  if(panel) panel.style.display='block';
  if(list) list.innerHTML='<div class="file-preview-empty">جاري تحميل المرفقات...</div>';
  if(summary) summary.innerHTML='';
  const stillCurrent=()=>String(currentRequestId||'')===loadId;
  try{
    const query=supabaseClient.from('request_completions').select('*').eq('request_id',loadId).maybeSingle();
    const timeout=new Promise((_,reject)=>setTimeout(()=>reject(new Error('timeout')),20000));
    const {data,error}=await Promise.race([query,timeout]);
    if(!stillCurrent()) return null;
    if(error){
      console.error(error);
      const hint=/policy|permission|42501|JWT/i.test(String(error.message||''))
        ? 'تحقق من تسجيل الدخول كإدارة (صلاحية admin).'
        : 'راجع الاتصال أو نفّذ سياسات request_completions في Supabase.';
      if(list) list.innerHTML=completionLoadErrorHtml('تعذر تحميل المرفقات. '+hint, loadId);
      return null;
    }
    currentCompletion=data||null;
    renderAttachmentsReview();
    return currentCompletion;
  }catch(err){
    console.error(err);
    if(!stillCurrent()) return null;
    const msg=String(err&&err.message||'')==='timeout'
      ? 'انتهت مهلة التحميل (20 ثانية). قد يكون الاتصال بقاعدة البيانات بطيئاً.'
      : 'حدث خطأ أثناء عرض المرفقات.';
    if(list) list.innerHTML=completionLoadErrorHtml(msg, loadId);
    return null;
  }
}
function renderAttachmentsReview(){
  const panel=$('attachmentsReviewPanel'); const list=$('attachmentsReviewList'); const summary=$('attachmentsReviewSummary');
  if(!panel||!list) return;
  try{
  panel.style.display='block';
  const ctx=reviewContext();
  const prof=window.JOIN_ATTACHMENT_CATALOG?.completionProfile?.(ctx||{});
  if(prof?.noAttachments){
    if(summary)summary.innerHTML='<span>لا مرفقات لهذا النوع — راجع البيانات ثم قبول الطلب.</span>';
    list.innerHTML='<div class="file-preview-empty">عضوية المتابعة لا تتطلب ملفات. استخدم «قبول الطلب» بعد التحقق من البريد والاهتمامات.</div>';
    return;
  }
  if(prof?.blocked){
    if(summary)summary.innerHTML='<span>لا يمكن مراجعة مرفقات هذا الطلب.</span>';
    list.innerHTML=`<div class="review-lock">${escapeHtml(prof.message||'نوع الطلب غير مدعوم.')}</div>`;
    return;
  }
  if(!currentCompletion){
    if(summary) summary.innerHTML='<span>لم يرفع صاحب الطلب المرفقات المطلوبة بعد.</span>';
    list.innerHTML='<div class="review-lock">لا توجد مرفقات جاهزة للمراجعة حتى الآن. استخدم زر طلب استكمال لإشعار صاحب الطلب بإكمال الملفات.</div>'; 
    return;
  }
  const files=getCurrentReviewFiles();
  if(!Array.isArray(files)) throw new Error('review files not array');
  const requiredFiles=files.filter(f=>f.required);
  const approved=requiredFiles.filter(f=>String(currentCompletion[f.status]||'pending')==='approved').length;
  const missing=requiredFiles.filter(f=>!String(currentCompletion[f.url]||'').trim()).length;
  if(summary) summary.innerHTML=`<span>المرفقات المعتمدة: <strong>${approved} / ${requiredFiles.length}</strong></span><span>الناقص الإجباري: <strong>${missing}</strong></span><span>الحالة النهائية: <strong>${escapeHtml(getFileStatusLabel(currentCompletion.final_review_status||'pending'))}</strong></span>`;
  list.innerHTML=files.map(f=>{
    const url=safeUrl(currentCompletion[f.url]);
    const st=currentCompletion[f.status]||'pending';
    const note=currentCompletion[f.note]||'';
    return `<article class="attachment-card"><div class="attachment-top"><div><div class="attachment-title">${escapeHtml(f.title)} ${f.required?'':'<span style="color:var(--muted);font-size:12px">(اختياري)</span>'}</div><span class="subtext">${url?'ملف مرفوع وجاهز للمعاينة':'لا يوجد ملف مرفوع'}</span></div><span class="tag ${fileStatusClass(st)}">${escapeHtml(getFileStatusLabel(st))}</span></div><div class="attachment-actions">${url?`<button class="mini-btn review" onclick="previewFile('${f.key}')">معاينة</button><a class="mini-btn more" href="${escapeHtml(url)}" target="_blank" rel="noopener">فتح</a>`:''}<button class="mini-btn accept" onclick="setFileReview('${f.key}','approved')">قبول</button><button class="mini-btn reject" onclick="setFileReview('${f.key}','rejected')">رفض</button><button class="mini-btn more" onclick="setFileReview('${f.key}','reupload')">إعادة رفع</button></div><div class="attachment-note"><textarea id="note_${f.key}" placeholder="ملاحظة الإدارة لهذا المرفق">${escapeHtml(note)}</textarea><button class="mini-btn more" onclick="saveFileNote('${f.key}')">حفظ الملاحظة</button></div></article>`;
  }).join('');
  }catch(err){
    console.error(err);
    const detail=err&&err.message?` (${escapeHtml(String(err.message).slice(0,120))})`:'';
    list.innerHTML=completionLoadErrorHtml('تعذر عرض قائمة المرفقات. حدّث الصفحة أو أعد فتح الطلب.'+detail, currentRequestId);
  }
}
function getReviewFile(key){return getCurrentReviewFiles().find(f=>f.key===key)}
async function setFileReview(key,status){
  const f=getReviewFile(key); if(!f||!currentCompletion)return;
  const noteEl=$(`note_${key}`);
  const payload={ [f.status]:status, [f.note]:noteEl?noteEl.value:null, updated_at:new Date().toISOString(), reviewed_at:new Date().toISOString() };
  const {data,error}=await supabaseClient.from('request_completions').update(payload).eq('id',currentCompletion.id).select('*').single();
  if(error){console.error(error);showToast('تعذر حفظ حالة المرفق.','error');return;}
  currentCompletion=data; renderAttachmentsReview(); showToast('تم حفظ مراجعة المرفق.');
}
async function saveFileNote(key){
  const f=getReviewFile(key); if(!f||!currentCompletion)return;
  const noteEl=$(`note_${key}`);
  const payload={ [f.note]:noteEl?noteEl.value:null, updated_at:new Date().toISOString() };
  const {data,error}=await supabaseClient.from('request_completions').update(payload).eq('id',currentCompletion.id).select('*').single();
  if(error){console.error(error);showToast('تعذر حفظ الملاحظة.','error');return;}
  currentCompletion=data; renderAttachmentsReview(); showToast('تم حفظ الملاحظة.');
}
async function setFinalReview(status,note=''){
  if(!currentCompletion)return null;
  const payload={final_review_status:status, final_review_note:note||currentCompletion.final_review_note||null, reviewed_at:new Date().toISOString(), updated_at:new Date().toISOString()};
  const {data,error}=await supabaseClient.from('request_completions').update(payload).eq('id',currentCompletion.id).select('*').single();
  if(error)throw error;
  currentCompletion=data; renderAttachmentsReview(); return data;
}
function previewFile(key){
  const f=getReviewFile(key); if(!f||!currentCompletion)return;
  const url=safeUrl(currentCompletion[f.url]);
  const modal=$('filePreviewModal'); const body=$('filePreviewBody'); const title=$('filePreviewTitle');
  if(!modal||!body)return;
  title.textContent=f.title;
  if(!url){body.innerHTML='<div class="file-preview-empty">لا يوجد ملف مرفوع.</div>'}
  else if(isImageUrl(url)){body.innerHTML=`<img class="file-preview-img" src="${escapeHtml(url)}" alt="${escapeHtml(f.title)}">`}
  else if(isPdfUrl(url)){body.innerHTML=`<iframe class="file-preview-frame" src="${escapeHtml(url)}"></iframe>`}
  else {body.innerHTML=`<div class="file-preview-empty">لا يمكن المعاينة المباشرة لهذا النوع. <br><br><a class="btn gold" href="${escapeHtml(url)}" target="_blank" rel="noopener">فتح الملف</a></div>`}
  modal.classList.add('show'); document.body.style.overflow='hidden';
}
function closeFilePreview(){ $('filePreviewModal')?.classList.remove('show'); if(!$('requestModal')?.classList.contains('show')) document.body.style.overflow=''; }
async function openRequest(id){
  const r=findReq(id);if(!r)return;
  currentRequestId=id;
  $('d_name').textContent=r.full_name||'-';
  $('d_type').textContent=getTypeLabel(r.request_type);
  $('d_status').textContent=getStatusLabel(r.status||'new');
  const refEl=$('d_ref')||$('d_reference');
  if(refEl)refEl.textContent=refCode(r);
  $('d_phone').textContent=r.phone||'-';
  $('d_email').textContent=r.email||'-';
  if($('d_city'))$('d_city').textContent=r.city||'-';
  $('d_date').textContent=`${formatDate(r.created_at)} ${formatTime(r.created_at)}`;
  const notesEl=$('d_notes');
  if(notesEl)notesEl.textContent=displayNotes(r);
  const extra=$('d_extra');
  if(extra)extra.innerHTML=buildExtraDetails(r);
  syncModalActions(r);
  $('requestModal').classList.add('show');
  document.body.style.overflow='hidden';
  if(approvalRequiresAttachments(r)) await loadCompletionForRequest(id);
  else{
    currentCompletion=null;
    const panel=$('attachmentsReviewPanel');
    if(panel)panel.style.display='none';
  }
}
function closeRequest(){currentRequestId=null;currentCompletion=null;$('requestModal')?.classList.remove('show');$('filePreviewModal')?.classList.remove('show');document.body.style.overflow=''}
function guardianFieldsFromRequest(r){
  const direct={
    relationship:r.relationship||r.guardian_relation||null,
    name:r.guardian_name||r.guardian_full_name||r.parent_name||null,
    phone:r.guardian_phone||r.parent_phone||null,
    national_id:r.guardian_national_id||null
  };
  if(direct.name||direct.phone||direct.national_id) return direct;
  const blob=[r.player_notes,r.notes].filter(Boolean).join('\n');
  const pick=(label)=>{
    const m=blob.match(new RegExp(`^${label}\\s*:\\s*(.+)$`,'m'));
    return m?String(m[1]).trim():null;
  };
  return{
    relationship:direct.relationship||pick('صلة ولي الأمر'),
    name:pick('اسم ولي الأمر'),
    phone:pick('جوال ولي الأمر'),
    national_id:pick('هوية ولي الأمر')
  };
}
function buildExtraDetails(r){const pairs=[]; const add=(k,v)=>{if(v!==undefined&&v!==null&&String(v).trim()!=='')pairs.push([k,v])};
  if(r.request_type==='player'){
    add('العمر الهجري',r.player_age!=null?`${r.player_age} سنة`:'');
    add('تاريخ الميلاد الهجري',r.birth_hijri||r.birth_date);
    const minor=Number(r.player_age)>0&&Number(r.player_age)<18;
    if(minor){
      const g=guardianFieldsFromRequest(r);
      add('صلة ولي الأمر',g.relationship);
      add('اسم ولي الأمر',g.name);
      add('جوال ولي الأمر',g.phone);
      add('هوية ولي الأمر',g.national_id);
    }else if(Number(r.player_age)>=18){add('الحالة','بالغ — مسؤول عن نفسه');}
    add('الفئة',r.age_category);add('المركز',r.position);
  }
  if(r.request_type==='academy_member'){
    const m=memberMeta(r);
    if(m.hasLegacyGoal){add('تنبيه',m.legacyGoalLabel||'طلب قديم — لا يُعتمد تلقائياً');}
    add('الاهتمامات',m.interestsLabel);
    add('البريد (للتواصل)',r.email);
    add('ملاحظة','لا مرفقات — عضوية متابعة فقط');
  }
  if(r.request_type==='staff'){
    const m=staffMeta(r);
    add('المجال',AR_DOMAIN_LABEL(m.domain));
    add('الدور',m.roleLabel);
    add('معرّف المجال',m.domain||'-');
    add('معرّف الدور',m.roleId||'-');
    add('سنوات الخبرة',r.coach_experience);
    add('الوقت المتاح',r.availability);
    add('البريد (تفعيل حساب)',r.email);
    const AR=window.ACADEMY_ROLES;
    if(AR&&AR.needsSportsDetail&&AR.needsSportsDetail(m.roleId)){
      add('تخصص رياضي',r.coach_specialty);
    }
  }
  if(r.request_type==='guardian'){
    const mode=window.GUARDIAN_GOALS?.resolveMode?window.GUARDIAN_GOALS.resolveMode(r):'';
    add('الغرض',goalLabel(r.guardian_goal));
    add('صلة القرابة',r.relationship||r.guardian_relation);
    if(mode==='new_player'){
      add('اسم اللاعب الجديد',r.child_name);
      add('عمر اللاعب',r.child_age||r.guardian_player_age);
      add('فئة اللاعب',r.child_category||r.guardian_player_category);
      add('مركز اللاعب',r.child_position||r.guardian_player_position);
    }
    if(mode==='existing_player'){
      add('عدد الأبناء',r.children_count);
      add('اللاعبون للربط',window.GUARDIAN_GOALS?.linkedPlayerNames?window.GUARDIAN_GOALS.linkedPlayerNames(r):(r.existing_player_names||r.child_name));
      add('معرّفات اللاعبين',Array.isArray(r.linked_player_ids)?r.linked_player_ids.join('، '):(r.linked_player_id||''));
    }
    if(!mode){add('تنبيه','غرض الطلب غير واضح — راجع البيانات قبل الاعتماد');}
  }
  if(r.request_type==='coach'){add('المسمى الفني',r.coach_job_title);add('التخصص',r.coach_specialty);add('الفئة',r.coach_category);add('سنوات الخبرة',r.coach_experience_years);add('الشهادة',r.coach_certification);}
  if(r.request_type==='supporter'){
    const m=supporterMeta(r);
    add('نوع الداعم',m.typeLabel);
    add('معرّف النوع',m.typeId||'-');
    add('مستوى الدعم',m.levelLabel);
    add('معرّف المستوى',m.levelId||'-');
    add('طريقة الدعم',m.methodLabel);
    add('معرّف الطريقة',m.methodId||'-');
    add('اسم الجهة / النشاط',m.entityName||r.entity_name);
    add('البريد',r.email);
  }
  return pairs.map(([k,v])=>`<div class="detail-item"><strong>${escapeHtml(k)}</strong><span>${escapeHtml(v)}</span></div>`).join('')||'<div class="subtext">لا توجد تفاصيل إضافية.</div>'
}

function baseCode(id,prefix){return `${prefix}-${String(id||'').replace(/-/g,'').slice(0,8).toUpperCase()}`}
async function createPlayer(r){

  const hijriBirth =
    r.birth_hijri ||
    r.guardian_birth_hijri ||
    r.child_birth_hijri ||
    null;

  const nationalId =
    r.national_id ||
    r.player_national_id ||
    r.child_national_id ||
    null;

  const payload = {
    source_request_id: r.id,

    reference_code: refCode(r),

    code: baseCode(r.id,'PLY'),

    full_name:
      r.full_name ||
      r.child_name ||
      null,

    phone: r.phone || null,
    email: r.email || null,
    city: r.city || null,

    national_id: nationalId,

    birth_hijri: hijriBirth,

    birth_date:
      r.birth_date ||
      r.child_birth_date ||
      null,

    age:
      r.player_age
        ? Number(r.player_age)
        : (
            r.guardian_player_age
              ? Number(r.guardian_player_age)
              : null
          ),

    category:
      r.age_category ||
      r.guardian_player_category ||
      r.child_category ||
      null,

    position:
      r.position ||
      r.guardian_player_position ||
      r.child_position ||
      null,

    status: 'active',

    player_status: 'نشط',

    guardian_name:
      r.request_type === 'guardian'
        ? r.full_name
        : (
            guardianFieldsFromRequest(r).name ||
            r.guardian_full_name ||
            null
          ),

    approved_at: new Date().toISOString(),

    notes:
      r.player_notes ||
      r.guardian_notes ||
      'تم الإنشاء تلقائيًا من طلب معتمد.'
  };

  const { data: ex, error: e1 } =
    await supabaseClient
      .from('players')
      .select('id')
      .eq('source_request_id', r.id)
      .maybeSingle();

  if (e1) throw e1;

  if (ex) return ex;

  const { data, error } =
    await supabaseClient
      .from('players')
      .insert([payload])
      .select('id')
      .single();

  if (error) throw error;

  return data;
}
async function createCoach(r){const payload={source_request_id:r.id,reference_code:refCode(r),full_name:r.full_name||null,job_title:r.coach_job_title||'مدرب',specialty:r.coach_specialty||null,category:r.coach_category||null,experience_years:r.coach_experience_years?Number(r.coach_experience_years):null,certification:r.coach_certification||null,phone:r.phone||null,email:r.email||null,city:r.city||null,status:'نشط',bio:r.coach_bio||null,notes:r.coach_notes||'تم الإنشاء تلقائيًا من طلب معتمد.'}; const {data:ex,error:e1}=await supabaseClient.from('coaches').select('id').eq('source_request_id',r.id).maybeSingle(); if(e1)throw e1;if(ex)return ex; const {data,error}=await supabaseClient.from('coaches').insert([payload]).select('id').single(); if(error)throw error; return data;}
async function createGuardian(r){const payload={source_request_id:r.id,reference_code:refCode(r),full_name:r.full_name||null,phone:r.phone||null,email:r.email||null,city:r.city||null,relationship:r.relationship||null,status:'active',notes:r.guardian_notes||null}; const {data:ex,error:e1}=await supabaseClient.from('guardians').select('id').eq('source_request_id',r.id).maybeSingle(); if(e1)throw e1;if(ex)return ex; const {data,error}=await supabaseClient.from('guardians').insert([payload]).select('id').single(); if(error)throw error; return data;}

function guardianMode(r){
  if(window.GUARDIAN_GOALS?.resolveMode) return window.GUARDIAN_GOALS.resolveMode(r)||'';
  const raw=String(r.guardian_goal||'').trim();
  if(raw==='register_new_player') return 'new_player';
  if(raw==='link_existing_player') return 'existing_player';
  return '';
}
function parsePlayerIds(value){
  if(!value) return [];
  if(Array.isArray(value)) return value.map(String).filter(Boolean);
  if(typeof value==='object'){
    if(Array.isArray(value.ids)) return value.ids.map(String).filter(Boolean);
    return Object.values(value).flat().map(String).filter(Boolean);
  }
  const raw=String(value).trim();
  if(!raw) return [];
  try{const parsed=JSON.parse(raw); return parsePlayerIds(parsed)}catch(e){}
  return raw.split(/[،,\s]+/).map(x=>x.trim()).filter(Boolean);
}
async function findPlayersForGuardian(r){
  const directIds=[...parsePlayerIds(r.existing_player_ids),...parsePlayerIds(r.linked_player_ids),...parsePlayerIds(r.linked_player_id),...parsePlayerIds(r.existing_player_id),...parsePlayerIds(r.player_id)];
  const uniqueIds=[...new Set(directIds)];
  if(uniqueIds.length){
    const {data,error}=await supabaseClient.from('players').select('id,full_name,code,phone').in('id',uniqueIds);
    if(error) throw error;
    return Array.isArray(data)?data:[];
  }
  const names=String((window.GUARDIAN_GOALS?.linkedPlayerNames&&window.GUARDIAN_GOALS.linkedPlayerNames(r))||r.existing_player_names||r.existing_player_search||r.child_name||'').trim();
  if(!names) return [];
  const term=names.split(/[،,]/)[0].trim().replace(/[%_]/g,'');
  if(!term) return [];
  const {data,error}=await supabaseClient.from('players').select('id,full_name,code,phone').or(`full_name.ilike.%${term}%,code.ilike.%${term}%,phone.ilike.%${term}%`).limit(8);
  if(error) throw error;
  return Array.isArray(data)?data:[];
}
async function createPlayerFromGuardianChild(r,guardian){
  const child={...r};
  child.full_name=r.child_name||r.childName||r.player_child_name||'لاعب بدون اسم';
  child.player_age=r.guardian_player_age||r.child_age||r.player_age;
  child.age_category=r.guardian_player_category||r.child_category||r.age_category;
  child.position=r.guardian_player_position||r.child_position||r.position;
  const player=await createPlayer(child);
  await supabaseClient.from('players').update({guardian_id:guardian.id,guardian_name:r.full_name||null}).eq('id',player.id);
  return player;
}
async function linkGuardian(player,guardian,r){
  if(!player?.id||!guardian?.id)return;
  const relationship=r.relationship||r.guardian_relation||'ولي أمر';
  const guardianName=guardian.full_name||r.guardian_name||r.guardian_full_name||r.parent_name||r.full_name||null;
  const {data:existing,error:lookupError}=await supabaseClient.from('player_guardians').select('id').eq('player_id',player.id).eq('guardian_id',guardian.id).maybeSingle();
  if(lookupError)throw lookupError;
  if(existing?.id){
    const {error}=await supabaseClient.from('player_guardians').update({relationship,is_primary:true,status:'active'}).eq('id',existing.id);
    if(error)throw error;
  }else{
    const {error}=await supabaseClient.from('player_guardians').insert([{player_id:player.id,guardian_id:guardian.id,relationship,is_primary:true,status:'active'}]);
    if(error)throw error;
  }
  const {error:updateError}=await supabaseClient.from('players').update({guardian_id:guardian.id,guardian_name:guardianName}).eq('id',player.id);
  if(updateError)throw updateError;
}
function guardianCandidateFromPlayerRequest(r){
  const fullName=r.guardian_name||r.guardian_full_name||r.parent_name||r.parent_full_name||r.guardian_fullname||null;
  if(!fullName) return null;
  return {full_name:fullName,phone:r.guardian_phone||r.parent_phone||r.phone||null,email:r.guardian_email||r.parent_email||r.email||null,city:r.city||null,relationship:r.guardian_relation||r.relationship||'ولي أمر'};
}
async function createGuardianForPlayerRequest(r){
  const candidate=guardianCandidateFromPlayerRequest(r);
  if(!candidate) return null;
  const {data:byRequest,error:e1}=await supabaseClient.from('guardians').select('id,full_name').eq('source_request_id',r.id).maybeSingle();
  if(e1)throw e1;
  if(byRequest)return {...byRequest,full_name:byRequest.full_name||candidate.full_name};
  if(candidate.phone){
    const {data,error}=await supabaseClient.from('guardians').select('id,full_name').eq('phone',candidate.phone).limit(1).maybeSingle();
    if(error)throw error;
    if(data?.id)return {...data,full_name:data.full_name||candidate.full_name};
  }
  const payload={source_request_id:r.id,reference_code:refCode(r),full_name:candidate.full_name,phone:candidate.phone,email:candidate.email,city:candidate.city,relationship:candidate.relationship,status:'active',notes:'تم إنشاء ولي الأمر تلقائيًا عند اعتماد اللاعب.'};
  const {data,error}=await supabaseClient.from('guardians').insert([payload]).select('id,full_name').single();
  if(error)throw error;
  return data;
}
async function createPlayerAndLinkGuardian(r){
  const player=await createPlayer(r);
  const guardian=await createGuardianForPlayerRequest(r);
  if(guardian?.id) await linkGuardian(player,guardian,r);
  return {player,guardian,linked:!!guardian?.id};
}
async function approveSupporterRequest(r){
  const m=supporterMeta(r);
  const SP=window.SUPPORTER_PROFILE;
  if(!SP?.isValidType?.(m.typeId)||!SP?.isValidLevel?.(m.levelId)||!SP?.isValidMethod?.(m.methodId)){
    showToast('لا يمكن الاعتماد: نوع الداعم أو المستوى أو طريقة الدعم غير صالحة.','warn');
    return { table:'supporters', error:'invalid_profile' };
  }
  if(SP.needsEntityName(m.typeId)&&!String(m.entityName||r.entity_name||'').trim()){
    showToast('اسم الجهة مطلوب قبل اعتماد طلب المؤسسة أو الراعي المحتمل.','warn');
    return { table:'supporters', error:'missing_entity' };
  }
  return await createSupporter(r,m);
}
async function createSupporter(r,m){
  const meta=m||supporterMeta(r);
  const payload={source_request_id:r.id,reference_code:refCode(r),full_name:r.full_name||null,phone:r.phone||null,email:r.email||null,city:r.city||null,support_type:meta.typeId||null,support_level:meta.levelId||null,entity_name:meta.entityName||r.entity_name||null,support_method:meta.methodId||null,status:'active',notes:[r.support_notes,r.notes].filter(Boolean).join('\n')||null};
  const {data:ex,error:e1}=await supabaseClient.from('supporters').select('id').eq('source_request_id',r.id).maybeSingle();
  if(e1)throw e1;
  if(ex)return ex;
  const {data,error}=await supabaseClient.from('supporters').insert([payload]).select('id').single();
  if(error)throw error;
  return data;
}
async function createVolunteer(r){const payload={source_request_id:r.id,reference_code:refCode(r),full_name:r.full_name||null,phone:r.phone||null,email:r.email||null,city:r.city||null,volunteer_field:r.volunteer_field||null,availability:r.availability||null,status:'active',notes:r.volunteer_notes||null}; const {data:ex,error:e1}=await supabaseClient.from('volunteers').select('id').eq('source_request_id',r.id).maybeSingle(); if(e1)throw e1;if(ex)return ex; const {data,error}=await supabaseClient.from('volunteers').insert([payload]).select('id').single(); if(error)throw error; return data;}
function resolveStaffCategory(domainRaw){
  const AR=window.ACADEMY_ROLES;
  const raw=String(domainRaw||'').trim();
  if(!raw) return 'general';
  if(AR?.getDomain?.(raw)) return raw;
  const byLabel=AR?.DOMAINS?.find((d)=>d.label===raw||d.id===raw);
  return byLabel?.id||raw;
}
function resolveStaffType(roleIdRaw, roleLabelRaw){
  const AR=window.ACADEMY_ROLES;
  const id=String(roleIdRaw||'').trim();
  if(id&&AR?.getRole?.(id)) return id;
  const label=String(roleLabelRaw||'').trim();
  if(!label) return 'staff';
  const byLabel=AR?.getRole?.(label)||(AR?.allRoles?AR.allRoles():AR?.ROLES||[]).find((r)=>r.label===label||r.id===label);
  return byLabel?.id||id||'staff';
}
function buildAcademyStaffNotes(r, categoryLabel, roleLabel){
  return [
    r.notes,
    r.volunteer_notes,
    categoryLabel?`مجال الكادر: ${categoryLabel}`:null,
    roleLabel?`الدور: ${roleLabel}`:null,
    r.availability?`الوقت المتاح: ${r.availability}`:null,
    refCode(r)?`مرجع الطلب: ${refCode(r)}`:null
  ].filter(Boolean).join('\n')||null;
}
async function createAcademyStaff(r){
  const m=staffMeta(r);
  const AR=window.ACADEMY_ROLES;
  const staffCategory=resolveStaffCategory(m.domain||r.volunteer_field);
  const staffType=resolveStaffType(m.roleId, m.roleLabel||r.coach_specialty);
  const categoryLabel=AR?.getDomainLabel?AR.getDomainLabel(staffCategory):staffCategory;
  const roleLabel=AR?.getRoleLabel?AR.getRoleLabel(staffType):(m.roleLabel||r.coach_specialty||staffType);
  const fullName=String(r.full_name||'').trim();
  const phone=String(r.phone||'').trim();
  if(!fullName) throw new Error('اسم الكادر مطلوب');
  if(!phone) throw new Error('جوال الكادر مطلوب');
  const payload={
    join_request_id:r.id,
    full_name:fullName,
    phone,
    email:r.email||null,
    national_id:r.national_id||null,
    staff_type:staffType,
    staff_category:staffCategory,
    qualification:r.coach_specialty||roleLabel||null,
    experience_years:r.coach_experience?Number(r.coach_experience):0,
    notes:buildAcademyStaffNotes(r, categoryLabel, roleLabel),
    status:'active',
    role:'staff'
  };
  const {data:ex,error:e1}=await supabaseClient.from('academy_staff').select('id,full_name').eq('join_request_id',r.id).maybeSingle();
  if(e1) throw e1;
  if(ex) return {table:'academy_staff',...ex};
  const {data,error}=await supabaseClient.from('academy_staff').insert([payload]).select('id,full_name,staff_type,staff_category,email,auth_user_id,status').single();
  if(error){
    if(String(error.code)==='23505'){
      const {data:byPhone}=await supabaseClient.from('academy_staff').select('id,full_name,email,auth_user_id').eq('phone',phone).maybeSingle();
      if(byPhone) return {table:'academy_staff',...byPhone,duplicate:true};
    }
    throw error;
  }
  const linked=await tryLinkStaffAuthUserId(data);
  return {table:'academy_staff',...data,...linked};
}
async function tryLinkStaffAuthUserId(staffRow){
  const email=String(staffRow?.email||'').trim().toLowerCase();
  if(!email||staffRow?.auth_user_id) return {authLinked:!!staffRow?.auth_user_id};
  return {authLinked:false,activationEmail:email,activationUrl:buildStaffActivationUrl(email)};
}
function buildStaffActivationUrl(email){
  const base=String(window.location.origin||'').replace(/\/$/,'');
  const path=base?`${base}/staff_login.html`:'staff_login.html';
  const q=email?`?email=${encodeURIComponent(email)}`:'';
  return `${path}${q}`;
}
function staffApprovalToastExtra(staffResult){
  if(!staffResult||staffResult.authLinked) return '';
  const email=staffResult.activationEmail;
  if(!email) return ' تنبيه: أضف بريداً إلكترونياً للكادر لتفعيل حساب الدخول.';
  return ` فعّل الحساب من: ${buildStaffActivationUrl(email)} (نفس البريد: ${email})`;
}
async function approveStaffRequest(r){
  const m=staffMeta(r);
  if(!m.domain||!m.roleId){
    showToast('لا يمكن الاعتماد: المجال والدور غير واضحين في الطلب.','warn');
    return { table:'academy_staff', error:'missing_role' };
  }
  if(!String(r.email||'').trim()){
    showToast('يُفضّل إضافة بريد إلكتروني قبل الاعتماد لتفعيل دخول الكادر.','warn');
  }
  return await createAcademyStaff(r);
}
async function approveGuardianRequest(r){
  const guardian=await createGuardian(r);
  const mode=guardianMode(r);
  if(!mode){
    showToast('لا يمكن اعتماد الطلب: الغرض يجب أن يكون تسجيل لاعب جديد أو ربط بلاعب موجود.','warn');
    return { guardian, mode: 'invalid' };
  }
  if(mode==='new_player'){
    const player=await createPlayerFromGuardianChild(r,guardian);
    await linkGuardian(player,guardian,r);
    return {guardian,player,mode};
  }
  if(mode==='existing_player'){
    const players=await findPlayersForGuardian(r);
    for(const player of players){await linkGuardian(player,guardian,r)}
    if(!players.length) showToast('تم إنشاء ولي الأمر، لكن لم يتم العثور على لاعب مطابق للربط.','warn');
    return {guardian,linked:players.length,mode};
  }
}
function memberCodeFromRequest(r){
  const shortId=String(r.id||'').replace(/-/g,'').slice(0,6).toUpperCase()||'000000';
  return `MEM-${shortId}`;
}
async function approveAcademyMemberRequest(r){
  const m=memberMeta(r);
  const AMP=window.ACADEMY_MEMBER_PROFILE;
  if(m.hasLegacyGoal){
    showToast('لا يمكن الاعتماد: هذا الطلب من مسار قديم غير مدعوم.','warn');
    return { table:'academy_members', error:'legacy_goal' };
  }
  if(!AMP?.hasValidInterests?.(m.interestIds)){
    showToast('لا يمكن الاعتماد: يجب أن يحتوي الطلب على اهتمام واحد صالح على الأقل.','warn');
    return { table:'academy_members', error:'missing_interests' };
  }
  if(!String(r.phone||'').trim()){
    showToast('جوال العضو مطلوب قبل الاعتماد.','warn');
    return { table:'academy_members', error:'missing_phone' };
  }
  if(!String(r.email||'').trim()){
    showToast('يُفضّل إضافة بريد للتواصل بعد قبول العضوية.','warn');
  }
  return await createAcademyMemberFromRequest(r,m);
}
async function createAcademyMemberFromRequest(r,m){
  const meta=m||memberMeta(r);
  const interestIds=(meta.interestIds||[]).map(id=>window.ACADEMY_MEMBER_PROFILE?.normalizeInterestId?window.ACADEMY_MEMBER_PROFILE.normalizeInterestId(id):id).filter(Boolean);
  const payload={
    source_request_id:r.id,
    member_code:memberCodeFromRequest(r),
    full_name:r.full_name||null,
    phone:r.phone||null,
    email:r.email||null,
    city:r.city||null,
    national_id:r.national_id||null,
    interests:interestIds.length?interestIds:null,
    status:'approved',
    notes:r.notes||r.guardian_notes||null,
    approved_at:new Date().toISOString()
  };
  const {data:ex,error:e1}=await supabaseClient.from('academy_members').select('id').eq('source_request_id',r.id).maybeSingle();
  if(e1)throw e1;
  if(ex)return ex;
  const {data,error}=await supabaseClient.from('academy_members').insert([payload]).select('id,member_code').single();
  if(error)throw error;
  return data;
}
async function approveSideEffect(r){
  if(r.request_type==='player') return await createPlayerAndLinkGuardian(r);
  if(r.request_type==='staff') return await approveStaffRequest(r);
  if(r.request_type==='coach') return await createCoach(r);
  if(r.request_type==='supporter') return await approveSupporterRequest(r);
  if(r.request_type==='guardian') return await approveGuardianRequest(r);
  if(r.request_type==='academy_member') return await approveAcademyMemberRequest(r);
}
async function updateStatus(id,status){
  const r=findReq(id); if(!r)return;
  const actionIcon = status==='approved' ? '✅' : (status==='rejected' ? '⛔' : '📝');
  const ok = await requestConfirmation({
    title:'تأكيد تحديث حالة الطلب',
    message:`سيتم تحديث حالة الطلب إلى: ${getStatusLabel(status)}. هل تريد المتابعة؟`,
    icon: actionIcon,
    okText: status==='approved' ? 'نعم، قبول الطلب' : 'تأكيد'
  });
  if(!ok)return;
  try{
    if(status==='approved' && approvalRequiresAttachments(r)){
      if(!currentCompletion || String(currentCompletion.request_id)!==String(id)) await loadCompletionForRequest(id);
      const missing=reviewMissingItems(currentCompletion);
      if(missing.length){
        showToast('لا يمكن اعتماد الطلب قبل قبول كل المرفقات الإجبارية المطلوبة.','error');
        if($('attachmentsReviewSummary')) $('attachmentsReviewSummary').innerHTML += `<div class="review-lock">المتبقي: ${escapeHtml(missing.join('، '))}</div>`;
        return;
      }
      if(currentCompletion) await setFinalReview('approved','تم اعتماد جميع المرفقات الإجبارية المطلوبة.');
    }
    let sideResult=null;
    if(status==='approved') sideResult=await approveSideEffect(r);
    const upd={status,reviewed_at:new Date().toISOString(),updated_at:new Date().toISOString()};
    const {error}=await supabaseClient.from('join_requests').update(upd).eq('id',id);
    if(error)throw error;
    Object.assign(r,upd);
    renderTable(window.REQUEST_TYPE||null);
    closeRequest();
    let okMsg=status==='approved'?'تم قبول الطلب وتنفيذ الإجراء المناسب.':`تم تحديث الحالة إلى ${getStatusLabel(status)}`;
    if(status==='approved'&&r.request_type==='staff') okMsg+=staffApprovalToastExtra(sideResult);
    showToast(okMsg, status==='rejected'?'error':'success');
  }catch(e){
    console.error(e);
    showToast('تعذر تنفيذ العملية.','error')
  }
}
function exportCsv(){const rows=[['رقم المرجع','الاسم','النوع','الحالة','الجوال','البريد','المدينة','التاريخ','التفاصيل','الملاحظات']]; filtered().forEach(r=>rows.push([refCode(r),r.full_name||'',getTypeLabel(r.request_type),getStatusLabel(r.status||'new'),r.phone||'',r.email||'',r.city||'',`${formatDate(r.created_at)} ${formatTime(r.created_at)}`,getRequestSummary(r),notes(r)])); const csv=rows.map(row=>row.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n'); const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'}); const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='academy_requests.csv';document.body.appendChild(a);a.click();a.remove();showToast('تم التصدير بنجاح')}

window.openRequest=openRequest;
window.loadCompletionForRequest=loadCompletionForRequest;
document.addEventListener('DOMContentLoaded',()=>{
  ensureFileReviewUi();
  ensureChatUi();
  if($('requestsCards')) renderDashboard();
  $('closeModal')?.addEventListener('click',closeRequest); $('closeModal2')?.addEventListener('click',closeRequest); $('requestModal')?.addEventListener('click',e=>{if(e.target===$('requestModal'))closeRequest()}); $('closeFilePreview')?.addEventListener('click',closeFilePreview); $('filePreviewModal')?.addEventListener('click',e=>{if(e.target===$('filePreviewModal'))closeFilePreview()}); document.addEventListener('keydown',e=>{if(e.key==='Escape'){ if($('filePreviewModal')?.classList.contains('show')) closeFilePreview(); else closeRequest(); }});
  $('modalAcceptBtn')?.addEventListener('click',()=>currentRequestId&&updateStatus(currentRequestId,'approved')); $('modalRejectBtn')?.addEventListener('click',()=>currentRequestId&&updateStatus(currentRequestId,'rejected')); $('modalCompleteBtn')?.addEventListener('click',()=>currentRequestId&&updateStatus(currentRequestId,'pending'));
  const statusFilterEl = $('statusFilter');
  if (window.REQUEST_TYPE && statusFilterEl) statusFilterEl.value = 'all';
  ['searchInput','statusFilter','sortFilter','typeFilter','dateFilter','guardianGoalFilter','staffDomainFilter','supporterTypeFilter','supporterMethodFilter','memberInterestFilter'].forEach(id=>$(id)?.addEventListener(id==='searchInput'?'input':'change',()=>renderTable(window.REQUEST_TYPE||null)));
  $('applyFiltersBtn')?.addEventListener('click',()=>renderTable(window.REQUEST_TYPE||null));
  $('exportBtn')?.addEventListener('click',exportCsv);
  loadRequests(window.REQUEST_TYPE||null);
});
