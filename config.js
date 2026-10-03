// FSHesap Sistem Konfigürasyonu
const CONFIG = {
  appName: "FSHesap",
  version: "1.0.0",
  api: {
    supabaseUrl: "https://jdqnjxacnwmmomvvwmxy.supabase.co",
    supabaseAnonKey: "sb_publishable_X-Yddnv-jw86JsRJuyqXTO_i_piqZ9W"
  },
  supportEmail: "info@fshesap.com"
};

// Supabase Bağlantısı
const supabase = window.supabase.createClient(CONFIG.api.supabaseUrl, CONFIG.api.supabaseAnonKey);
