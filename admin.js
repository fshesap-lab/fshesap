// admin.js - Oturum, Güvenlik ve Veri Yönetimi

document.addEventListener("DOMContentLoaded", async () => {
  await checkAuth();
});

// 1. Oturum Kontrolü
async function checkAuth() {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    console.warn("Aktif oturum bulunamadı, test görünümü yüklendi.");
    initAdminDashboard({ email: "admin@fshesap.com" });
    return;
  }

  initAdminDashboard(session.user);
}

// 2. Çıkış Yap
async function handleLogout() {
  await supabase.auth.signOut();
  window.location.href = "index.html";
}

// 3. Panel Başlatıcı
function initAdminDashboard(user) {
  const userEmailEl = document.getElementById("admin-user-email");
  if (userEmailEl) userEmailEl.textContent = user.email;

  // Tablo verilerini getir
  loadDashboardData();
}

// 4. Supabase'den Verileri Listeleme
async function loadDashboardData() {
  const tbody = document.getElementById("accounts-table-body");
  if (!tbody) return;
  
  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Veriler yükleniyor...</td></tr>`;

  const { data: accounts, error } = await supabase
    .from("accounts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Veri çekme hatası:", error);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">Veriler alınamadı: ${error.message}</td></tr>`;
    return;
  }

  if (!accounts || accounts.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Henüz kayıtlı bir hesap yok.</td></tr>`;
    return;
  }

  tbody.innerHTML = accounts.map(acc => `
    <tr>
      <td>${acc.id}</td>
      <td><strong>${acc.title || "-"}</strong></td>
      <td>${acc.email || "-"}</td>
      <td><mark>${acc.plan || "Free"}</mark></td>
      <td>
        <span style="color: ${acc.status === 'active' ? 'green' : acc.status === 'pending' ? 'orange' : 'red'}; font-weight: bold;">
          ${acc.status ? acc.status.toUpperCase() : "BİLİNMİYOR"}
        </span>
      </td>
      <td>
        <button onclick="deleteAccount('${acc.id}')" class="secondary outline" style="padding: 2px 8px; font-size: 0.8rem; margin: 0;">Sil</button>
      </td>
    </tr>
  `).join("");
}

// 5. Yeni Kayıt Ekleme
async function handleAddAccount(event) {
  event.preventDefault();

  const title = document.getElementById("title").value;
  const email = document.getElementById("email").value;
  const plan = document.getElementById("plan").value;
  const status = document.getElementById("status").value;

  const { error } = await supabase
    .from("accounts")
    .insert([{ title, email, plan, status }]);

  if (error) {
    alert("Ekleme hatası: " + error.message);
  } else {
    closeAddModal();
    document.getElementById("add-account-form").reset();
    loadDashboardData();
  }
}

// 6. Kayıt Silme
async function deleteAccount(id) {
  if (!confirm("Bu hesabı silmek istediğinize emin misiniz?")) return;

  const { error } = await supabase
    .from("accounts")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Silme hatası: " + error.message);
  } else {
    loadDashboardData();
  }
}

// Modal Açma / Kapama Kontrolleri
function openAddModal() {
  document.getElementById("account-modal").setAttribute("open", "true");
}

function closeAddModal() {
  document.getElementById("account-modal").removeAttribute("open");
}
