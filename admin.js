document.addEventListener("DOMContentLoaded", async () => {
  // 1. Yetki Kontrolü
  await checkAdminAuth();

  // 2. Verileri Yükle
  loadCompanies();
  loadAnnouncements();

  // 3. Şirket Ekleme Formu
  const companyForm = document.getElementById('company-form');
  if (companyForm) {
    companyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = document.getElementById('company-name').value.trim();
      const fullName = document.getElementById('company-user-name').value.trim();
      const email = document.getElementById('company-email').value.trim();
      const password = document.getElementById('company-password').value;
      const period = document.getElementById('company-period').value;

      try {
        // A. Kullanıcı Oluştur (Auth)
        const { data: authData, error: authError } = await supabaseApp.auth.signUp({
          email: email,
          password: password,
          options: {
            data: { full_name: fullName }
          }
        });

        if (authError) throw authError;

        // B. Şirket Kaydı Oluştur
        const { data: companyData, error: companyError } = await supabaseApp
          .from('companies')
          .insert([{ 
            name: name,
            status: 'active'
          }])
          .select()
          .single();

        if (companyError) throw companyError;

        // C. Profil Güncelle / Bağla
        if (authData.user) {
          const { error: profileError } = await supabaseApp
            .from('profiles')
            .upsert({
              id: authData.user.id,
              full_name: fullName,
              company_id: companyData.id,
              role: 'client'
            });

          if (profileError) console.error("Profil güncelleme hatası:", profileError);
        }

        alert("Şirket ve kullanıcı başarıyla eklendi!");
        companyForm.reset();
        loadCompanies();

      } catch (err) {
        console.error("Şirket Ekleme Hatası:", err);
        alert("Hata oluştu: " + (err.message || "İşlem tamamlanamadı."));
      }
    });
  }

  // 4. Duyuru Ekleme Formu
  const announcementForm = document.getElementById('announcement-form');
  if (announcementForm) {
    announcementForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const title = document.getElementById('announcement-title').value.trim();
      const content = document.getElementById('announcement-content').value.trim();

      try {
        const { error } = await supabaseApp
          .from('announcements')
          .insert([{ title, content, is_active: true }]);

        if (error) throw error;

        alert("Duyuru başarıyla yayınlandı!");
        announcementForm.reset();
        loadAnnouncements();

      } catch (err) {
        console.error("Duyuru Ekleme Hatası:", err);
        alert("Duyuru eklenirken hata oluştu: " + err.message);
      }
    });
  }
});

// Admin Oturum Kontrolü
async function checkAdminAuth() {
  const { data: { session } } = await supabaseApp.auth.getSession();
  if (!session) {
    window.location.href = "index.html";
    return;
  }

  const { data: profile } = await supabaseApp
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .maybeSingle();

  if (!profile || profile.role !== 'super_admin') {
    alert("Bu sayfaya erişim yetkiniz yok.");
    window.location.href = "index.html";
  }
}

// Şirketleri Listele
async function loadCompanies() {
  const listEl = document.getElementById('companies-list');
  if (!listEl) return;

  try {
    const { data: companies, error } = await supabaseApp
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!companies || companies.length === 0) {
      listEl.innerHTML = `<tr><td colspan="4" class="px-6 py-4 text-center text-gray-400">Henüz kayıtlı şirket yok.</td></tr>`;
      return;
    }

    listEl.innerHTML = companies.map(c => `
      <tr class="border-b border-gray-700 hover:bg-gray-750">
        <td class="px-6 py-4 font-medium text-white">${c.name}</td>
        <td class="px-6 py-4">
          <span class="px-2.5 py-1 rounded-full text-xs font-medium ${c.status === 'active' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}">
            ${c.status === 'active' ? 'Aktif' : 'Pasif'}
          </span>
        </td>
        <td class="px-6 py-4 text-gray-400 text-sm">${new Date(c.created_at).toLocaleDateString('tr-TR')}</td>
        <td class="px-6 py-4">
          <button onclick="toggleCompanyStatus('${c.id}', '${c.status}')" class="text-sm text-indigo-400 hover:text-indigo-300">
            ${c.status === 'active' ? 'Pasife Al' : 'Aktif Et'}
          </button>
        </td>
      </tr>
    `).join('');

  } catch (err) {
    console.error("Şirket listesi hatası:", err);
    listEl.innerHTML = `<tr><td colspan="4" class="px-6 py-4 text-center text-red-400">Veriler yüklenirken hata oluştu.</td></tr>`;
  }
}

// Duyuruları Listele
async function loadAnnouncements() {
  const listEl = document.getElementById('announcements-list');
  if (!listEl) return;

  try {
    const { data: announcements, error } = await supabaseApp
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!announcements || announcements.length === 0) {
      listEl.innerHTML = `<p class="text-gray-400 text-center py-4">Henüz duyuru yok.</p>`;
      return;
    }

    listEl.innerHTML = announcements.map(a => `
      <div class="bg-gray-800 p-4 rounded-xl border border-gray-700 mb-3">
        <div class="flex justify-between items-start mb-2">
          <h4 class="font-bold text-white">${a.title}</h4>
          <span class="text-xs text-gray-400">${new Date(a.created_at).toLocaleDateString('tr-TR')}</span>
        </div>
        <p class="text-gray-300 text-sm mb-3">${a.content}</p>
        <button onclick="deleteAnnouncement('${a.id}')" class="text-xs text-red-400 hover:underline">Duyuruyu Sil</button>
      </div>
    `).join('');

  } catch (err) {
    console.error("Duyuru listesi hatası:", err);
  }
}

// Şirket Durumu Değiştirme
async function toggleCompanyStatus(id, currentStatus) {
  const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
  const { error } = await supabaseApp.from('companies').update({ status: newStatus }).eq('id', id);
  if (!error) loadCompanies();
}

// Duyuru Silme
async function deleteAnnouncement(id) {
  if (confirm("Bu duyuruyu silmek istediğinize emin misiniz?")) {
    const { error } = await supabaseApp.from('announcements').delete().eq('id', id);
    if (!error) loadAnnouncements();
  }
}
