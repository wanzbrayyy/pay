
function copyApiKey() {
  const apiKey = document.getElementById('apikey')?.innerText;
  if (!apiKey) return;

  navigator.clipboard.writeText(apiKey).then(() => {
    const btn = event.target;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check"></i> Disalin!';
    btn.classList.remove('btn-accent');
    btn.classList.add('btn-primary');
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.classList.add('btn-accent');
      btn.classList.remove('btn-primary');
    }, 2000);
  }).catch(err => {
    console.error('Gagal menyalin:', err);
  });
}
document.addEventListener('DOMContentLoaded', () => {
  const profileBtn = document.querySelector('.profile-btn');
  const dropdown = document.querySelector('.profile-dropdown');

  if (profileBtn && dropdown) {
    profileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('show');
    });

    // Tutup dropdown saat klik di luar
    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target) && e.target !== profileBtn) {
        dropdown.classList.remove('show');
      }
    });
  }
});