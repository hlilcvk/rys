// Login sayfası için JavaScript

const loginForm = document.getElementById('loginForm');
const kullaniciAdiInput = document.getElementById('kullaniciAdi');
const sifreInput = document.getElementById('sifre');
const loginBtn = document.getElementById('loginBtn');
const loginBtnText = document.getElementById('loginBtnText');
const loginBtnSpinner = document.getElementById('loginBtnSpinner');
const alertContainer = document.getElementById('alertContainer');

// Sayfa yüklendiğinde token kontrolü
window.addEventListener('DOMContentLoaded', async () => {
    const isValid = await verifyToken();
    if (isValid) {
        const userData = getUserData();
        if (userData.is_super_admin) {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'dashboard.html';
        }
    }
});

// Alert gösterme fonksiyonu
function showAlert(message, type = 'danger') {
    alertContainer.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            <i class="bi bi-${type === 'danger' ? 'exclamation-circle' : 'check-circle'} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
}

// Form submit
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const kullaniciAdi = kullaniciAdiInput.value.trim();
    const sifre = sifreInput.value;

    if (!kullaniciAdi || !sifre) {
        showAlert('Lütfen tüm alanları doldurun');
        return;
    }

    // Button durumunu değiştir
    loginBtn.disabled = true;
    loginBtnText.classList.add('d-none');
    loginBtnSpinner.classList.remove('d-none');

    try {
        const result = await apiRequest(API_CONFIG.ENDPOINTS.LOGIN, {
            method: 'POST',
            body: JSON.stringify({ kullanici_adi: kullaniciAdi, sifre })
        });

        if (result.success && result.data.success) {
            // Token'ı kaydet
            setAuthToken(result.data.token);
            setUserData(result.data.user);

            showAlert('Giriş başarılı! Yönlendiriliyorsunuz...', 'success');

            // Kullanıcı tipine göre yönlendir
            setTimeout(() => {
                if (result.data.user.is_super_admin) {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
            }, 1000);
        } else {
            showAlert(result.data.message || 'Giriş başarısız');
            loginBtn.disabled = false;
            loginBtnText.classList.remove('d-none');
            loginBtnSpinner.classList.add('d-none');
        }
    } catch (error) {
        showAlert('Bir hata oluştu. Lütfen tekrar deneyin.');
        loginBtn.disabled = false;
        loginBtnText.classList.remove('d-none');
        loginBtnSpinner.classList.add('d-none');
    }
});

// Enter tuşu ile form gönderimi
sifreInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        loginForm.dispatchEvent(new Event('submit'));
    }
});
