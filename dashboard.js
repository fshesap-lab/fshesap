// Supabase İstemcisini Getir
function getSupabase() {
  if (typeof supabaseApp !== 'undefined') return supabaseApp;
  if (typeof supabase !== 'undefined' && typeof SUPABASE_URL !== 'undefined') {
    return supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  console.error("Supabase istemcisi bulunamadı!");
  return null;
}

document.addEventListener("DOMContentLoaded", async () => {
  const client = getSupabase();

  if (!client) {
    alert("Supabase bağlantısı kurulamadı!");
    return;
  }

  // 1. Kullanıcı Oturumunu Kontrol Et
  const { data: { session } } = await client.auth.getSession();

  if (!session) {
    // Oturum yoksa giriş sayfasına yönlendir
    window.location.href = "index.html";
    return;
  }

  // 2. Kullanıcı Profil ve Şirket Bilgilerini Çek
  await loadUserProfile(client, session.user);

  // 3. Duyuruları Yükle
  await loadAnnouncements(client);
});

// Kullanıcı Profilini ve Şirket Adını Yükleme
async function loadUserProfile(client, user) {
  try {
    const { data: profile, error } = await client
      .from('profiles')
      .select('full_name, role, company_id, companies(name)')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Profil çekme hatası:", error);
    }

    const fullNameEl = document.getElementById('user-fullname');
    const companyNameEl = document.getElementById('user-company-name');

    if (profile) {
      if (fullNameEl) fullNameEl.innerText = profile.full_name || user.email;
      if (companyNameEl && profile.companies) {
        companyNameEl.innerText = profile.companies.name;
      } else if (companyNameEl) {
        companyNameEl.innerText = "Müşteri Paneli";
      }
    } else {
      if (fullNameEl) fullNameEl.innerText = user.email;
    }

  } catch (err) {
    console.error("Profil bilgisi işleme hatası:", err);
  }
}

// Sistem Duyurularını Yükleme
async function loadAnnouncements(client) {
  const listEl = document.getElementById('dashboard-announcements-list');
  const countEl = document.getElementById('announcement-count');

  if (!listEl) return;

  try {
    const { data: announcements, error } = await client
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!announcements || announcements.length === 0) {
      listEl.innerHTML = `
        <div class="bg-gray-900/40 p-6 rounded-2xl border border-gray-800 text-center">
          <p class="text-gray-400 text-sm">Aktif yayınlanmış herhangi bir duyuru bulunmuyor.</p>
        </div>`;
      if (countEl) countEl.innerText = "0 Duyuru";
      return;
    }

    if (countEl) countEl.innerText = `${announcements.length} Duyuru`;

    listEl.innerHTML = announcements.map(a => `
      <div class="bg-gray-900/80 border border-gray-800 rounded-2xl p-5 shadow-lg space-y-2 hover:border-gray-700 transition duration-200">
        <div class="flex justify-between items-start gap-4">
          <h4 class="font-bold text-white text-sm sm:text-base leading-snug">${a.title}</h4>
          <span class="text-[11px] text-emerald-400 bg-emerald-950/80 border border-emerald-800/50 px-2 py-0.5 rounded-full whitespace-nowrap">
            ${new Date(a.created_at).toLocaleDateString('tr-TR')}
          </span>
        </div>
        <p class="text-gray-300 text-xs sm:text-sm leading-relaxed">${a.content}</p>
      </div>
    `).join('');

  } catch (err) {
    console.error("Duyurular yüklenirken hata:", err);
    listEl.innerHTML = `<div class="bg-rose-950/30 border border-rose-800/40 p-4 rounded-xl text-rose-300 text-sm text-center">Duyurular yüklenirken bir sorun oluştu.</div>`;
  }
}

// Fatura Gecikme Zammı Hesaplama Fonksiyonu
function calculateDelayFee() {
  const amount = parseFloat(document.getElementById('calc-amount').value);
  const days = parseInt(document.getElementById('calc-days').value);
  const monthlyRate = parseFloat(document.getElementById('calc-rate').value);

  if (isNaN(amount) || amount <= 0 || isNaN(days) || days <= 0 || isNaN(monthlyRate)) {
    alert("Lütfen geçerli tutar ve gün sayısı giriniz.");
    return;
  }

  // Günlük faiz oranı = (Aylık Oran / 100) / 30
  const dailyRate = (monthlyRate / 100) / 30;
  const fee = amount * dailyRate * days;
  const total = amount + fee;

  document.getElementById('res-base').innerText = amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL';
  document.getElementById('res-fee').innerText = fee.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL';
  document.getElementById('res-total').innerText = total.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL';

  document.getElementById('calc-result').classList.remove('hidden');
}

// Çıkış Yap
async function logout() {
  const client = getSupabase();
  if (client) await client.auth.signOut();
  window.location.href = "index.html";
}
