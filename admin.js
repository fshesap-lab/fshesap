// Sayfa açıldığında şirketleri yükle
document.addEventListener("DOMContentLoaded", () => {
  loadCompanies();
});

// Şirket Listesini Çekme ve Ekrana Basma
async function loadCompanies() {
  const { data: companies, error } = await supabase
    .from('companies')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Şirketler çekilemedi:", error);
    return;
  }

  const listElement = document.getElementById('company-list');
  listElement.innerHTML = '';

  let activeCount = 0;
  let passiveCount = 0;

  companies.forEach(comp => {
    if (comp.status === 'active') activeCount++;
    else passiveCount++;

    const row = document.createElement('tr');
    row.className = "hover:bg-gray-700/50 transition";
    row.innerHTML = `
      <td class="p-3 font-semibold text-white">${comp.name}</td>
      <td class="p-3">
        <span class="px-2.5 py-1 text-xs font-semibold rounded-full ${comp.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}">
          ${comp.status === 'active' ? 'Aktif' : 'Pasif/Donduruldu'}
        </span>
      </td>
      <td class="p-3 text-gray-400 text-xs">${new Date(comp.created_at).toLocaleDateString('tr-TR')}</td>
      <td class="p-3 text-right">
        <button onclick="toggleCompanyStatus('${comp.id}', '${comp.status}')" class="text-xs px-3 py-1.5 rounded-lg border ${comp.status === 'active' ? 'border-rose-500/50 text-rose-400 hover:bg-rose-500/10' : 'border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10'} transition">
          ${comp.status === 'active' ? 'Erişimi Dondur' : 'Aktif Et'}
        </button>
      </td>
    `;
    listElement.appendChild(row);
  });

  document.getElementById('total-companies').innerText = companies.length;
  document.getElementById('active-companies').innerText = activeCount;
  document.getElementById('passive-companies').innerText = passiveCount;
}

// Şirket ve İlk Kullanıcıyı Oluşturma Formu
document.getElementById('create-company-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const compName = document.getElementById('comp-name').value;
  const ownerName = document.getElementById('owner-name').value;
  const ownerEmail = document.getElementById('owner-email').value;
  const ownerPass = document.getElementById('owner-pass').value;
  const role = document.getElementById('user-role').value;

  // 1. Şirketi Veritabanına Ekle
  const { data: company, error: compError } = await supabase
    .from('companies')
    .insert([{ name: compName, status: 'active' }])
    .select()
    .single();

  if (compError) {
    alert("Şirket eklenirken hata oluştu: " + compError.message);
    return;
  }

  // 2. Kullanıcıyı Supabase Auth Sistemine Kaydet
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: ownerEmail,
    password: ownerPass,
  });

  if (authError) {
    alert("Kullanıcı oluşturulurken hata: " + authError.message);
    return;
  }

  // 3. Kullanıcı Profilini Şirket ile Bağla
  const { error: profileError } = await supabase
    .from('profiles')
    .insert([{
      id: authData.user.id,
      company_id: company.id,
      full_name: ownerName,
      role: role
    }]);

  if (profileError) {
    alert("Profil bağlanırken hata: " + profileError.message);
    return;
  }

  alert("Şirket ve Müşteri Hesabı Başarıyla Oluşturuldu!");
  document.getElementById('create-company-form').reset();
  loadCompanies();
});

// Şirket Dondurma / Aktif Etme İşlemi (Ödeme yapmayan müşteriyi durdurma)
async function toggleCompanyStatus(companyId, currentStatus) {
  const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
  
  const { error } = await supabase
    .from('companies')
    .update({ status: newStatus })
    .eq('id', companyId);

  if (error) {
    alert("Güncelleme başarısız: " + error.message);
    return;
  }

  loadCompanies();
}

// Pop-Up Duyuru Ekleme
document.getElementById('announcement-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const title = document.getElementById('ann-title').value;
  const content = document.getElementById('ann-content').value;
  const endAt = document.getElementById('ann-end').value;

  const { error } = await supabase
    .from('announcements')
    .insert([{
      title: title,
      content: content,
      start_at: new Date().toISOString(),
      end_at: new Date(endAt).toISOString(),
      is_active: true
    }]);

  if (error) {
    alert("Duyuru yayınlanamadı: " + error.message);
    return;
  }

  alert("Duyuru başarıyla yayınlandı! Belirttiğin tarihe kadar müşterilerin ekranında görünecek.");
  document.getElementById('announcement-form').reset();
});

function logout() {
  supabase.auth.signOut();
  window.location.href = "index.html";
}
