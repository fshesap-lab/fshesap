document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById('login-form');
  
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const errorEl = document.getElementById('login-error');
      const btn = document.getElementById('login-btn');

      if (errorEl) {
        errorEl.classList.add('hidden');
        errorEl.innerText = '';
      }
      btn.innerText = "Giriş yapılıyor...";
      btn.disabled = true;

      try {
        // 1. Giriş yapma
        const { data, error } = await supabaseApp.auth.signInWithPassword({
          email: email,
          password: password,
        });

        if (error) throw error;

        // 2. Rol kontrolü yapma
        const { data: profile, error: profileError } = await supabaseApp
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle();

        if (profileError) console.error("Profil hatası:", profileError);

        // 3. Yönlendirme
        if (profile && profile.role === 'super_admin') {
          window.location.href = "admin.html";
        } else {
          window.location.href = "dashboard.html";
        }

      } catch (err) {
        console.error("Giriş Hatası:", err);
        if (errorEl) {
          errorEl.innerText = "Giriş Başarısız: " + (err.message || "E-posta veya şifre hatalı.");
          errorEl.classList.remove('hidden');
        } else {
          alert("Giriş Başarısız: " + (err.message || "E-posta veya şifre hatalı."));
        }
        btn.innerText = "Giriş Yap";
        btn.disabled = false;
      }
    });
  }
});
