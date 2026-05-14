import axios from 'axios';

function normalizeApiBase() {
  const raw = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
  if (raw) return raw.endsWith('/api') ? raw : `${raw}/api`;
  if (import.meta.env.DEV) return '/api';
  // Local production build without VITE_API_URL (not on Vercel — check script skips there)
  if (import.meta.env.PROD) {
    // eslint-disable-next-line no-console
    console.warn(
      '[LMS] VITE_API_URL is unset. Production API calls may fail. Set it before deploy, e.g. https://your-backend.vercel.app/api'
    );
  }
  return 'http://localhost:5000/api';
}

const API_URL = normalizeApiBase();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || '';
      const isAuthRequest =
        requestUrl.includes('/auth/login') ||
        requestUrl.includes('/auth/register') ||
        requestUrl.includes('/auth/forgot-password') ||
        requestUrl.includes('/auth/reset-password');

      // Do not force-refresh login/register failures; let UI show proper error.
      if (!isAuthRequest) {
        localStorage.removeItem('token');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

