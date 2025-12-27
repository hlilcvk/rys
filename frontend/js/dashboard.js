// Dashboard JavaScript - Dinamik Takvim Sistemi

let appointments = [];
let calismaOdalari = [];
let currentDate = new Date();
let sortableInstances = [];

const addModal = new bootstrap.Modal(document.getElementById('addAppointmentModal'));
const editModal = new bootstrap.Modal(document.getElementById('editAppointmentModal'));

// Sayfa yüklendiğinde
window.addEventListener('DOMContentLoaded', async () => {
    // Token kontrolü
    const isValid = await verifyToken();
    if (!isValid) {
        window.location.href = 'login.html';
        return;
    }

    const userData = getUserData();
    if (userData.is_super_admin) {
        alert('İşletme paneline erişim için normal kullanıcı girişi yapmalısınız!');
        window.location.href = 'admin.html';
        return;
    }

    // Kullanıcı adını göster
    document.getElementById('userName').textContent = userData.ad_soyad;

    // Bugünün tarihini seç
    setToday();

    // Takvimi yükle
    await loadCalendar();
});

// Bugüne git
function setToday() {
    currentDate = new Date();
    document.getElementById('selectedDate').value = formatDateForInput(currentDate);
    loadCalendar();
}

// Tarih değiştir
function changeDate(days) {
    currentDate.setDate(currentDate.getDate() + days);
    document.getElementById('selectedDate').value = formatDateForInput(currentDate);
    loadCalendar();
}

// Tarih formatı (YYYY-MM-DD)
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Takvimi yükle
async function loadCalendar() {
    const selectedDateInput = document.getElementById('selectedDate');
    const dateStr = selectedDateInput.value;

    document.getElementById('calendarLoading').style.display = 'block';
    document.getElementById('calendarContainer').style.display = 'none';

    // Çalışma odalarını al
    await loadCalismaOdalari();

    // Randevuları al
    const result = await apiRequest(
        `${API_CONFIG.ENDPOINTS.APPOINTMENTS}?start_date=${dateStr}&end_date=${dateStr}`,
        { method: 'GET' }
    );

    if (result.success && result.data.success) {
        appointments = result.data.data;
        renderCalendar(dateStr);
    } else {
        showToast('Randevular yüklenemedi', 'error');
    }

    document.getElementById('calendarLoading').style.display = 'none';
    document.getElementById('calendarContainer').style.display = 'block';
}

// Çalışma odalarını yükle
async function loadCalismaOdalari() {
    const result = await apiRequest(API_CONFIG.ENDPOINTS.APPOINTMENTS_COLUMNS, {
        method: 'GET'
    });

    if (result.success && result.data.success) {
        calismaOdalari = result.data.calisma_odalari;
        
        if (calismaOdalari.length === 0) {
            // Eğer hiç çalışma odası yoksa, randevulardan çıkar
            const uniqueRooms = [...new Set(appointments.map(a => a.calisma_odasi))];
            calismaOdalari = uniqueRooms.length > 0 ? uniqueRooms : ['Oda 1', 'Oda 2', 'Oda 3'];
        }

        // Modal select'lerini güncelle
        updateRoomSelects();
    }
}

// Oda select'lerini güncelle
function updateRoomSelects() {
    const addSelect = document.getElementById('add_calisma_odasi');
    const editSelect = document.getElementById('edit_calisma_odasi');

    const options = calismaOdalari.map(oda => 
        `<option value="${oda}">${oda}</option>`
    ).join('');

    addSelect.innerHTML = '<option value="">Seçiniz...</option>' + options;
    editSelect.innerHTML = '<option value="">Seçiniz...</option>' + options;
}

// Takvimi render et
function renderCalendar(dateStr) {
    const container = document.getElementById('calendarContainer');
    
    // Çalışma saatleri (09:00 - 20:00)
    const workHours = [];
    for (let hour = 9; hour <= 20; hour++) {
        workHours.push(`${String(hour).padStart(2, '0')}:00`);
    }

    // Grid template columns oluştur
    const gridTemplateColumns = `150px repeat(${calismaOdalari.length}, 1fr)`;

    // HTML oluştur
    let html = `<div class="calendar-grid" style="grid-template-columns: ${gridTemplateColumns}">`;

    // Header
    html += `<div class="calendar-header" style="grid-template-columns: ${gridTemplateColumns}">`;
    html += `<div class="header-time-label"><i class="bi bi-clock me-1"></i> Saat</div>`;
    calismaOdalari.forEach(oda => {
        html += `<div class="header-room"><i class="bi bi-person me-1"></i>${oda}</div>`;
    });
    html += `</div>`;

    // Zaman satırları
    workHours.forEach(time => {
        html += `<div class="time-row" style="grid-template-columns: ${gridTemplateColumns}">`;
        html += `<div class="time-label">${time}</div>`;

        calismaOdalari.forEach((oda, odaIndex) => {
            const cellId = `cell-${time}-${odaIndex}`;
            const appointment = findAppointmentForCell(dateStr, time, oda);

            html += `<div class="time-cell" id="${cellId}" 
                          data-time="${time}" 
                          data-room="${oda}"
                          onclick="openAddModalForCell('${dateStr}', '${time}', '${oda}')">`;

            if (appointment) {
                html += renderAppointmentBox(appointment);
            } else {
                html += `<div class="empty-slot"><i class="bi bi-plus-circle"></i></div>`;
            }

            html += `</div>`;
        });

        html += `</div>`;
    });

    html += `</div>`;
    container.innerHTML = html;

    // Drag & Drop'u başlat
    initDragAndDrop();
}

// Hücre için randevu bul
function findAppointmentForCell(date, time, room) {
    return appointments.find(apt => {
        const aptDate = new Date(apt.baslangic_saati);
        const aptTime = `${String(aptDate.getHours()).padStart(2, '0')}:00`;
        const aptDateStr = formatDateForInput(aptDate);
        
        return aptDateStr === date && aptTime === time && apt.calisma_odasi === room;
    });
}

// Randevu kutusunu render et
function renderAppointmentBox(appointment) {
    const startTime = new Date(appointment.baslangic_saati);
    const endTime = new Date(appointment.bitis_saati);
    const duration = `${startTime.getHours()}:${String(startTime.getMinutes()).padStart(2, '0')} - ${endTime.getHours()}:${String(endTime.getMinutes()).padStart(2, '0')}`;

    // Rastgele varyant seç
    const variants = ['', 'variant-1', 'variant-2', 'variant-3', 'variant-4'];
    const variant = variants[appointment.id % variants.length];

    return `
        <div class="appointment-box ${variant}" 
             data-id="${appointment.id}"
             onclick="event.stopPropagation(); openEditModal(${appointment.id})">
            <div>
                <div class="appointment-customer">
                    <i class="bi bi-person-fill me-1"></i>
                    ${appointment.musteri_adi}
                </div>
                ${appointment.islem_turu ? `
                    <div class="appointment-service">
                        <i class="bi bi-scissors me-1"></i>
                        ${appointment.islem_turu}
                    </div>
                ` : ''}
            </div>
            <div class="appointment-time">
                <i class="bi bi-clock me-1"></i>
                ${duration}
            </div>
        </div>
    `;
}

// Drag & Drop başlat
function initDragAndDrop() {
    // Önceki sortable instance'larını temizle
    sortableInstances.forEach(instance => instance.destroy());
    sortableInstances = [];

    const cells = document.querySelectorAll('.time-cell');
    
    cells.forEach(cell => {
        const sortable = new Sortable(cell, {
            group: 'appointments',
            animation: 200,
            ghostClass: 'sortable-ghost',
            dragClass: 'sortable-drag',
            draggable: '.appointment-box',
            onEnd: async function(evt) {
                const appointmentBox = evt.item;
                const appointmentId = parseInt(appointmentBox.dataset.id);
                const newCell = evt.to;
                const newTime = newCell.dataset.time;
                const newRoom = newCell.dataset.room;
                const dateStr = document.getElementById('selectedDate').value;

                // Yeni tarih-saat hesapla
                const [hour] = newTime.split(':');
                const appointment = appointments.find(a => a.id === appointmentId);
                
                if (appointment) {
                    const oldStart = new Date(appointment.baslangic_saati);
                    const oldEnd = new Date(appointment.bitis_saati);
                    const duration = oldEnd - oldStart;

                    const newStart = new Date(`${dateStr}T${hour}:00:00`);
                    const newEnd = new Date(newStart.getTime() + duration);

                    // Randevuyu güncelle
                    await updateAppointmentDragDrop(appointmentId, {
                        calisma_odasi: newRoom,
                        baslangic_saati: newStart.toISOString(),
                        bitis_saati: newEnd.toISOString()
                    });
                }
            }
        });

        sortableInstances.push(sortable);
    });
}

// Drag & Drop ile randevu güncelle
async function updateAppointmentDragDrop(id, updates) {
    const appointment = appointments.find(a => a.id === id);
    
    const formData = {
        musteri_adi: appointment.musteri_adi,
        telefon_no: appointment.telefon_no,
        islem_turu: appointment.islem_turu,
        calisma_odasi: updates.calisma_odasi,
        baslangic_saati: updates.baslangic_saati,
        bitis_saati: updates.bitis_saati
    };

    const result = await apiRequest(API_CONFIG.ENDPOINTS.APPOINTMENT_UPDATE(id), {
        method: 'PUT',
        body: JSON.stringify(formData)
    });

    if (result.success && result.data.success) {
        showToast('Randevu taşındı', 'success');
        await loadCalendar();
    } else {
        showToast(result.data.message || 'Randevu taşınamadı', 'error');
        await loadCalendar(); // Geri al
    }
}

// Hücreye tıklayınca randevu ekle modalını aç
function openAddModalForCell(dateStr, time, room) {
    const [hour] = time.split(':');
    const startDateTime = `${dateStr}T${hour}:00`;
    const endDateTime = `${dateStr}T${parseInt(hour) + 1}:00`;

    document.getElementById('add_baslangic_saati').value = startDateTime;
    document.getElementById('add_bitis_saati').value = endDateTime;
    document.getElementById('add_calisma_odasi').value = room;

    addModal.show();
}

// Yeni randevu kaydet
async function saveAppointment() {
    const formData = {
        musteri_adi: document.getElementById('add_musteri_adi').value.trim(),
        telefon_no: document.getElementById('add_telefon_no').value.trim(),
        islem_turu: document.getElementById('add_islem_turu').value.trim(),
        calisma_odasi: document.getElementById('add_calisma_odasi').value,
        baslangic_saati: new Date(document.getElementById('add_baslangic_saati').value).toISOString(),
        bitis_saati: new Date(document.getElementById('add_bitis_saati').value).toISOString()
    };

    if (!formData.musteri_adi || !formData.calisma_odasi) {
        showToast('Lütfen gerekli alanları doldurun', 'error');
        return;
    }

    const result = await apiRequest(API_CONFIG.ENDPOINTS.APPOINTMENT_CREATE, {
        method: 'POST',
        body: JSON.stringify(formData)
    });

    if (result.success && result.data.success) {
        showToast('Randevu başarıyla oluşturuldu', 'success');
        addModal.hide();
        document.getElementById('addAppointmentForm').reset();
        await loadCalendar();
    } else {
        showToast(result.data.message || 'Randevu oluşturulamadı', 'error');
    }
}

// Düzenleme modalını aç
function openEditModal(id) {
    const appointment = appointments.find(a => a.id === id);
    if (!appointment) return;

    document.getElementById('edit_id').value = appointment.id;
    document.getElementById('edit_musteri_adi').value = appointment.musteri_adi;
    document.getElementById('edit_telefon_no').value = appointment.telefon_no || '';
    document.getElementById('edit_islem_turu').value = appointment.islem_turu || '';
    document.getElementById('edit_calisma_odasi').value = appointment.calisma_odasi;
    
    const startDate = new Date(appointment.baslangic_saati);
    const endDate = new Date(appointment.bitis_saati);
    
    document.getElementById('edit_baslangic_saati').value = formatDateTimeLocal(startDate);
    document.getElementById('edit_bitis_saati').value = formatDateTimeLocal(endDate);

    editModal.show();
}

// Randevu güncelle
async function updateAppointment() {
    const id = document.getElementById('edit_id').value;
    const formData = {
        musteri_adi: document.getElementById('edit_musteri_adi').value.trim(),
        telefon_no: document.getElementById('edit_telefon_no').value.trim(),
        islem_turu: document.getElementById('edit_islem_turu').value.trim(),
        calisma_odasi: document.getElementById('edit_calisma_odasi').value,
        baslangic_saati: new Date(document.getElementById('edit_baslangic_saati').value).toISOString(),
        bitis_saati: new Date(document.getElementById('edit_bitis_saati').value).toISOString()
    };

    const result = await apiRequest(API_CONFIG.ENDPOINTS.APPOINTMENT_UPDATE(id), {
        method: 'PUT',
        body: JSON.stringify(formData)
    });

    if (result.success && result.data.success) {
        showToast('Randevu başarıyla güncellendi', 'success');
        editModal.hide();
        await loadCalendar();
    } else {
        showToast(result.data.message || 'Randevu güncellenemedi', 'error');
    }
}

// Randevu sil
async function deleteAppointment() {
    const id = document.getElementById('edit_id').value;
    
    if (!confirm('Bu randevuyu silmek istediğinizden emin misiniz?')) {
        return;
    }

    const result = await apiRequest(API_CONFIG.ENDPOINTS.APPOINTMENT_DELETE(id), {
        method: 'DELETE'
    });

    if (result.success && result.data.success) {
        showToast('Randevu başarıyla silindi', 'success');
        editModal.hide();
        await loadCalendar();
    } else {
        showToast(result.data.message || 'Randevu silinemedi', 'error');
    }
}

// DateTime-local formatı
function formatDateTimeLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hour}:${minute}`;
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
                <button type="button" class="btn-close btn-close-white me-2 m-auto" 
                        onclick="this.parentElement.parentElement.remove()"></button>
            </div>
        </div>
    `;

    document.body.appendChild(toastContainer);

    setTimeout(() => {
        toastContainer.remove();
    }, 3000);
}
