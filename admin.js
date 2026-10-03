document.addEventListener("DOMContentLoaded", async () => {
  // 1. Verileri Yükle
  loadCompanies();
  loadAnnouncements();

  // 2. Şirket Ekleme Formu
  const companyForm = document.getElementById('company-form');
  if (companyForm) {
    companyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const btn = document.getElementById('company-submit-btn');
      btn.innerText = "Kaydediliyor...";
      btn.disabled = true;

      const name = document.getElementById('company-name').value.trim();
      const fullName = document.getElementById('company-user-name').value.trim();
      const email = document.getElementById('company-email').value.trim();
      const password = document.getElementById('company-password').value;

      try {
        // A. Kullanıcı Kaydı (Auth)
        const { data: authData, error: authError } = await supabaseApp.auth.signUp({
          email: email,
          password: password,
          options: {
            data: { full_name: fullName }
          }
        });

        if (authError) throw authError;

        // B. Şirket Kaydı
        const { data: companyData, error: companyError } = await supabaseApp
          .from('companies')
          .insert([{ name: name, status: 'active' }])
          .select()
          .single();

        if (companyError) throw companyError;

        // C. Profil Eşleştirme
        if (authData.user) {
          await supabaseApp
            .from('profiles')
            .upsert({
              id: authData.user.id,
              full_name: fullName,
              company_id: companyData.id,
              role: 'company_owner'
            });
        }

        alert("Şirket ve kullanıcı başarıyla eklendi!");
        companyForm.reset();
        loadCompanies();

      } catch (err) {
        console.error("Hata:", err);
        alert("Hata: " + (err.message || "İşlem yapılamadı."));
      } finally {
        btn.innerText = "Hesap Oluştur ve Şirketi Kaydet";
        btn.disabled = false;
      }
    });
  }

  // 3. Duyuru Ekleme Formu
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
        alert("Duyuru Hatası: " + err.message);
      }
    });
  }
});

// Şirketleri Getir
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
      listEl.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-gray-400">Henüz kayıtlı şirket yok.</td></tr>`;
      return;
    }

    listEl.innerHTML = companies.map(c => `
      <tr class="border-b border-gray-700/50 hover:bg-gray-750">
        <td class="p-3 font-medium text-white">${c.name}</td>
        <td class="p-3">
          <span class="px-2 py-0.5 rounded text-xs font-semibold ${c.status === 'active' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-rose-900/50 text-rose-400'}">
            ${c.status === 'active' ? 'Aktif' : 'Pasif'}
          </span>
        </td>
        <td class="p-3 text-gray-400 text-xs">${new Date(c.created_at).toLocaleDateString('tr-TR')}</td>
        <td class="p-3">
          <button onclick="toggleCompanyStatus('${c.id}', '${c.status}')" class="text-xs text-blue-400 hover:underline">
            ${c.status === 'active' ? 'Pasife Al' : 'Aktif Et'}
          </button>
        </td>
      </tr>
    `).join('');

  } catch (err) {
    listEl.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-rose-400">Veri çekilemedi.</td></tr>`;
  }
}

// Duyuruları Getir
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
      listEl.innerHTML = `<p class="text-gray-400 text-center py-4 text-xs">Henüz duyuru yok.</p>`;
      return;
    }

    listEl.innerHTML = announcements.map(a => `
      <div class="bg-gray-900/60 p-3 rounded-xl border border-gray-700/50">
        <div class="flex justify-between items-center mb-1">
          <h4 class="font-bold text-white text-xs">${a.title}</h4>
          <span class="text-[10px] text-gray-400">${new Date(a.created_at).toLocaleDateString('tr-TR')}</span>
        </div>
        <p class="text-gray-300 text-xs mb-2">${a.content}</p>
        <button onclick="deleteAnnouncement('${a.id}')" class="text-[10px] text-rose-400 hover:underline">Sil</button>
      </div>
    `).join('');

  } catch (err) {
    console.error(err);
  }
}

// Şirket Durumu Değiştir
async function toggleCompanyStatus(id, currentStatus) {
  const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
  const { error } = await supabaseApp.from('companies').update({ status: newStatus }).eq('id', id);
  if (!error) loadCompanies();
}

// Duyuru Sil
async function deleteAnnouncement(id) {
  if (confirm("Bu duyuru silinsin mi?")) {
    const { error } = await supabaseApp.from('announcements').delete().eq('id', id);
    if (!error) loadAnnouncements();
  }
}

// Çıkış Yap
async function logout() {
  await supabaseApp.auth.signOut();
  window.location.href = "index.html";
}
