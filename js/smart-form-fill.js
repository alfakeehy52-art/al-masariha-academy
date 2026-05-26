/**
 * تعبئة النماذج الذكية من بيانات طلب الانضمام + إعدادات الاعتماد الرسمي.
 */
(function () {
  function display(v) {
    return v === null || v === undefined || v === "" ? "—" : String(v);
  }

  function esc(v) {
    return String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function noteText(r) {
    return [r.notes, r.player_notes, r.guardian_notes].filter(Boolean).join("\n");
  }

  function pickFromNotes(notes, pattern) {
    const m = String(notes || "").match(pattern);
    return m ? String(m[1]).trim() : "";
  }

  function parseGuardianFromRequest(r) {
    const direct = {
      name:
        r.guardian_name ||
        r.guardian_full_name ||
        r.parent_name ||
        r.parent_full_name ||
        "",
      id: r.guardian_national_id || r.guardian_id_number || "",
      phone: r.guardian_phone || "",
      relationship: r.relationship || r.guardian_relation || ""
    };
    if (direct.name) return direct;

    const notes = noteText(r);
    return {
      name: pickFromNotes(notes, /اسم ولي الأمر:\s*(.+)/i),
      id: pickFromNotes(notes, /هوية ولي الأمر:\s*(.+)/i),
      phone: pickFromNotes(notes, /جوال ولي الأمر:\s*(.+)/i),
      relationship: pickFromNotes(notes, /صلة ولي الأمر:\s*(.+)/i)
    };
  }

  function playerBirthDisplay(r) {
    return r.birth_hijri || r.birth_date || r.dob || r.player_birth_hijri || "";
  }

  function playerAgeValue(r) {
    const n = Number(r.player_age ?? r.age ?? r.child_age);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  function resolvePlayerAge(r) {
    let age = playerAgeValue(r);
    const policy = window.ACADEMY_POLICY || {};
    if (age === null && playerBirthDisplay(r) && policy.parseHijriDate && policy.calcHijriAge) {
      const birth = policy.parseHijriDate(playerBirthDisplay(r));
      const computed = policy.calcHijriAge(birth);
      if (Number.isFinite(computed)) age = computed;
    }
    return age;
  }

  function isMinorPlayer(r) {
    const age = resolvePlayerAge(r);
    const policy = window.ACADEMY_POLICY || {};
    if (age !== null) {
      if (typeof policy.isMinorHijriAge === "function") return policy.isMinorHijriAge(age);
      return age < 18;
    }
    return Boolean(parseGuardianFromRequest(r).name);
  }

  /** سياق الصياغة: قاصر = ولي الأمر ينوب، بالغ = اللاعب بنفسه */
  function playerFormContext(r) {
    const minor = isMinorPlayer(r);
    const playerName = String(r.full_name || r.child_name || "").trim() || "اللاعب";
    const g = parseGuardianFromRequest(r);
    const rel = String(g.relationship || "").trim();
    const relBit = rel ? ` (<b>${esc(rel)}</b>)` : "";
    const nameHtml = `<b>${esc(playerName)}</b>`;

    if (minor) {
      return {
        minor: true,
        playerName,
        signerRole: "ولي الأمر",
        docSubtitle: "طلب انضمام لاعب قاصر — يوقّع ويتعهد ولي الأمر",
        joinStatement: `<p>أقر أنا ولي أمر اللاعب ${nameHtml}${relBit} بأنني أنوب عنه قانونياً في هذا الطلب، وبموافقتي على انضمامه إلى <b>أكاديمية المسارحة لكرة القدم</b> وفق الأنظمة والتعليمات المعتمدة داخل الأكاديمية، وأتحمل مسؤولية صحة البيانات المقدمة باسمه.</p>`,
        sportsNote:
          "يخضع قبول اللاعب النهائي لمراجعة الإدارة الفنية والإدارية واكتمال المرفقات، ويُواصل التواصل مع ولي الأمر عند الحاجة.",
        conditionsExtra:
          "<li>يلتزم ولي الأمر بمتابعة اللاعب والتعاون مع الإدارة في الانضباط والحضور.</li>",
        pledgeIntro: `<p>أتعهد أنا ولي أمر اللاعب ${nameHtml} بالالتزام نيابة عنه بأنظمة الأكاديمية وتعليمات الجهاز الفني والإداري، وبالمحافظة على سمعة الأكاديمية ومرافقها.</p>`,
        pledgeNotify:
          "<li>إبلاغ الإدارة فوراً عند وجود ظرف صحي أو اجتماعي يؤثر على مشاركة اللاعب.</li>",
        liabilityIntro: `<p>أقر أنا ولي أمر اللاعب ${nameHtml} بأن مشاركته في التمارين والمباريات والأنشطة الرياضية قد تنطوي على مخاطر إصابة، وأوافق على مشاركته مع الالتزام بإرشادات السلامة الصادرة من الأكاديمية.</p>`,
        financialIntro:
          "<p>أقر أنا ولي أمر اللاعب باطلاعي على لوائح الأكاديمية المتعلقة بالرسوم والاشتراكات والزي والمواصلات عند تفعيلها، والتزامي بسداد المستحقات في مواعيدها المعلنة نيابة عنه عند الاقتضاء.</p>",
        approvalIntro: `<p>أقر أنا ولي أمر اللاعب ${nameHtml} بموافقتي على انضمامه إلى أكاديمية المسارحة لكرة القدم ومشاركته في البرامج التدريبية والأنشطة الرياضية وفق اللوائح والتعليمات.</p>`
      };
    }

    return {
      minor: false,
      playerName,
      signerRole: "اللاعب",
      docSubtitle: "طلب انضمام لاعب بالغ — يوقّع ويتعهد اللاعب بنفسه",
      joinStatement: `<p>أقر أنا اللاعب ${nameHtml} بأنني أقدّم طلب الانضمام <b>لنفسي</b> إلى <b>أكاديمية المسارحة لكرة القدم</b> وفق الأنظمة والتعليمات المعتمدة داخل الأكاديمية، وأتحمل مسؤولية صحة بياناتي المقدمة في هذا الطلب.</p>`,
      sportsNote:
        "يخضع قبولي النهائي لمراجعة الإدارة الفنية والإدارية واكتمال المرفقات المطلوبة.",
      conditionsExtra: "",
      pledgeIntro: `<p>أتعهد أنا اللاعب ${nameHtml} بالالتزام بأنظمة الأكاديمية وتعليمات الجهاز الفني والإداري، وبالمحافظة على سمعة الأكاديمية ومرافقها.</p>`,
      pledgeNotify:
        "<li>إبلاغ الإدارة عند وجود ظرف صحي أو اجتماعي يؤثر على مشاركتي.</li>",
      liabilityIntro: `<p>أقر أنا اللاعب ${nameHtml} بأن مشاركتي في التمارين والمباريات والأنشطة الرياضية قد تنطوي على مخاطر إصابة، وأوافق على المشاركة مع الالتزام بإرشادات السلامة الصادرة من الأكاديمية.</p>`,
      financialIntro:
        "<p>أقر باطلاعي على لوائح الأكاديمية المتعلقة بالرسوم والاشتراكات والزي والمواصلات عند تفعيلها، والتزامي بسداد المستحقات في مواعيدها المعلنة.</p>",
      approvalIntro: `<p>أقر أنا اللاعب ${nameHtml} برغبتي في الانضمام إلى أكاديمية المسارحة لكرة القدم والمشاركة في البرامج التدريبية والأنشطة الرياضية وفق اللوائح والتعليمات.</p>`
    };
  }

  function playerCategoryDisplay(r) {
    return display(r.age_category || r.category || r.guardian_player_category);
  }

  function playerPositionDisplay(r) {
    return display(r.position || r.player_position || r.guardian_player_position);
  }

  function playerJoinContentHtml(r) {
    const ctx = playerFormContext(r);
    return `<div class="section"><h3>بيان الانضمام</h3>${ctx.joinStatement}<p class="subtext" style="margin-top:6px;font-size:11.5px;color:#666">${esc(ctx.docSubtitle)}</p></div><div class="section"><h3>بيانات رياضية</h3><ol><li>الفئة العمرية: <b>${esc(playerCategoryDisplay(r))}</b></li><li>المركز المفضل: <b>${esc(playerPositionDisplay(r))}</b></li><li>${ctx.sportsNote}</li></ol></div><div class="section"><h3>شروط الانضمام</h3><ol><li>الالتزام بالحضور والانضباط في التمارين والأنشطة.</li><li>المحافظة على السلوك الرياضي واحترام المدربين والزملاء.</li><li>تقديم مرفقات صحيحة وواضحة وقابلة للمراجعة.</li><li>يحق للأكاديمية رفض أو تعليق الطلب عند نقص البيانات أو عدم مطابقة الشروط.</li>${ctx.conditionsExtra}</ol></div>`;
  }

  function playerPledgeContentHtml(r) {
    const ctx = playerFormContext(r);
    return `<div class="section"><h3>تعهد الالتزام</h3>${ctx.pledgeIntro}</div><div class="section"><h3>بنود التعهد</h3><ol><li>الالتزام بمواعيد الحضور والانصراف والزي الرياضي المعتمد.</li><li>احترام المدربين والإداريين والزملاء وعدم الإساءة اللفظية أو السلوكية.</li><li>عدم استخدام اسم أو شعار الأكاديمية دون إذن رسمي.</li>${ctx.pledgeNotify}<li>قبول الإجراءات الإدارية المناسبة عند مخالفة اللوائح.</li></ol></div>`;
  }

  function guardianApprovalContentHtml(r) {
    const ctx = playerFormContext(r);
    if (!ctx.minor) {
      return `<div class="section"><h3>ملاحظة</h3><p>هذا النموذج مخصص لولي أمر لاعب <b>قاصر</b>. اللاعب البالغ يعتمد على «نموذج انضمام اللاعب» و«تعهد الالتزام» بتوقيعه الشخصي.</p></div>${playerJoinContentHtml(r)}`;
    }
    return `<div class="section"><h3>نص الموافقة</h3>${ctx.approvalIntro}</div><div class="section"><h3>نطاق الموافقة</h3><ol><li>الموافقة على مشاركة اللاعب في التمارين والأنشطة الرياضية المناسبة لفئته.</li><li>الالتزام بتزويد الأكاديمية بأي معلومات صحية أو سلوكية مهمة تخص اللاعب.</li><li>الإقرار بأن القبول النهائي مرتبط باكتمال المرفقات واعتماد الإدارة.</li><li>الموافقة على التواصل مع ولي الأمر عند الحاجة بخصوص اللاعب.</li></ol></div><div class="section"><h3>بيان مهم</h3><p>لا تغني هذه الموافقة عن نموذج الكشف الطبي، ويجب رفع كشف طبي معتمد من جهة صحية قبل الاعتماد النهائي.</p></div>`;
  }

  function liabilityWaiverContentHtml(r) {
    const ctx = playerFormContext(r);
    return `<div class="section"><h3>إقرار تحمل المسؤولية</h3>${ctx.liabilityIntro}</div><div class="section"><h3>بنود الإقرار</h3><ol><li>إبلاغ الأكاديمية بأي حالة صحية مؤثرة قبل المشاركة.</li><li>عدم إخفاء إصابات سابقة أو حالية قد تزيد المخاطر.</li><li>الالتزام بتعليمات المدربين والطاقم الطبي أثناء النشاط.</li><li>عدم تحميل الأكاديمية مسؤولية الإصابات الناتجة عن مخالفة التعليمات أو السلوك غير الرياضي.</li></ol></div>`;
  }

  function financialRulesContentHtml(r) {
    const ctx = playerFormContext(r);
    return `<div class="section"><h3>الأنظمة المالية والإدارية</h3>${ctx.financialIntro}</div><div class="section"><h3>التزامات</h3><ol><li>الالتزام بسياسة الغياب والانسحاب المعتمدة.</li><li>عدم التحويل أو الاسترداد إلا وفق سياسة الأكاديمية المكتوبة.</li><li>تحديث بيانات التواصل لاستلام الإشعارات المالية والإدارية.</li></ol></div>`;
  }

  function playerDocTitles(docType, r) {
    const ctx = playerFormContext(r);
    const suffix = ctx.minor ? " (ولي أمر)" : " (لاعب بالغ)";
    const map = {
      "player-join": ["نموذج انضمام اللاعب", `نموذج انضمام لاعب${suffix}`],
      "player-contract": ["نموذج انضمام اللاعب", `نموذج انضمام لاعب${suffix}`],
      "player-pledge": ["تعهد الالتزام", `تعهد التزام اللاعب${suffix}`],
      "guardian-approval": [
        ctx.minor ? "موافقة ولي الأمر" : "انضمام لاعب بالغ",
        ctx.minor ? "موافقة ولي الأمر على انضمام القاصر" : "انضمام لاعب بالغ"
      ],
      "liability-waiver": ["إقرار المسؤولية", `تحمل المسؤولية${suffix}`],
      "financial-rules": ["الأنظمة المالية", `إقرار مالي وإداري${suffix}`]
    };
    return map[docType] || null;
  }

  function isApprovedRequest(r) {
    const s = String(r.status || "").trim().toLowerCase();
    return ["approved", "accepted", "معتمد", "مقبول"].includes(s);
  }

  function academySettings() {
    return window.ACADEMY_SETTINGS || {};
  }

  function officialSignatory() {
    const s = academySettings();
    return {
      title: String(s.official_signatory_title_ar || "مدير أكاديمية المسارحة").trim(),
      name: String(s.official_signatory_name_ar || "").trim()
    };
  }

  function formatArDate(v) {
    if (!v) return ".... / .... / ..........";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return display(v);
    return d.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
  }

  function sigLine(value, blank) {
    const v = String(value || "").trim();
    if (v) return esc(v);
    return blank || "........................";
  }

  function adminApprovalSignatureHtml(r) {
    const approved = isApprovedRequest(r);
    const off = officialSignatory();
    const nameLine =
      approved && off.name ? esc(off.name) : "........................";
    const dateLine = approved
      ? formatArDate(r.reviewed_at || r.approved_at || r.updated_at)
      : ".... / .... / ..........";
    const hint = approved
      ? ""
      : '<p style="margin:6px 0 0;font-size:11px;color:#666">يُوقَّع ويُختم عند الاعتماد النهائي من الإدارة.</p>';
    return `<div class="sig"><h4>اعتماد الإدارة</h4><p>المنصب: ${esc(off.title)}</p><p>اسم المسؤول: ${nameLine}</p><p>التوقيع / الختم:</p><p>التاريخ: ${esc(dateLine)}</p>${hint}</div>`;
  }

  function guardianSignatureHtml(r) {
    const g = parseGuardianFromRequest(r);
    const minor = isMinorPlayer(r);
    if (minor) {
      return `<div class="sig"><h4>توقيع ولي الأمر (نيابة عن اللاعب)</h4><p>الاسم: ${sigLine(g.name)}</p><p>صلة القرابة: ${sigLine(g.relationship)}</p><p>رقم الهوية: ${sigLine(g.id)}</p><p>التوقيع:</p><p>التاريخ: .... / .... / ..........</p></div>${adminApprovalSignatureHtml(r)}`;
    }
    const playerName = r.full_name || r.child_name || "";
    return `<div class="sig"><h4>توقيع اللاعب</h4><p>الاسم: ${sigLine(playerName)}</p><p>رقم الهوية: ${sigLine(r.national_id || r.player_national_id)}</p><p>التوقيع:</p><p>التاريخ: .... / .... / ..........</p></div>${adminApprovalSignatureHtml(r)}`;
  }

  function defaultSignaturesHtml(r) {
    const name = r.full_name || "";
    return `<div class="signatures"><div class="sig"><h4>توقيع المتقدم</h4><p>الاسم: ${sigLine(name)}</p><p>التوقيع:</p><p>التاريخ: .... / .... / ..........</p></div>${adminApprovalSignatureHtml(r)}</div>`;
  }

  function guardianSignaturesHtml(r) {
    return `<div class="signatures">${guardianSignatureHtml(r)}</div>`;
  }

  function playerMetaRows(r) {
    return [
      ["اسم اللاعب", r.full_name],
      ["رقم الهوية / الإقامة", r.national_id || r.player_national_id || r.child_national_id],
      ["تاريخ الميلاد الهجري", playerBirthDisplay(r)],
      ["المركز", r.position || r.player_position],
      ["رقم الجوال", r.phone],
      ["المدينة", r.city]
    ];
  }

  function playerUnifiedMetaRows(r) {
    const age = resolvePlayerAge(r);
    return [
      ["اسم اللاعب", r.full_name],
      ["رقم الهوية / الإقامة", r.national_id || r.player_national_id || r.child_national_id],
      ["تاريخ الميلاد الهجري", playerBirthDisplay(r)],
      ["العمر (هجري)", age !== null ? age : ""],
      ["الفئة العمرية", playerCategoryDisplay(r)],
      ["المركز المفضل", playerPositionDisplay(r)],
      ["المدينة", r.city],
      ["رقم الجوال", r.phone],
      ["رقم الطلب", r.reference_code]
    ];
  }

  function playerUnifiedContentHtml(r) {
    const ctx = playerFormContext(r);
    const minor = ctx.minor;
    const joinExtra = minor
      ? `<p>وفي حال كان اللاعب دون <b>18 سنة هجرية</b>، فإن ولي الأمر أو الوصي النظامي يُعد مسؤولاً عن الموافقة على الطلب والالتزام بالتعليمات واللوائح المعتمدة لدى الأكاديمية.</p>`
      : "";
    const regulationsIntro = minor
      ? "يقر اللاعب وولي أمره بالالتزام بما يلي:"
      : "يقر اللاعب بالالتزام بما يلي:";
    const financialIntro = minor
      ? "يقر اللاعب وولي أمره — إن وجد — بالاطلاع على الأنظمة واللوائح المالية والإدارية الخاصة بالأكاديمية، والالتزام بما يصدر عنها من تعليمات وتنظيمات معتمدة."
      : "يقر اللاعب بالاطلاع على الأنظمة واللوائح المالية والإدارية الخاصة بالأكاديمية، والالتزام بما يصدر عنها من تعليمات وتنظيمات معتمدة.";
    const healthIntro = minor
      ? "يقر ولي الأمر / اللاعب بعدم إخفاء أي حالة صحية أو إصابة أو مانع طبي قد يؤثر على مشاركة اللاعب في الأنشطة الرياضية، مع الالتزام بإبلاغ الأكاديمية بأي مستجدات صحية قد تطرأ مستقبلاً."
      : "يقر اللاعب بعدم إخفاء أي حالة صحية أو إصابة أو مانع طبي قد يؤثر على مشاركته في الأنشطة الرياضية، مع الالتزام بإبلاغ الأكاديمية بأي مستجدات صحية قد تطرأ مستقبلاً.";
    const liabilityIntro = minor
      ? "يقر اللاعب وولي أمره — إن وجد — بالعلم بأن ممارسة الأنشطة الرياضية والتدريبات والمباريات قد ينتج عنها إصابات رياضية طارئة، مع التزام الأكاديمية بتطبيق إجراءات السلامة والتنظيم المعتمدة داخل مرافقها."
      : "يقر اللاعب بالعلم بأن ممارسة الأنشطة الرياضية والتدريبات والمباريات قد ينتج عنها إصابات رياضية طارئة، مع التزام الأكاديمية بتطبيق إجراءات السلامة والتنظيم المعتمدة داخل مرافقها.";

    const guardianBlock = minor
      ? `<div class="section"><h3>موافقة ولي الأمر</h3>${ctx.approvalIntro}<p>كما أتعهد بمتابعة اللاعب والالتزام بالتعاون مع إدارة الأكاديمية فيما يخص الحضور والانضباط والسلوك والالتزامات التنظيمية.</p></div>`
      : "";

    const joinLead = minor
      ? `<p>أقر أنا ولي أمر اللاعب <b>${esc(ctx.playerName)}</b>${rel ? ` (<b>${esc(rel)}</b>)` : ""} بصحة البيانات الواردة في هذا النموذج، وبأنني أنوب عنه قانونياً في تقديم طلب انضمامه إلى <b>أكاديمية المسارحة لكرة القدم</b> وفق الأنظمة واللوائح والتعليمات المعتمدة.</p>${joinExtra}`
      : `<p>أقر أنا اللاعب <b>${esc(ctx.playerName)}</b> بصحة بياناتي الواردة في هذا النموذج، وبأنني أقدّم طلب الانضمام <b>لنفسي</b> إلى <b>أكاديمية المسارحة لكرة القدم</b> وفق الأنظمة واللوائح والتعليمات المعتمدة.</p>`;

    return `
      <div class="section"><h3>طلب الانضمام</h3>
        ${joinLead}
        <p>ويُعد قبول اللاعب قبولاً مبدئياً إلى حين مراجعة الطلب واعتماده من قبل الإدارة الفنية والإدارية واستكمال المتطلبات والمرفقات اللازمة — ومنها <b>نموذج الكشف الطبي</b> المعتمد (نموذج منفصل).</p>
        <p class="subtext" style="margin-top:6px;font-size:11.5px;color:#666">${esc(ctx.docSubtitle)}</p>
      </div>
      <div class="section"><h3>اللوائح والالتزامات</h3><p>${regulationsIntro}</p>
        <ol>
          <li>الالتزام بالحضور والانضباط في التدريبات والأنشطة والفعاليات الخاصة بالأكاديمية.</li>
          <li>التحلي بالأخلاق الرياضية واحترام المدربين والإداريين والزملاء.</li>
          <li>الالتزام بالتعليمات الفنية والإدارية والتنظيمية الصادرة من الأكاديمية.</li>
          <li>المحافظة على ممتلكات الأكاديمية ومرافقها.</li>
          <li>تحديث بيانات التواصل عند حدوث أي تغيير.</li>
          <li>تقديم بيانات ومرفقات صحيحة وواضحة وقابلة للمراجعة والتحقق.</li>
          <li>الالتزام بالرسوم والاشتراكات المعتمدة — إن وجدت — وفق سياسة الأكاديمية.</li>
          <li>يحق للأكاديمية رفض أو تعليق أو إلغاء الطلب عند مخالفة اللوائح أو عدم استيفاء الشروط والمتطلبات.</li>
          ${ctx.conditionsExtra}
        </ol>
      </div>
      <div class="section"><h3>الإقرار المالي والإداري</h3>
        <p>${financialIntro}</p>
        <p>كما يلتزم مقدم الطلب بسداد الرسوم والاشتراكات — إن وجدت — وفق السياسة المالية المعتمدة لدى الأكاديمية، مع العلم بأن أي استرداد أو إعفاء يخضع للأنظمة والإجراءات الرسمية المعمول بها.</p>
      </div>
      <div class="section"><h3>الإقرار الصحي</h3>
        <p>${healthIntro}</p>
        <p>كما يلتزم مقدم الطلب بإرفاق <b>نموذج الكشف الطبي المعتمد</b> ضمن مستندات التسجيل المطلوبة (نموذج منفصل يعبئه المركز الصحي).</p>
      </div>
      <div class="section"><h3>تحمل المسؤولية الرياضية</h3>
        <p>${liabilityIntro}</p>
        <p>ولا تتحمل الأكاديمية أي مسؤولية ناتجة عن إخفاء معلومات صحية مؤثرة تخص اللاعب.</p>
      </div>
      ${guardianBlock}
      <div class="section"><h3>ملاحظات</h3>
        <ul class="notes-list">
          <li>لا يُعد هذا النموذج اعتماداً نهائياً إلا بعد مراجعة الإدارة واعتماد الطلب رسمياً.</li>
          <li>يجب استكمال جميع المرفقات والمتطلبات المطلوبة قبل القبول النهائي.</li>
          <li>يُرفق مع الطلب نموذج الكشف الطبي والمستندات المطلوبة حسب سياسة الأكاديمية.</li>
        </ul>
      </div>`;
  }

  function playerUnifiedSignaturesHtml(r) {
    const minor = isMinorPlayer(r);
    const g = parseGuardianFromRequest(r);
    const playerName = r.full_name || r.child_name || "";
    const off = officialSignatory();
    const approved = isApprovedRequest(r);
    const adminName =
      approved && off.name ? esc(off.name) : "........................";
    const adminDate = approved
      ? esc(formatArDate(r.reviewed_at || r.approved_at || r.updated_at))
      : ".... / .... / ..........";

    const playerSig = minor
      ? `<div class="sig sig-optional"><h4>مصادقة اللاعب (إن أمكن)</h4><p>الاسم: ${sigLine(playerName)}</p><p>التوقيع:</p><p>التاريخ: .... / .... / ..........</p></div>`
      : `<div class="sig"><h4>مصادقة اللاعب</h4><p>الاسم: ${sigLine(playerName)}</p><p>رقم الهوية: ${sigLine(r.national_id || r.player_national_id)}</p><p>التوقيع:</p><p>التاريخ: .... / .... / ..........</p></div>`;

    const guardianSig = minor
      ? `<div class="sig sig-primary"><h4>مصادقة ولي الأمر</h4><p>الاسم: ${sigLine(g.name)}</p><p>رقم الهوية: ${sigLine(g.id)}</p><p>صلة القرابة: ${sigLine(g.relationship)}</p><p>رقم الجوال: ${sigLine(g.phone)}</p><p>التوقيع:</p><p>التاريخ: .... / .... / ..........</p></div>`
      : "";

    const adminSig = `<div class="sig sig-admin"><h4>اعتماد الإدارة</h4><p>اسم المسؤول: ${adminName}</p><p>المسمى الوظيفي: ${esc(off.title)}</p><p>التوقيع / الختم:</p><p>التاريخ: ${adminDate}</p>${approved ? "" : '<p style="font-size:11px;color:#666;margin-top:6px">يُوقَّع عند الاعتماد النهائي.</p>'}</div>`;

    const gridClass = minor ? "signatures signatures-triple" : "signatures";
    return `<div class="section"><h3>المصادقات</h3><div class="${gridClass}">${playerSig}${guardianSig}${adminSig}</div></div>`;
  }

  function playerUnifiedDocTitles(r) {
    const ctx = playerFormContext(r);
    return [
      "نموذج التسجيل الموحد",
      ctx.minor ? "نموذج التسجيل الموحد للاعب (قاصر — ولي الأمر)" : "نموذج التسجيل الموحد للاعب (بالغ)"
    ];
  }

  /** أنواع النماذج القديمة → الموحد */
  const LEGACY_PLAYER_DOC_TYPES = new Set([
    "player-join",
    "player-contract",
    "player-pledge",
    "guardian-approval",
    "liability-waiver",
    "financial-rules"
  ]);

  function isLegacyPlayerDocType(docType) {
    return LEGACY_PLAYER_DOC_TYPES.has(String(docType || ""));
  }

  window.SMART_FORM_FILL = {
    display,
    esc,
    parseGuardianFromRequest,
    playerBirthDisplay,
    playerAgeValue,
    resolvePlayerAge,
    isMinorPlayer,
    playerFormContext,
    isApprovedRequest,
    officialSignatory,
    guardianSignaturesHtml,
    defaultSignaturesHtml,
    playerMetaRows,
    playerJoinContentHtml,
    playerPledgeContentHtml,
    guardianApprovalContentHtml,
    liabilityWaiverContentHtml,
    financialRulesContentHtml,
    playerDocTitles,
    playerCategoryDisplay,
    playerPositionDisplay,
    playerUnifiedMetaRows,
    playerUnifiedContentHtml,
    playerUnifiedSignaturesHtml,
    playerUnifiedDocTitles,
    isLegacyPlayerDocType,
    LEGACY_PLAYER_DOC_TYPES
  };
})();
