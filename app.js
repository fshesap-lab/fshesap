// Oturum Açma İşlemi
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    alert("Giriş başarısız: " + error.message);
    return;
  }

  alert("Giriş Başarılı! Yönetim paneline yönlendiriliyorsunuz.");
});
