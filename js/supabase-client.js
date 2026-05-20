(function () {
  let _client = null;

  function getConfig() {
    const cfg = window.SUPABASE_CONFIG || {};
    return {
      url: cfg.url || "",
      anonKey: cfg.anonKey || cfg.anon_key || ""
    };
  }

  function createSupabaseClient() {
    if (_client) return _client;
    if (!window.supabase || typeof window.supabase.createClient !== "function") {
      throw new Error("Supabase JS library is not loaded.");
    }
    const { url, anonKey } = getConfig();
    if (!url || !anonKey) {
      throw new Error("Missing SUPABASE_CONFIG.url or SUPABASE_CONFIG.anonKey.");
    }
    _client = window.supabase.createClient(url, anonKey);
    return _client;
  }

  window.getSupabaseConfig = getConfig;
  window.createSupabaseClient = createSupabaseClient;
})();
