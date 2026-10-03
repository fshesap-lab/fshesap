document.addEventListener("DOMContentLoaded", async () => {
  // Oturum Kontrolü
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = "index.html";
    return;
  }

  loadUserData(session.user);
  loadAnnouncements();
});

async function loadUserData(user) {
  document.getElementById('user-display-email').innerText = user.email;

  // Kullanıcı profili ve şirket bilgilerini getir
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, companies(name, status)')
    .eq('id', user.id)
    .single();

  if (profile) {
    document.getElementById('company-display-name').innerText = profile.companies?.name || profile.full_name || "Müşteri Paneli";
    document.getElementById('role-badge').innerText = profile.role === 'company_owner' ? 'Şirket Sahibi' : 'Personel';
    
    const statusEl = document.getElementById('status-badge');
    if (profile.companies?.status === 'suspended') {
      statusEl.innerText = "Erişim Donduruldu";
      statusEl.className = "font-semibold text-rose-400";
    } else {
      statusEl.innerText = "Aktif";
      statusEl.className = "font-semibold text-emerald-400";
    }
  }
}

async function loadAnnouncements() {
  const now = new Date().toISOString();

  // Aktif duyuruyu çek
  const { data: announcements } = await supabase
    .from('announcements')
    .select('*')
    .eq('is_active', true)
    .gte('end_at', now)
    .order('created_at', { ascending: false })
    .limit(1);

  if (announcements && announcements.length > 0) {
    const ann = announcements[0];
    document.getElementById('ann-title-display').innerText = ann.title;
    document.getElementById('ann-content-display').innerText = ann.content;
    document.getElementById('announcement-box').classList.remove('hidden');
  }
}

async function logout() {
  await supabase.auth.signOut();
  window.location.href = "index.html";
}
