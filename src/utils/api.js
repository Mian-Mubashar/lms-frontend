import axios from 'axios';

/** Production must not call localhost — browsers block HTTPS pages from loopback (Private Network Access). */
function normalizeApiBase() {
  const raw = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
  if (raw) return raw.endsWith('/api') ? raw : `${raw}/api`;
  if (import.meta.env.DEV) return '/api';
  if (import.meta.env.PROD) {
    // eslint-disable-next-line no-console
    console.error(
      '[LMS] VITE_API_URL missing at build time. Vercel → FRONTEND project → Environment Variables → VITE_API_URL = https://<your-backend>.vercel.app/api → Redeploy.'
    );
    return null;
  }
  return 'http://localhost:5000/api';
}

const API_URL = normalizeApiBase();

const api = axios.create({
  baseURL: API_URL ?? '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  if (import.meta.env.PROD && API_URL === null) {
    return Promise.reject(
      new Error(
        'Missing VITE_API_URL. Vercel → your FRONTEND project → Settings → Environment Variables → add VITE_API_URL = https://YOUR-BACKEND.vercel.app/api (enable Production + Preview) → Redeploy.'
      )
    );
  }
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

