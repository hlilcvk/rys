// API Endpoint Konfigürasyonu
// window.ENV_CONFIG env-config.js dosyasından gelir
const getApiBaseUrl = () => {
    if (window.ENV_CONFIG && window.ENV_CONFIG.API_BASE_URL) {
        return window.ENV_CONFIG.API_BASE_URL;
    }
    // Fallback: localhost kontrolü
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000/api'
        : '/api';
};

const API_CONFIG = {
    BASE_URL: getApiBaseUrl(),
    ENDPOINTS: {
        LOGIN: '/auth/login',
        VERIFY: '/auth/verify',
        ADMIN_ISLETMELER: '/admin/isletmeler',
        ADMIN_ISLETME_CREATE: '/admin/isletme',
        ADMIN_ISLETME_UPDATE: (id) => `/admin/isletme/${id}`,
        ADMIN_ISLETME_DELETE: (id) => `/admin/isletme/${id}`,
        APPOINTMENTS: '/appointments',
        APPOINTMENTS_COLUMNS: '/appointments/columns',
        APPOINTMENT_CREATE: '/appointments',
        APPOINTMENT_UPDATE: (id) => `/appointments/${id}`,
        APPOINTMENT_DELETE: (id) => `/appointments/${id}`
    }
};

// Token Storage
const AUTH_TOKEN_KEY = 'randevu_auth_token';
const USER_DATA_KEY = 'randevu_user_data';

// Helper Functions
function getAuthToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY);
}

function setAuthToken(token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
}

function removeAuthToken() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
}

function getUserData() {
    const data = localStorage.getItem(USER_DATA_KEY);
    return data ? JSON.parse(data) : null;
}

function setUserData(userData) {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
}

// API Request Helper
async function apiRequest(endpoint, options = {}) {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
            ...options,
            headers
        });

        const data = await response.json();

        // Token süresi dolmuşsa login'e yönlendir
        if (response.status === 403 || response.status === 401) {
            if (window.location.pathname !== '/login.html' && !window.location.pathname.endsWith('/')) {
                removeAuthToken();
                window.location.href = 'login.html';
            }
        }

        return { success: response.ok, status: response.status, data };
    } catch (error) {
        console.error('API Request Error:', error);
        return { success: false, error: error.message };
    }
}

// Token doğrulama
async function verifyToken() {
    const token = getAuthToken();
    if (!token) return false;

    const result = await apiRequest(API_CONFIG.ENDPOINTS.VERIFY, {
        method: 'POST'
    });

    if (result.success && result.data.success) {
        setUserData(result.data.user);
        return true;
    }

    removeAuthToken();
    return false;
}

// Logout
function logout() {
    removeAuthToken();
    window.location.href = 'login.html';
}
