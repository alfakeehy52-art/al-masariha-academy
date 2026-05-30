(function () {
  async function rpc(name, params) {
    if (typeof createSupabaseClient !== "function") {
      throw new Error("Load supabase-config.js and js/supabase-client.js first.");
    }
    const client = createSupabaseClient();
    const { data, error } = await client.rpc(name, params || {});
    if (error) throw error;
    return data;
  }

  function isMissingRpc(error) {
    const code = error && (error.code || error.details);
    return /PGRST202|42883/i.test(String(code || "")) || /Could not find the function/i.test(String(error?.message || ""));
  }
  function missingRpcError(name) {
    return new Error(`Required RPC is missing: ${name}`);
  }

  async function lookupJoinRequestByRefPhone(ref, phone) {
    const pRef = String(ref || "").trim();
    const pPhone = String(phone || "").trim();
    try {
      const rows = await rpc("lookup_join_request_by_ref_phone", { p_ref: pRef, p_phone: pPhone });
      return Array.isArray(rows) && rows.length ? rows[0] : null;
    } catch (error) {
      if (!isMissingRpc(error)) throw error;
      throw missingRpcError("lookup_join_request_by_ref_phone");
    }
  }

  async function lookupJoinRequestsByContact(phone, email) {
    const pPhone = String(phone || "").trim();
    const pEmail = String(email || "").trim().toLowerCase();
    try {
      const rows = await rpc("lookup_join_requests_by_contact", { p_phone: pPhone, p_email: pEmail });
      return Array.isArray(rows) ? rows : [];
    } catch (error) {
      if (!isMissingRpc(error)) throw error;
      throw missingRpcError("lookup_join_requests_by_contact");
    }
  }

  async function markJoinRequestReviewing(requestId, ref, phone) {
    const pRef = String(ref || "").trim();
    const pPhone = String(phone || "").trim();
    try {
      return await rpc("submit_join_request_review", {
        p_request_id: requestId,
        p_ref: pRef,
        p_phone: pPhone
      });
    } catch (error) {
      if (!isMissingRpc(error)) throw error;
      throw missingRpcError("submit_join_request_review");
    }
  }

  async function lookupRequestCompletion(ref, phone) {
    const pRef = String(ref || "").trim();
    const pPhone = String(phone || "").trim();
    try {
      const rows = await rpc("lookup_request_completion", { p_ref: pRef, p_phone: pPhone });
      return Array.isArray(rows) && rows.length ? rows[0] : null;
    } catch (error) {
      if (!isMissingRpc(error)) throw error;
      throw missingRpcError("lookup_request_completion");
    }
  }

  async function upsertRequestCompletion(ref, phone, payload) {
    const pRef = String(ref || "").trim();
    const pPhone = String(phone || "").trim();
    try {
      const rows = await rpc("upsert_request_completion", {
        p_ref: pRef,
        p_phone: pPhone,
        p_payload: payload || {}
      });
      if (Array.isArray(rows) && rows.length) return rows[0];
      return rows || null;
    } catch (error) {
      if (!isMissingRpc(error)) throw error;
      throw missingRpcError("upsert_request_completion");
    }
  }

  async function searchPlayersPublic(term) {
    const safe = String(term || "").trim().replace(/[%,]/g, "");
    if (!safe) return [];
    try {
      const rows = await rpc("search_players_public", { p_term: safe });
      return Array.isArray(rows) ? rows : [];
    } catch (error) {
      if (!isMissingRpc(error)) throw error;
    }
    const client = createSupabaseClient();
    const { data, error: qErr } = await client
      .from("players")
      .select("id,full_name,code,phone,category,position,team")
      .or(`full_name.ilike.%${safe}%,code.ilike.%${safe}%,phone.ilike.%${safe}%`)
      .limit(8);
    if (qErr) throw qErr;
    return Array.isArray(data) ? data : [];
  }

  window.lookupJoinRequestByRefPhone = lookupJoinRequestByRefPhone;
  window.lookupJoinRequestsByContact = lookupJoinRequestsByContact;
  window.lookupRequestCompletion = lookupRequestCompletion;
  window.upsertRequestCompletion = upsertRequestCompletion;
  window.markJoinRequestReviewing = markJoinRequestReviewing;
  function coachPublicCode(row) {
    if (typeof formatEntityRef === "function") return formatEntityRef(row);
    const ref = String(row?.reference_code || row?.code || "").trim();
    return ref && !/^[0-9A-F]{6,16}$/i.test(ref) ? ref : "—";
  }

  function normalizeCoachRecord(row) {
    if (!row) return null;
    return {
      id: row.id,
      fullName: row.full_name || "",
      jobTitle: row.job_title || "",
      specialty: row.specialty || "",
      category: row.category || "",
      experienceYears: row.experience_years ?? 0,
      certification: row.certification || "",
      phone: row.phone || "",
      coachStatus: row.status || "نشط",
      bio: row.bio || "",
      image: row.image || "",
      code: coachPublicCode(row)
    };
  }

  async function listCoachesPublic() {
    try {
      const rows = await rpc("list_coaches_public", {});
      return (Array.isArray(rows) ? rows : []).map(normalizeCoachRecord);
    } catch (error) {
      if (!isMissingRpc(error)) throw error;
    }
    const client = createSupabaseClient();
    const { data, error: qErr } = await client
      .from("coaches")
      .select("id,full_name,job_title,specialty,category,experience_years,certification,phone,status,bio,image,created_at")
      .in("status", ["نشط", "مكتمل", "active"])
      .order("created_at", { ascending: false });
    if (qErr) throw qErr;
    return (Array.isArray(data) ? data : []).map(normalizeCoachRecord);
  }

  async function getCoachPublic(coachId) {
    const id = String(coachId || "").trim();
    if (!id) return null;
    try {
      const rows = await rpc("get_coach_public", { p_id: id });
      const row = Array.isArray(rows) && rows.length ? rows[0] : null;
      return normalizeCoachRecord(row);
    } catch (error) {
      if (!isMissingRpc(error)) throw error;
    }
    const client = createSupabaseClient();
    const { data, error: qErr } = await client
      .from("coaches")
      .select("id,full_name,job_title,specialty,category,experience_years,certification,phone,status,bio,image,notes,created_at")
      .eq("id", id)
      .in("status", ["نشط", "مكتمل", "active"])
      .maybeSingle();
    if (qErr) throw qErr;
    return normalizeCoachRecord(data);
  }

  function storeStatusLabel(status) {
    const map = {
      draft: "مسودة",
      coming_soon: "قريبًا",
      published: "متاح",
      hidden: "مخفي"
    };
    return map[status] || status || "—";
  }

  function normalizeStoreProduct(row) {
    if (!row) return null;
    return {
      id: row.id,
      name: row.name || "",
      price: Number(row.price || 0),
      type: row.product_type || "منتج عام",
      category: row.category || "",
      status: row.status || "coming_soon",
      statusLabel: storeStatusLabel(row.status),
      image: row.image || "",
      emoji: row.emoji || "📦",
      description: row.description || "",
      featured: !!row.is_featured,
      customizable: !!row.is_customizable,
      playerId: row.player_id || "",
      playerName: row.player_name || ""
    };
  }

  async function listStoreProductsPublic() {
    try {
      const rows = await rpc("list_store_products_public", {});
      return (Array.isArray(rows) ? rows : []).map(normalizeStoreProduct);
    } catch (error) {
      if (!isMissingRpc(error)) throw error;
    }
    const client = createSupabaseClient();
    const { data, error: qErr } = await client
      .from("store_products")
      .select(
        "id,name,price,product_type,category,status,image,emoji,description,is_featured,is_customizable,player_id,player_name,created_at"
      )
      .in("status", ["coming_soon", "published"])
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });
    if (qErr) throw qErr;
    return (Array.isArray(data) ? data : []).map(normalizeStoreProduct);
  }

  async function listStoreProductsFeatured(limit) {
    const lim = Math.max(1, Number(limit) || 4);
    try {
      const rows = await rpc("list_store_products_featured", { p_limit: lim });
      return (Array.isArray(rows) ? rows : []).map(normalizeStoreProduct);
    } catch (error) {
      if (!isMissingRpc(error)) throw error;
    }
    const all = await listStoreProductsPublic();
    return all.filter((p) => p.featured).slice(0, lim);
  }

  function normalizeTeamRecord(row) {
    if (!row) return null;
    const status = String(row.status || "نشط").trim();
    const statusMap = { active: "نشط", review: "مراجعة", stopped: "موقوف", suspended: "موقوف" };
    return {
      id: row.id,
      name: row.name || row.team_name || "",
      category: String(row.category || "").replace("فئة ", "").trim() || "-",
      status: statusMap[status] || status,
      code: row.code || "",
      notes: row.notes || ""
    };
  }

  async function listTeamsPublic() {
    try {
      const rows = await rpc("list_teams_public", {});
      return (Array.isArray(rows) ? rows : []).map(normalizeTeamRecord);
    } catch (error) {
      if (!isMissingRpc(error)) throw error;
    }
    const client = createSupabaseClient();
    const { data, error: qErr } = await client
      .from("teams")
      .select("id,name,category,status,code,notes,created_at")
      .in("status", ["نشط", "active", "مكتمل"])
      .order("category", { ascending: true })
      .order("name", { ascending: true });
    if (qErr) throw qErr;
    return (Array.isArray(data) ? data : []).map(normalizeTeamRecord);
  }

  function matchStatusLabel(status) {
    const map = {
      upcoming: "قادمة",
      live: "جارية",
      finished: "منتهية",
      draft: "مسودة",
      cancelled: "ملغاة"
    };
    return map[String(status || "").trim()] || status || "قادمة";
  }

  function normalizeMatchRecord(row) {
    if (!row) return null;
    const st = String(row.status || "upcoming").trim();
    const h = row.home_score;
    const a = row.away_score;
    const hasScore = h !== null && h !== undefined && a !== null && a !== undefined;
    return {
      id: row.id,
      homeTeam: row.home_team || "أكاديمية المسارحة",
      awayTeam: row.away_team || "",
      homeScore: h,
      awayScore: a,
      scoreLabel: hasScore ? `${h} - ${a}` : st === "upcoming" ? "—" : "—",
      matchAt: row.match_at || null,
      venue: row.venue || "",
      competition: row.competition || "",
      status: st,
      statusLabel: matchStatusLabel(st),
      scorersNote: row.scorers_note || "",
      playerOfMatch: row.player_of_match || "",
      stats: row.stats && typeof row.stats === "object" ? row.stats : {},
      videoUrl: row.video_url || "",
      featured: !!row.is_featured
    };
  }

  async function listMatchesPublic() {
    try {
      const rows = await rpc("list_matches_public", {});
      return (Array.isArray(rows) ? rows : []).map(normalizeMatchRecord);
    } catch (error) {
      if (!isMissingRpc(error)) throw error;
    }
    const client = createSupabaseClient();
    const { data, error: qErr } = await client
      .from("matches")
      .select(
        "id,home_team,away_team,home_score,away_score,match_at,venue,competition,status,is_featured,created_at"
      )
      .in("status", ["upcoming", "live", "finished"])
      .order("match_at", { ascending: true });
    if (qErr) throw qErr;
    return (Array.isArray(data) ? data : []).map(normalizeMatchRecord);
  }

  async function getMatchPublic(matchId) {
    const id = String(matchId || "").trim();
    if (!id) return null;
    try {
      const rows = await rpc("get_match_public", { p_id: id });
      const row = Array.isArray(rows) && rows.length ? rows[0] : null;
      return normalizeMatchRecord(row);
    } catch (error) {
      if (!isMissingRpc(error)) throw error;
    }
    const client = createSupabaseClient();
    const { data, error: qErr } = await client
      .from("matches")
      .select("*")
      .eq("id", id)
      .in("status", ["upcoming", "live", "finished"])
      .maybeSingle();
    if (qErr) throw qErr;
    return normalizeMatchRecord(data);
  }

  async function listMatchesFeatured(limit) {
    const lim = Math.max(1, Number(limit) || 1);
    const all = await listMatchesPublic();
    const featured = all.filter((m) => m.featured);
    const pick = featured.length ? featured : all.filter((m) => m.status === "finished").slice(0, 1);
    return pick.slice(0, lim);
  }

  function normalizeNewsRecord(row) {
    if (!row) return null;
    return {
      id: row.id,
      title: row.title || "",
      summary: row.summary || "",
      body: row.body || row.summary || "",
      category: row.category || "",
      emoji: row.emoji || "📰",
      imageUrl: row.image_url || "",
      publishedAt: row.published_at || null,
      featured: !!row.is_featured
    };
  }

  function isLaunchTestNews(row) {
    const title = String(row?.title ?? "").trim();
    if (!title) return false;
    if (title === "اختبار") return true;
    if (/^اختبار$/i.test(title)) return true;
    return false;
  }

  function filterPublicNews(rows) {
    return (Array.isArray(rows) ? rows : [])
      .filter((row) => !isLaunchTestNews(row))
      .map(normalizeNewsRecord);
  }

  async function listNewsPublic() {
    try {
      const rows = await rpc("list_news_public", {});
      return filterPublicNews(rows);
    } catch (error) {
      if (!isMissingRpc(error)) throw error;
    }
    const client = createSupabaseClient();
    const { data, error: qErr } = await client
      .from("academy_news")
      .select("id,title,summary,body,category,emoji,image_url,published_at,is_featured,created_at")
      .eq("status", "published")
      .order("is_featured", { ascending: false })
      .order("published_at", { ascending: false });
    if (qErr) throw qErr;
    return filterPublicNews(data);
  }

  async function getNewsPublic(newsId) {
    const id = String(newsId || "").trim();
    if (!id) return null;
    try {
      const rows = await rpc("get_news_public", { p_id: id });
      const row = Array.isArray(rows) && rows.length ? rows[0] : null;
      if (isLaunchTestNews(row)) return null;
      return normalizeNewsRecord(row);
    } catch (error) {
      if (!isMissingRpc(error)) throw error;
    }
    const client = createSupabaseClient();
    const { data, error: qErr } = await client
      .from("academy_news")
      .select("id,title,summary,body,category,emoji,image_url,published_at,is_featured,created_at")
      .eq("id", id)
      .eq("status", "published")
      .maybeSingle();
    if (qErr) throw qErr;
    if (isLaunchTestNews(data)) return null;
    return normalizeNewsRecord(data);
  }

  function normalizeMediaRecord(row) {
    if (!row) return null;
    return {
      id: row.id,
      title: row.title || "",
      description: row.description || "",
      mediaType: row.media_type || "photo",
      emoji: row.emoji || (row.media_type === "video" ? "▶" : "📷"),
      imageUrl: row.image_url || "",
      videoUrl: row.video_url || "",
      publishedAt: row.published_at || null,
      featured: !!row.is_featured,
      sortOrder: row.sort_order ?? 0
    };
  }

  async function listMediaPublic() {
    try {
      const rows = await rpc("list_media_public", {});
      return (Array.isArray(rows) ? rows : []).map(normalizeMediaRecord);
    } catch (error) {
      if (!isMissingRpc(error)) throw error;
    }
    const client = createSupabaseClient();
    const { data, error: qErr } = await client
      .from("academy_media")
      .select("id,title,description,media_type,emoji,image_url,video_url,published_at,is_featured,sort_order,created_at")
      .eq("status", "published")
      .order("is_featured", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("published_at", { ascending: false });
    if (qErr) throw qErr;
    return (Array.isArray(data) ? data : []).map(normalizeMediaRecord);
  }

  window.normalizeTeamRecord = normalizeTeamRecord;
  window.listTeamsPublic = listTeamsPublic;
  window.matchStatusLabel = matchStatusLabel;
  window.normalizeMatchRecord = normalizeMatchRecord;
  window.listMatchesPublic = listMatchesPublic;
  window.getMatchPublic = getMatchPublic;
  window.listMatchesFeatured = listMatchesFeatured;
  window.normalizeNewsRecord = normalizeNewsRecord;
  window.listNewsPublic = listNewsPublic;
  window.getNewsPublic = getNewsPublic;
  window.normalizeMediaRecord = normalizeMediaRecord;
  window.listMediaPublic = listMediaPublic;

  function normalizeStatsSummary(row) {
    if (!row) return null;
    return {
      totalGoals: Number(row.total_goals || 0),
      totalMatches: Number(row.total_matches || 0),
      totalPlayers: Number(row.total_players || 0),
      activeScorers: Number(row.active_scorers || 0),
      topScorerName: row.top_scorer_name || "",
      topScorerGoals: Number(row.top_scorer_goals || 0),
      topAssistName: row.top_assist_name || "",
      topAssistValue: Number(row.top_assist_value || 0)
    };
  }

  function normalizeLeaderboardRow(row) {
    if (!row) return null;
    return {
      playerId: row.player_id,
      fullName: row.full_name || "",
      position: row.player_position || row.position || "—",
      metricValue: Number(row.metric_value || 0),
      rank: Number(row.rank_order || 0)
    };
  }

  async function getAcademyStatsSummaryPublic() {
    try {
      const rows = await rpc("get_academy_stats_summary_public", {});
      const row = Array.isArray(rows) && rows.length ? rows[0] : rows;
      return normalizeStatsSummary(row);
    } catch (error) {
      if (!isMissingRpc(error)) throw error;
    }
    return {
      totalGoals: 0,
      totalMatches: 0,
      totalPlayers: 0,
      activeScorers: 0,
      topScorerName: "",
      topScorerGoals: 0,
      topAssistName: "",
      topAssistValue: 0
    };
  }

  async function listPlayerLeaderboardPublic(metric) {
    const m = String(metric || "goals").trim().toLowerCase();
    try {
      const rows = await rpc("list_player_leaderboard_public", { p_metric: m });
      return (Array.isArray(rows) ? rows : []).map(normalizeLeaderboardRow);
    } catch (error) {
      if (!isMissingRpc(error)) throw error;
    }
    return [];
  }

  window.normalizeStatsSummary = normalizeStatsSummary;
  window.getAcademyStatsSummaryPublic = getAcademyStatsSummaryPublic;
  window.listPlayerLeaderboardPublic = listPlayerLeaderboardPublic;
  window.storeStatusLabel = storeStatusLabel;
  window.normalizeStoreProduct = normalizeStoreProduct;
  window.listStoreProductsPublic = listStoreProductsPublic;
  window.listStoreProductsFeatured = listStoreProductsFeatured;
  window.coachPublicCode = coachPublicCode;
  window.normalizeCoachRecord = normalizeCoachRecord;
  window.listCoachesPublic = listCoachesPublic;
  window.getCoachPublic = getCoachPublic;
  window.searchPlayersPublic = searchPlayersPublic;
})();
