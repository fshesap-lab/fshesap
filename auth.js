document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById('login-form');
  
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const errorEl = document.getElementById('login-error');
      const btn = document.getElementById('login-btn');

      errorEl.classList.add('hidden');
      btn.innerText = "Giriş yapılıyor...";
      btn.disabled = true;

      // Supabase Giriş İsteği
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        errorEl.innerText = "Giriş başarısız: " + error.message;
        errorEl.classList.remove('hidden');
        btn.innerText = "Giriş Yap";
        btn.disabled = false;
        return;
      }

      // Kullanıcının profilini ve rolünü sorgula
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      // Rol kontrolüne göre yönlendirme
      if (profile && profile.role === 'super_admin') {
        window.location.href = "admin.html";
      } else {
        window.location.href = "dashboard.html";
      }
    });
  }
});
