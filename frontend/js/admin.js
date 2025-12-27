// Admin Panel JavaScript

let allIsletmeler = [];
const addModal = new bootstrap.Modal(document.getElementById('addIsletmeModal'));
const editModal = new bootstrap.Modal(document.getElementById('editIsletmeModal'));

// Sayfa yüklendiğinde
window.addEventListener('DOMContentLoaded', async () => {
    // Token kontrolü
    const isValid = await verifyToken();
    if (!isValid) {
        window.location.href = 'login.html';
        return;
    }

    const userData = getUserData();
    if (!userData.is_super_admin) {
        alert('Bu sayfaya erişim yetkiniz yok!');
        window.location.href = 'dashboard.html';
        return;
    }

    // Kullanıcı adını göster
    document.getElementById('adminName').textContent = userData.ad_soyad;

    // İşletmeleri yükle
    await loadIsletmeler();
});

// İşletmeleri yükle
async function loadIsletmeler() {
    const result = await apiRequest(API_CONFIG.ENDPOINTS.ADMIN_ISLETMELER, {
        method: 'GET'
    });

    if (result.success && result.data.success) {
        allIsletmeler = result.data.data;
        renderIsletmelerTable();
        updateStats();
    } else {
        showToast('İşletmeler yüklenemedi', 'error');
    }
}

// Tabloyu render et
function renderIsletmelerTable() {
    const tbody = document.getElementById('isletmelerTableBody');

    if (allIsletmeler.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-5">
                    <i class="bi bi-inbox fs-1 text-muted"></i>
                    <p class="text-muted mt-2">Henüz işletme eklenmemiş</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = allIsletmeler.map(isletme => `
        <tr>
            <td><span class="badge bg-primary">${isletme.isletme_id}</span></td>
            <td><strong>${isletme.kullanici_adi}</strong></td>
            <td>${isletme.ad_soyad}</td>
            <td><code>${isletme.bagli_tablo_adi}</code></td>
            <td>
                <small class="text-muted">
                    ${isletme.db_host}:${isletme.db_port}/${isletme.db_name}
                </small>
            </td>
            <td>${new Date(isletme.created_at).toLocaleDateString('tr-TR')}</td>
            <td>
                <button class="btn btn-sm btn-warning btn-action me-1" 
                        onclick="openEditModal(${isletme.id})">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-danger btn-action" 
                        onclick="deleteIsletme(${isletme.id}, '${isletme.kullanici_adi}')">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// İstatistikleri güncelle
function updateStats() {
    document.getElementById('totalIsletmeler').textContent = allIsletmeler.length;
    document.getElementById('activeIsletmeler').textContent = allIsletmeler.length;
}

// Yeni işletme kaydet
async function saveIsletme() {
    const formData = {
        isletme_id: document.getElementById('add_isletme_id').value.trim(),
        kullanici_adi: document.getElementById('add_kullanici_adi').value.trim(),
        ad_soyad: document.getElementById('add_ad_soyad').value.trim(),
        sifre: document.getElementById('add_sifre').value,
        bagli_tablo_adi: document.getElementById('add_bagli_tablo_adi').value.trim(),
        db_host: document.getElementById('add_db_host').value.trim(),
        db_port: parseInt(document.getElementById('add_db_port').value),
        db_name: document.getElementById('add_db_name').value.trim(),
        db_user: document.getElementById('add_db_user').value.trim(),
        db_password: document.getElementById('add_db_password').value
    };

    const result = await apiRequest(API_CONFIG.ENDPOINTS.ADMIN_ISLETME_CREATE, {
        method: 'POST',
        body: JSON.stringify(formData)
    });

    if (result.success && result.data.success) {
        showToast('İşletme başarıyla oluşturuldu', 'success');
        addModal.hide();
        document.getElementById('addIsletmeForm').reset();
        await loadIsletmeler();
    } else {
        showToast(result.data.message || 'İşletme oluşturulamadı', 'error');
    }
}

// Düzenleme modalını aç
function openEditModal(id) {
    const isletme = allIsletmeler.find(i => i.id === id);
    if (!isletme) return;

    document.getElementById('edit_id').value = isletme.id;
    document.getElementById('edit_kullanici_adi').value = isletme.kullanici_adi;
    document.getElementById('edit_ad_soyad').value = isletme.ad_soyad;
    document.getElementById('edit_bagli_tablo_adi').value = isletme.bagli_tablo_adi;
    document.getElementById('edit_db_host').value = isletme.db_host;
    document.getElementById('edit_db_port').value = isletme.db_port;
    document.getElementById('edit_db_name').value = isletme.db_name;
    document.getElementById('edit_db_user').value = isletme.db_user;
    document.getElementById('edit_db_password').value = isletme.db_password;
    document.getElementById('edit_sifre').value = '';

    editModal.show();
}

// İşletme güncelle
async function updateIsletme() {
    const id = document.getElementById('edit_id').value;
    const formData = {
        kullanici_adi: document.getElementById('edit_kullanici_adi').value.trim(),
        ad_soyad: document.getElementById('edit_ad_soyad').value.trim(),
        bagli_tablo_adi: document.getElementById('edit_bagli_tablo_adi').value.trim(),
        db_host: document.getElementById('edit_db_host').value.trim(),
        db_port: parseInt(document.getElementById('edit_db_port').value),
        db_name: document.getElementById('edit_db_name').value.trim(),
        db_user: document.getElementById('edit_db_user').value.trim(),
        db_password: document.getElementById('edit_db_password').value
    };

    const sifre = document.getElementById('edit_sifre').value;
    if (sifre) {
        formData.sifre = sifre;
    }

    const result = await apiRequest(API_CONFIG.ENDPOINTS.ADMIN_ISLETME_UPDATE(id), {
        method: 'PUT',
        body: JSON.stringify(formData)
    });

    if (result.success && result.data.success) {
        showToast('İşletme başarıyla güncellendi', 'success');
        editModal.hide();
        await loadIsletmeler();
    } else {
        showToast(result.data.message || 'İşletme güncellenemedi', 'error');
    }
}

// İşletme sil
async function deleteIsletme(id, kullaniciAdi) {
    if (!confirm(`"${kullaniciAdi}" işletmesini silmek istediğinizden emin misiniz?`)) {
        return;
    }

    const result = await apiRequest(API_CONFIG.ENDPOINTS.ADMIN_ISLETME_DELETE(id), {
        method: 'DELETE'
    });

    if (result.success && result.data.success) {
        showToast('İşletme başarıyla silindi', 'success');
        await loadIsletmeler();
    } else {
        showToast(result.data.message || 'İşletme silinemedi', 'error');
    }
}

// Toast bildirim
function showToast(message, type = 'info') {
    const toastContainer = document.createElement('div');
    toastContainer.style.position = 'fixed';
    toastContainer.style.top = '20px';
    toastContainer.style.right = '20px';
    toastContainer.style.zIndex = '9999';

    const bgColor = type === 'success' ? 'bg-success' : type === 'error' ? 'bg-danger' : 'bg-info';
    
    toastContainer.innerHTML = `
        <div class="toast show align-items-center text-white ${bgColor} border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="bi bi-${type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
        </div>
    `;

    document.body.appendChild(toastContainer);

    setTimeout(() => {
        toastContainer.remove();
    }, 3000);
}
