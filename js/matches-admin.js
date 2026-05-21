(function () {
  if (typeof createSupabaseClient !== "function") return;
  const supabaseClient = createSupabaseClient();

  const DEFAULT_SEED = [
    {
      home_team: "أكاديمية المسارحة",
      away_team: "فريق النخبة",
      home_score: 2,
      away_score: 1,
      match_at: new Date(Date.now() - 9 * 86400000).toISOString(),
      venue: "ملعب الأكاديمية",
      competition: "دوري الناشئين",
      status: "finished",
      scorers_note: "⚽ محمد — 12'\n⚽ أحمد — 34'",
      player_of_match: "محمد — مهاجم",
      stats: { possession: "58%", shots: 9, corners: 6, cards: 1 },
      is_featured: true
    },
    {
      home_team: "أكاديمية المسارحة",
      away_team: "فريق النجوم",
      home_score: null,
      away_score: null,
      match_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      venue: "ملعب المدينة",
      competition: "ودية",
      status: "upcoming",
      stats: {},
      is_featured: false
    }
  ];

  const els = {
    form: document.getElementById("matchForm"),
    matchId: document.getElementById("matchId"),
    homeTeam: document.getElementById("homeTeam"),
    awayTeam: document.getElementById("awayTeam"),
    homeScore: document.getElementById("homeScore"),
    awayScore: document.getElementById("awayScore"),
    matchAt: document.getElementById("matchAt"),
    venue: document.getElementById("venue"),
    competition: document.getElementById("competition"),
    status: document.getElementById("matchStatus"),
    scorersNote: document.getElementById("scorersNote"),
    playerOfMatch: document.getElementById("playerOfMatch"),
    statPossession: document.getElementById("statPossession"),
    statShots: document.getElementById("statShots"),
    statCorners: document.getElementById("statCorners"),
    statCards: document.getElementById("statCards"),
    videoUrl: document.getElementById("videoUrl"),
    featured: document.getElementById("matchFeatured"),
    tbody: document.getElementById("matchesTableBody"),
    empty: document.getElementById("emptyMatchesState"),
    total: document.getElementById("totalMatches"),
    upcoming: document.getElementById("upcomingCount"),
    finished: document.getElementById("finishedCount"),
    seedBtn: document.getElementById("seedMatchesBtn"),
    resetBtn: document.getElementById("resetMatchFormBtn")
  };

  let rows = [];

  function esc(v) {
    return String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function fmtDate(v) {
    if (!v) return "—";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("ar-SA", { year: "numeric", month: "2-digit", day: "2-digit" });
  }

  function statusLabel(s) {
    return (
      { upcoming: "قادمة", live: "جارية", finished: "منتهية", draft: "مسودة", cancelled: "ملغاة" }[
        String(s || "")
      ] || s
    );
  }

  function scoreText(m) {
    if (m.home_score !== null && m.home_score !== undefined && m.away_score !== null && m.away_score !== undefined) {
      return `${m.home_score} - ${m.away_score}`;
    }
    return "—";
  }

  function readStats() {
    return {
      possession: els.statPossession?.value?.trim() || "",
      shots: els.statShots?.value?.trim() || "",
      corners: els.statCorners?.value?.trim() || "",
      cards: els.statCards?.value?.trim() || ""
    };
  }

  function fillStats(stats) {
    const s = stats && typeof stats === "object" ? stats : {};
    if (els.statPossession) els.statPossession.value = s.possession || "";
    if (els.statShots) els.statShots.value = s.shots || "";
    if (els.statCorners) els.statCorners.value = s.corners || "";
    if (els.statCards) els.statCards.value = s.cards || "";
  }

  function resetForm() {
    if (els.matchId) els.matchId.value = "";
    if (els.form) els.form.reset();
    if (els.homeTeam) els.homeTeam.value = "أكاديمية المسارحة";
    fillStats({});
    if (els.featured) els.featured.checked = false;
  }

  function renderStats() {
    if (els.total) els.total.textContent = rows.length;
    if (els.upcoming) els.upcoming.textContent = rows.filter((r) => r.status === "upcoming" || r.status === "live").length;
    if (els.finished) els.finished.textContent = rows.filter((r) => r.status === "finished").length;
  }

  function renderTable() {
    if (!els.tbody) return;
    if (!rows.length) {
      els.tbody.innerHTML = "";
      if (els.empty) els.empty.style.display = "block";
      return;
    }
    if (els.empty) els.empty.style.display = "none";
    els.tbody.innerHTML = rows
      .map(
        (m) => `<tr>
      <td><b>${esc(m.home_team)}</b> × ${esc(m.away_team)}</td>
      <td>${esc(scoreText(m))}</td>
      <td>${esc(fmtDate(m.match_at))}</td>
      <td>${esc(m.venue || "—")}</td>
      <td><span class="status-pill status-${esc(m.status)}">${esc(statusLabel(m.status))}</span></td>
      <td>${m.is_featured ? "⭐" : "—"}</td>
      <td><div class="table-actions">
        <button type="button" class="mini-btn" data-edit="${esc(m.id)}">تعديل</button>
        <button type="button" class="mini-btn" data-del="${esc(m.id)}">حذف</button>
      </div></td>
    </tr>`
      )
      .join("");
    els.tbody.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => editRow(btn.getAttribute("data-edit")));
    });
    els.tbody.querySelectorAll("[data-del]").forEach((btn) => {
      btn.addEventListener("click", () => deleteRow(btn.getAttribute("data-del")));
    });
  }

  function editRow(id) {
    const m = rows.find((r) => String(r.id) === String(id));
    if (!m) return;
    els.matchId.value = m.id;
    els.homeTeam.value = m.home_team || "";
    els.awayTeam.value = m.away_team || "";
    els.homeScore.value = m.home_score ?? "";
    els.awayScore.value = m.away_score ?? "";
    if (m.match_at && els.matchAt) {
      const d = new Date(m.match_at);
      els.matchAt.value = Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 16);
    }
    els.venue.value = m.venue || "";
    els.competition.value = m.competition || "";
    els.status.value = m.status || "upcoming";
    els.scorersNote.value = m.scorers_note || "";
    els.playerOfMatch.value = m.player_of_match || "";
    els.videoUrl.value = m.video_url || "";
    els.featured.checked = !!m.is_featured;
    fillStats(m.stats);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function loadRows() {
    const { data, error } = await supabaseClient.from("matches").select("*").order("match_at", { ascending: false });
    if (error) {
      console.error(error);
      rows = [];
      if (els.tbody) els.tbody.innerHTML = `<tr><td colspan="7" class="empty-state">تعذر التحميل</td></tr>`;
      return;
    }
    rows = Array.isArray(data) ? data : [];
    renderStats();
    renderTable();
  }

  async function saveRow(e) {
    e.preventDefault();
    const id = els.matchId.value.trim();
    const payload = {
      home_team: els.homeTeam.value.trim() || "أكاديمية المسارحة",
      away_team: els.awayTeam.value.trim(),
      home_score: els.homeScore.value === "" ? null : Number(els.homeScore.value),
      away_score: els.awayScore.value === "" ? null : Number(els.awayScore.value),
      match_at: els.matchAt.value ? new Date(els.matchAt.value).toISOString() : null,
      venue: els.venue.value.trim() || null,
      competition: els.competition.value.trim() || null,
      status: els.status.value,
      scorers_note: els.scorersNote.value.trim() || null,
      player_of_match: els.playerOfMatch.value.trim() || null,
      stats: readStats(),
      video_url: els.videoUrl.value.trim() || null,
      is_featured: !!els.featured.checked,
      updated_at: new Date().toISOString()
    };
    if (!payload.away_team) {
      alert("أدخل اسم الفريق المنافس.");
      return;
    }
    let error;
    if (id) {
      ({ error } = await supabaseClient.from("matches").update(payload).eq("id", id));
    } else {
      ({ error } = await supabaseClient.from("matches").insert([payload]));
    }
    if (error) {
      console.error(error);
      alert("تعذر الحفظ.");
      return;
    }
    resetForm();
    await loadRows();
  }

  async function deleteRow(id) {
    if (!id || !confirm("حذف هذه المباراة؟")) return;
    const { error } = await supabaseClient.from("matches").delete().eq("id", id);
    if (error) {
      alert("تعذر الحذف.");
      return;
    }
    await loadRows();
  }

  async function seedDefaults() {
    if (!confirm("تحميل مباريات أمثلة؟")) return;
    const { error } = await supabaseClient.from("matches").insert(DEFAULT_SEED);
    if (error) {
      console.error(error);
      alert("تعذر التحميل.");
      return;
    }
    await loadRows();
  }

  document.addEventListener("DOMContentLoaded", () => {
    els.form?.addEventListener("submit", saveRow);
    els.resetBtn?.addEventListener("click", resetForm);
    els.seedBtn?.addEventListener("click", seedDefaults);
    loadRows();
  });
})();
