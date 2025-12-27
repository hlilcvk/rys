// Frontend Environment Configuration
// Bu dosyayı deploy öncesi düzenleyin veya Coolify'da environment variable kullanın

window.ENV_CONFIG = {
    // Production'da backend API URL'inizi buraya yazın
    // Örnek: 'https://api.randevu.yourdomain.com/api'
    API_BASE_URL: '${API_BASE_URL}',
    
    // Geliştirme ortamı kontrolü
    IS_DEVELOPMENT: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
};

// Eğer API_BASE_URL placeholder değilse kullan, değilse fallback
if (window.ENV_CONFIG.API_BASE_URL.startsWith('${')) {
    window.ENV_CONFIG.API_BASE_URL = window.ENV_CONFIG.IS_DEVELOPMENT 
        ? 'http://localhost:3000/api'
        : '/api'; // Nginx proxy kullanıyorsanız
}
