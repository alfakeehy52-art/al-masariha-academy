/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

global.window = global;
vm.runInThisContext(
  fs.readFileSync(path.join(__dirname, "..", "js", "academy-roles.js"), "utf8")
);
vm.runInThisContext(
  fs.readFileSync(path.join(__dirname, "..", "js", "supporter-profile.js"), "utf8")
);
vm.runInThisContext(
  fs.readFileSync(path.join(__dirname, "..", "js", "academy-member-profile.js"), "utf8")
);
vm.runInThisContext(
  fs.readFileSync(path.join(__dirname, "..", "js", "guardian-goals.js"), "utf8")
);
vm.runInThisContext(
  fs.readFileSync(path.join(__dirname, "..", "js", "join-attachments-catalog.js"), "utf8")
);

const C = global.JOIN_ATTACHMENT_CATALOG;
const G = global.GUARDIAN_GOALS;

const cases = [
  { name: "player attachments", ctx: { request_type: "player" }, expectMin: 9 },
  {
    name: "guardian new",
    ctx: { request_type: "guardian", guardian_goal: "register_new_player" },
    expectMin: 8
  },
  {
    name: "guardian link",
    ctx: { request_type: "guardian", guardian_goal: "link_existing_player" },
    expectMin: 4
  },
  {
    name: "staff driver",
    ctx: {
      request_type: "staff",
      volunteer_field: "operations",
      coach_specialty: "سائق باص",
      notes: "مجال الكادر: تشغيلي\nالدور: سائق باص"
    },
    expectMin: 9
  },
  {
    name: "supporter institution",
    ctx: {
      request_type: "supporter",
      support_type: "institution",
      support_level: "gold",
      support_method: "financial",
      entity_name: "شركة الرعاية",
      notes: "نوع الداعم: مؤسسة\nمستوى الدعم: داعم ذهبي\nطريقة الدعم: مالي"
    },
    expectMin: 5,
    institutionCertRequired: true
  },
  {
    name: "supporter invalid",
    ctx: { request_type: "supporter", support_type: "unknown" },
    blocked: true
  },
  {
    name: "academy member valid",
    ctx: {
      request_type: "academy_member",
      notes: "الاهتمامات: news، events"
    },
    noAttachments: true
  },
  {
    name: "academy member legacy goal",
    ctx: { request_type: "academy_member", guardian_goal: "guardian_member_only" },
    blocked: true
  },
  {
    name: "academy member no interests",
    ctx: { request_type: "academy_member", notes: "ملاحظة فقط" },
    blocked: true
  },
  {
    name: "removed type volunteer",
    ctx: { request_type: "volunteer" },
    blocked: true
  },
  {
    name: "removed guardian goal",
    ctx: { request_type: "guardian", guardian_goal: "guardian_member_only" },
    blocked: true
  }
];

let failed = 0;
for (const c of cases) {
  const prof = C.completionProfile(c.ctx);
  const att = C.getAttachments(c.ctx);
  const forms = C.getFormDocs(c.ctx);
  if (c.blocked && !prof.blocked) {
    console.error("FAIL", c.name, "expected blocked");
    failed++;
    continue;
  }
  if (c.noAttachments && !prof.noAttachments) {
    console.error("FAIL", c.name, "expected noAttachments");
    failed++;
    continue;
  }
  if (c.expectMin && att.length < c.expectMin) {
    console.error("FAIL", c.name, `attachments ${att.length} < ${c.expectMin}`);
    failed++;
    continue;
  }
  if (c.expectMin && forms.length < 1) {
    console.error("FAIL", c.name, "expected forms");
    failed++;
    continue;
  }
  if (c.institutionCertRequired) {
    const cert = att.find((a) => a.key === "certificateFile");
    if (!cert || !cert.required) {
      console.error("FAIL", c.name, "institution cert should be required");
      failed++;
      continue;
    }
  }
  console.log("OK", c.name, { attachments: att.length, forms: forms.length, blocked: !!prof.blocked });
}

if (G.allGoalOptions().length !== 2) {
  console.error("FAIL guardian goals count", G.allGoalOptions().length);
  failed++;
} else {
  console.log("OK guardian goals count", 2);
}

if (!C.TYPE_LABELS.volunteer && C.TYPE_LABELS.player) {
  console.log("OK no volunteer in TYPE_LABELS");
} else {
  console.error("FAIL volunteer still in TYPE_LABELS");
  failed++;
}

const AR = global.ACADEMY_ROLES;
const staffReq = {
  volunteer_field: "operations",
  coach_job_title: "bus_driver",
  coach_specialty: "سائق باص",
  notes: "مجال الكادر: تشغيلي\nالدور: سائق باص"
};
const parsed = AR.parseStaffFromRequest(staffReq);
if (parsed.domain !== "operations" || parsed.roleId !== "bus_driver") {
  console.error("FAIL staff parse", parsed);
  failed++;
} else {
  console.log("OK staff parse", parsed);
}
if (AR.getApproveRoute("bus_driver") !== "staff" || AR.getApproveRoute("coach") !== "staff") {
  console.error("FAIL approveAs routes", AR.getApproveRoute("bus_driver"), AR.getApproveRoute("coach"));
  failed++;
} else {
  console.log("OK approveAs staff for all roles");
}

const SP = global.SUPPORTER_PROFILE;
if (!SP.isValidType("institution") || SP.needsEntityName("institution")) {
  const parsed = SP.parseFromRequest({
    support_type: "مؤسسة",
    support_level: "داعم ذهبي",
    support_method: "مالي",
    entity_name: "اختبار"
  });
  if (parsed.typeId !== "institution" || parsed.levelId !== "gold") {
    console.error("FAIL supporter legacy parse", parsed);
    failed++;
  } else {
    console.log("OK supporter legacy parse", parsed);
  }
} else {
  console.error("FAIL supporter profile API");
  failed++;
}

const AMP = global.ACADEMY_MEMBER_PROFILE;
if (AMP.hasValidInterests(["news", "events"]) && !AMP.hasValidInterests([])) {
  const legacy = AMP.parseFromRequest({
    request_type: "academy_member",
    guardian_goal: "guardian_member_only",
    notes: "الاهتمامات: news"
  });
  if (!legacy.hasLegacyGoal) {
    console.error("FAIL academy member legacy goal flag");
    failed++;
  } else {
    console.log("OK academy member legacy blocked flag");
  }
} else {
  console.error("FAIL academy member profile API");
  failed++;
}

process.exit(failed ? 1 : 0);
