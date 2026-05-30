/**
 * صورة اللاعب — من players.image أو مرفقات request_completions
 */
(function () {
  function directImage(player) {
    if (!player) return "";
    const v = player.image || player.photo_url || player.personal_photo_url || "";
    return String(v || "").trim();
  }

  function resolvePlayerImageUrl(player) {
    return directImage(player);
  }

  function requestIdFromPlayer(player) {
    return player?.source_request_id || player?.request_id || null;
  }

  function requestIdFromCompletionRow(row) {
    return row?.request_id || row?.join_request_id || null;
  }

  async function fetchPhotoMap(sb, requestIds) {
    const ids = [...new Set((requestIds || []).map(String).filter(Boolean))];
    if (!ids.length || !sb) return {};
    const { data, error } = await sb
      .from("request_completions")
      .select("request_id,personal_photo_url")
      .in("request_id", ids);
    if (error) {
      console.warn("[player-image] completion fetch:", error.message);
      return {};
    }
    const map = {};
    (data || []).forEach((row) => {
      const url = String(row.personal_photo_url || "").trim();
      const rid = requestIdFromCompletionRow(row);
      if (url && rid) map[String(rid)] = url;
    });
    return map;
  }

  async function persistPlayerImage(sb, playerId, url) {
    if (!sb || !playerId || !url) return;
    void sb
      .from("players")
      .update({ image: url, updated_at: new Date().toISOString() })
      .eq("id", playerId);
  }

  async function enrichPlayersWithPhotos(sb, players, options) {
    const list = Array.isArray(players) ? players : [];
    const needIds = list
      .filter((p) => !directImage(p) && requestIdFromPlayer(p))
      .map((p) => requestIdFromPlayer(p));
    const map = await fetchPhotoMap(sb, needIds);
    const persist = options?.persist !== false;
    list.forEach((p) => {
      if (directImage(p)) return;
      const rid = requestIdFromPlayer(p);
      const url = rid ? map[String(rid)] : "";
      if (!url) return;
      p.image = url;
      if (persist && p.id) persistPlayerImage(sb, p.id, url);
    });
    return list;
  }

  async function resolvePlayerPhoto(sb, player, options) {
    if (!player) return "";
    const direct = directImage(player);
    if (direct) return direct;
    const reqId = requestIdFromPlayer(player);
    if (!reqId || !sb) return "";
    const map = await fetchPhotoMap(sb, [reqId]);
    const url = map[String(reqId)] || "";
    if (url) {
      player.image = url;
      if (options?.persist !== false && player.id) {
        persistPlayerImage(sb, player.id, url);
      }
    }
    return url;
  }

  async function playerPhotoFromRequest(sb, request) {
    if (!request) return null;
    const direct = request.personal_photo_url || request.image || null;
    if (direct && String(direct).trim()) return String(direct).trim();
    if (!sb || !request.id) return null;
    const map = await fetchPhotoMap(sb, [request.id]);
    return map[String(request.id)] || null;
  }

  function formatPlayerDisplayNumber(player) {
    if (typeof formatPlayerPublicNumber === "function") {
      return formatPlayerPublicNumber(player);
    }
    if (!player) return "—";
    const shirt = player.shirt_number ?? player.shirtNumber;
    const n = String(shirt ?? "").trim();
    return /^\d{1,3}$/.test(n) ? n : "—";
  }

  window.resolvePlayerImageUrl = resolvePlayerImageUrl;
  window.enrichPlayersWithPhotos = enrichPlayersWithPhotos;
  window.resolvePlayerPhoto = resolvePlayerPhoto;
  window.playerPhotoFromRequest = playerPhotoFromRequest;
  window.formatPlayerDisplayNumber = formatPlayerDisplayNumber;
})();
