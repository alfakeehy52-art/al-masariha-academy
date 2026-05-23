/**
 * مصدر واحد لنماذج ومرفقات استكمال الطلب (عرض تشغيلي).
 * أنواع الطلب: player | guardian | staff | coach | supporter | academy_member
 */
(function () {
  const REMOVED_REQUEST_TYPES = new Set(["volunteer"]);

  const TYPE_LABELS = {
    player: "اللاعب",
    guardian: "ولي الأمر",
    staff: "الكادر",
    coach: "الكادر (طلب قديم)",
    supporter: "الداعم",
    academy_member: "عضو الأكاديمية"
  };

  const PLAYER_FORMS = [
    ["نموذج انضمام / تسجيل اللاعب", "عقد تسجيل اللاعب في الأكاديمية.", "player-join"],
    ["موافقة ولي الأمر", "إقرار الموافقة على مشاركة اللاعب.", "guardian-approval"],
    ["تعهد الالتزام والانضباط", "تعهد اللاعب وولي الأمر.", "player-pledge"],
    ["إقرار تحمل المسؤولية والإصابات", "إقرار المشاركة والمسؤولية الرياضية.", "liability-waiver"],
    ["إقرار الأنظمة المالية والإدارية", "التزامات الرسوم واللوائح الإدارية.", "financial-rules"],
    ["نموذج الكشف الطبي", "للمركز الصحي — لياقة اللاعب.", "medical-form"]
  ];

  const PLAYER_FILES = [
    { key: "idDocument", label: "هوية / إقامة اللاعب", folder: "ids", url: "id_document_url", status: "id_document_status", note: "id_document_note", required: true },
    { key: "personalPhoto", label: "صورة اللاعب الشخصية", folder: "photos", url: "personal_photo_url", status: "personal_photo_status", note: "personal_photo_note", required: true, accept: "image/*" },
    { key: "certificateFile", label: "شهادة الميلاد", folder: "birth-certificates", url: "certificate_file_url", status: "certificate_file_status", note: "certificate_file_note", required: true },
    { key: "playerJoinFile", label: "نموذج انضمام اللاعب الموقّع", folder: "player-join", url: "player_join_file_url", status: "player_join_file_status", note: "player_join_file_note", required: true },
    { key: "guardianApprovalFile", label: "موافقة ولي الأمر الموقّعة", folder: "guardian-approval", url: "guardian_approval_file_url", status: "guardian_approval_file_status", note: "guardian_approval_file_note", required: true },
    { key: "playerCommitmentFile", label: "تعهد الالتزام الموقّع", folder: "player-pledge", url: "player_commitment_file_url", status: "player_commitment_file_status", note: "player_commitment_file_note", required: true },
    { key: "pledgeFile", label: "إقرار تحمل المسؤولية والإصابات الموقّع", folder: "liability-waivers", url: "pledge_file_url", status: "pledge_file_status", note: "pledge_file_note", required: true },
    { key: "contractFile", label: "إقرار الأنظمة المالية والإدارية الموقّع", folder: "financial-rules", url: "contract_file_url", status: "contract_file_status", note: "contract_file_note", required: true },
    { key: "medicalFile", label: "نموذج الكشف الطبي المعتمد", folder: "medical", url: "medical_file_url", status: "medical_file_status", note: "medical_file_note", required: true }
  ];

  const GUARDIAN_LINK_FORMS = [
    ["نموذج ربط ولي أمر بلاعب", "ربط ولي الأمر بلاعب مسجل.", "guardian-link"],
    ["تحديث بيانات الطوارئ", "تحديث أرقام التواصل والطوارئ.", "guardian-emergency"]
  ];

  const GUARDIAN_LINK_FILES = [
    { key: "idDocument", label: "هوية / إقامة ولي الأمر", folder: "guardian-ids", url: "id_document_url", status: "id_document_status", note: "id_document_note", required: true },
    { key: "personalPhoto", label: "صورة ولي الأمر (اختياري)", folder: "guardian-photos", url: "personal_photo_url", status: "personal_photo_status", note: "personal_photo_note", required: false, accept: "image/*" },
    { key: "guardianLinkFile", label: "نموذج ربط ولي الأمر موقّع", folder: "guardian-link", url: "guardian_link_file_url", status: "guardian_link_file_status", note: "guardian_link_file_note", required: true },
    { key: "pledgeFile", label: "نموذج تحديث الطوارئ موقّع", folder: "guardian-emergency", url: "pledge_file_url", status: "pledge_file_status", note: "pledge_file_note", required: true },
    { key: "certificateFile", label: "إثبات صلة القرابة (إن وُجد)", folder: "relationship-proof", url: "certificate_file_url", status: "certificate_file_status", note: "certificate_file_note", required: false }
  ];

  const GUARDIAN_NEW_FORMS = [
    ["تسجيل لاعب جديد عبر ولي الأمر", "نموذج إداري لتسجيل لاعب جديد.", "guardian-new-player"],
    ["تعهد ولي الأمر", "صحة البيانات والمتابعة.", "guardian-pledge"],
    ...PLAYER_FORMS.filter((f) => f[2] !== "player-join")
  ];

  const GUARDIAN_NEW_FILES = [
    { key: "idDocument", label: "هوية / إقامة ولي الأمر", folder: "guardian-ids", url: "id_document_url", status: "id_document_status", note: "id_document_note", required: true },
    { key: "personalPhoto", label: "صورة ولي الأمر (اختياري)", folder: "guardian-photos", url: "personal_photo_url", status: "personal_photo_status", note: "personal_photo_note", required: false, accept: "image/*" },
    { key: "guardianNewPlayerFile", label: "نموذج تسجيل لاعب جديد موقّع", folder: "guardian-new-player", url: "guardian_pledge_file_url", status: "guardian_pledge_file_status", note: "guardian_pledge_file_note", required: true },
    ...PLAYER_FILES.filter((f) => f.key !== "idDocument" && f.key !== "personalPhoto").map((f) => {
      if (f.key === "certificateFile") {
        return { ...f, label: "شهادة ميلاد اللاعب" };
      }
      return { ...f };
    })
  ];

  const STAFF_FORMS_BASE = [
    ["عقد الكادر", "تنظيم العلاقة مع الأكاديمية.", "staff-contract"],
    ["تعهد الالتزام", "الانضباط واللوائح.", "staff-pledge"],
    ["إقرار السرية والخصوصية", "حماية بيانات الأكاديمية واللاعبين.", "confidentiality-pledge"],
    ["نموذج البيانات البنكية", "لصرف المستحقات عند الاعتماد.", "bank-info-form"]
  ];

  const STAFF_FILES_BASE = [
    { key: "idDocument", label: "الهوية / الإقامة", folder: "staff-ids", url: "id_document_url", status: "id_document_status", note: "id_document_note", required: true },
    { key: "personalPhoto", label: "الصورة الشخصية", folder: "staff-photos", url: "personal_photo_url", status: "personal_photo_status", note: "personal_photo_note", required: true, accept: "image/*" },
    { key: "contractFile", label: "عقد الكادر الموقّع", folder: "staff-contracts", url: "contract_file_url", status: "contract_file_status", note: "contract_file_note", required: true },
    { key: "pledgeFile", label: "تعهد الالتزام الموقّع", folder: "staff-pledges", url: "pledge_file_url", status: "pledge_file_status", note: "pledge_file_note", required: true },
    { key: "certificateFile", label: "السيرة الذاتية / المؤهلات", folder: "staff-cv", url: "certificate_file_url", status: "certificate_file_status", note: "certificate_file_note", required: true },
    { key: "confidentialityFile", label: "إقرار السرية الموقّع", folder: "confidentiality", url: "player_join_file_url", status: "player_join_file_status", note: "player_join_file_note", required: true },
    { key: "bankInfoFile", label: "نموذج البيانات البنكية موقّع", folder: "bank-info", url: "guardian_approval_file_url", status: "guardian_approval_file_status", note: "guardian_approval_file_note", required: true }
  ];

  const DRIVER_FILES = [
    { key: "driverLicenseFile", label: "رخصة القيادة سارية", folder: "driver-license", url: "medical_file_url", status: "medical_file_status", note: "medical_file_note", required: true },
    { key: "vehicleRegFile", label: "استمارة المركبة / التأمين", folder: "vehicle-registration", url: "guardian_link_file_url", status: "guardian_link_file_status", note: "guardian_link_file_note", required: true }
  ];

  const SUPPORTER_FORMS = [
    ["عقد الداعم", "تحديد نوع الدعم والالتزامات.", "supporter-contract"],
    ["تعهد الداعم", "الالتزام بالأنظمة والشفافية.", "supporter-pledge"]
  ];

  const SUPPORTER_FILES = [
    { key: "idDocument", label: "هوية الداعم / السجل التجاري", folder: "supporter-ids", url: "id_document_url", status: "id_document_status", note: "id_document_note", required: true },
    { key: "supporterLogo", label: "شعار الجهة (اختياري)", folder: "supporter-logos", url: "supporter_logo_url", status: "supporter_logo_status", note: "supporter_logo_note", required: false, accept: "image/*" },
    { key: "certificateFile", label: "السجل التجاري / الترخيص (إن وُجد)", folder: "commercial-register", url: "certificate_file_url", status: "certificate_file_status", note: "certificate_file_note", required: false },
    { key: "supporterContractFile", label: "عقد الداعم الموقّع", folder: "supporter-contracts", url: "supporter_contract_file_url", status: "supporter_contract_file_status", note: "supporter_contract_file_note", required: true },
    { key: "pledgeFile", label: "تعهد الداعم الموقّع", folder: "supporter-pledges", url: "pledge_file_url", status: "pledge_file_status", note: "pledge_file_note", required: true }
  ];

  function staffMeta(ctx) {
    const AR = window.ACADEMY_ROLES;
    if (AR && AR.parseStaffFromRequest) return AR.parseStaffFromRequest(ctx);
    return { domain: String(ctx?.volunteer_field || ""), roleId: "", roleLabel: String(ctx?.coach_specialty || "") };
  }

  function isBusDriver(ctx) {
    const m = staffMeta(ctx);
    if (m.roleId === "bus_driver") return true;
    const label = String(m.roleLabel || ctx?.coach_specialty || "").trim();
    return /سائق|باص|driver/i.test(label);
  }

  function supporterMeta(ctx) {
    const SP = window.SUPPORTER_PROFILE;
    if (SP && SP.parseFromRequest) return SP.parseFromRequest(ctx);
    return {
      typeId: String(ctx?.support_type || ""),
      levelId: String(ctx?.support_level || ""),
      methodId: String(ctx?.support_method || "")
    };
  }

  function guardianGoal(ctx) {
    return String(ctx?.guardian_goal || "").trim();
  }

  function completionProfile(ctx) {
    const type = String(ctx?.request_type || "").toLowerCase();
    if (REMOVED_REQUEST_TYPES.has(type)) {
      return { blocked: true, message: "نوع الطلب لم يعد مدعوماً. تواصل مع إدارة الأكاديمية." };
    }
    if (type === "academy_member") {
      const AMP = window.ACADEMY_MEMBER_PROFILE;
      const m =
        AMP && AMP.parseFromRequest
          ? AMP.parseFromRequest(ctx)
          : { interestIds: [], hasLegacyGoal: false };
      if (m.hasLegacyGoal) {
        return {
          blocked: true,
          message:
            m.legacyGoalLabel ||
            "طلب قديم غير مدعوم. استخدم عضوية الأكاديمية من صفحة الانضمام."
        };
      }
      const valid =
        AMP?.hasValidInterests?.(m.interestIds) ||
        (Array.isArray(m.interestIds) && m.interestIds.length > 0);
      if (!valid) {
        return {
          blocked: true,
          message: "يجب اختيار اهتمام واحد على الأقل في طلب العضوية."
        };
      }
      return {
        noAttachments: true,
        message: "عضوية المتابعة لا تتطلب مرفقات — سيتم التواصل عبر البريد أو الجوال بعد المراجعة."
      };
    }
    if (type === "guardian") {
      const goal = guardianGoal(ctx);
      const valid =
        window.GUARDIAN_GOALS?.isValidGoal?.(goal) ||
        goal === "register_new_player" ||
        goal === "link_existing_player";
      if (!valid) {
        return {
          blocked: true,
          message: "غرض الطلب غير صالح. يُقبل فقط: تسجيل لاعب جديد أو ربط بلاعب مسجّل."
        };
      }
      return {
        type: "guardian",
        goal,
        key: goal === "register_new_player" ? "guardian_new" : "guardian_link"
      };
    }
    if (type === "staff" || type === "coach") {
      return { type, key: type === "staff" ? "staff" : "coach", isDriver: isBusDriver(ctx) };
    }
    if (type === "supporter") {
      const m = supporterMeta(ctx);
      const SP = window.SUPPORTER_PROFILE;
      const valid =
        SP?.isValidType?.(m.typeId) &&
        SP?.isValidLevel?.(m.levelId) &&
        SP?.isValidMethod?.(m.methodId);
      if (!valid) {
        return {
          blocked: true,
          message: "بيانات الداعم غير مكتملة. يُقبل فقط: نوع داعم، مستوى، وطريقة دعم صالحة."
        };
      }
      if (SP?.needsEntityName?.(m.typeId) && !m.entityName) {
        return {
          blocked: true,
          message: "اسم الجهة / النشاط مطلوب للمؤسسات والرعاة المحتملين."
        };
      }
      return {
        type: "supporter",
        key: m.typeId,
        isInstitution: m.typeId === "institution"
      };
    }
    return { type, key: type };
  }

  function staffForms(ctx) {
    const forms = STAFF_FORMS_BASE.slice();
    if (isBusDriver(ctx)) {
      forms.push(["تعهد سلامة السائق", "التزامات النقل والسلامة.", "driver-safety"]);
    }
    return forms;
  }

  function staffFiles(ctx) {
    const files = STAFF_FILES_BASE.slice();
    if (isBusDriver(ctx)) files.push(...DRIVER_FILES);
    return files;
  }

  function supporterFiles(ctx) {
    const files = SUPPORTER_FILES.map((f) => ({ ...f }));
    const m = supporterMeta(ctx);
    if (m.typeId === "institution") {
      const cert = files.find((x) => x.key === "certificateFile");
      if (cert) {
        cert.label = "السجل التجاري / الترخيص";
        cert.required = true;
      }
    }
    if (m.typeId === "sponsor_prospect") {
      const logo = files.find((x) => x.key === "supporterLogo");
      if (logo) logo.required = true;
    }
    return files;
  }

  function getFormDocs(ctx) {
    const p = completionProfile(ctx);
    if (p.blocked || p.noAttachments) return [];
    if (p.type === "guardian") {
      return p.key === "guardian_new" ? GUARDIAN_NEW_FORMS : GUARDIAN_LINK_FORMS;
    }
    if (p.type === "player") return PLAYER_FORMS;
    if (p.type === "staff" || p.type === "coach") return staffForms(ctx);
    if (p.type === "supporter") return SUPPORTER_FORMS;
    return [];
  }

  function getAttachments(ctx) {
    const p = completionProfile(ctx);
    if (p.blocked || p.noAttachments) return [];
    if (p.type === "guardian") {
      return p.key === "guardian_new" ? GUARDIAN_NEW_FILES : GUARDIAN_LINK_FILES;
    }
    if (p.type === "player") return PLAYER_FILES;
    if (p.type === "staff" || p.type === "coach") return staffFiles(ctx);
    if (p.type === "supporter") return supporterFiles(ctx);
    return [];
  }

  function toReviewFiles(attachments) {
    return attachments.map((a) => ({
      key: a.key,
      title: a.label,
      url: a.url,
      status: a.status,
      note: a.note,
      required: !!a.required
    }));
  }

  function getReviewFilesByType(type, ctx) {
    const merged = Object.assign({ request_type: type }, ctx || {});
    return toReviewFiles(getAttachments(merged));
  }

  function labelForType(type) {
    return TYPE_LABELS[String(type || "").toLowerCase()] || type || "الطلب";
  }

  window.JOIN_ATTACHMENT_CATALOG = {
    TYPE_LABELS,
    completionProfile,
    getFormDocs,
    getAttachments,
    getReviewFilesByType,
    toReviewFiles,
    labelForType,
    guardianGoal,
    isBusDriver,
    supporterMeta
  };
  window.getReviewFilesByType = getReviewFilesByType;
})();
