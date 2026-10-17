import axios from 'axios';

// Get base URL from environment or fallback to localhost
let envURL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

// Auto-normalize: if user entered 'https://crms-arth.onrender.com' without '/api/v1', auto-append it
envURL = envURL.trim().replace(/\/+$/, '');
if (!envURL.endsWith('/api/v1')) {
  envURL = `${envURL}/api/v1`;
}

const api = axios.create({
  baseURL: envURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  // Never send stale bearer token to login/quick-auth endpoints
  if (!config.url.includes('/auth/quick') && !config.url.includes('/auth/token')) {
    const token = localStorage.getItem('cmrs_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Stale or invalid token - purge from localStorage
      console.warn('API 401 Unauthorized — clearing stale credentials');
      localStorage.removeItem('cmrs_access_token');
      localStorage.removeItem('cmrs_refresh_token');
    }
    return Promise.reject(error);
  }
);

export default api;
