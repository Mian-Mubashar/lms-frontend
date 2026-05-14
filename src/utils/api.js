import axios from 'axios';
import { isPlaceholderApiUrl } from '../config/apiUrlGuards.js';

/** Production must not call localhost — browsers block HTTPS pages from loopback (Private Network Access). */
function normalizeApiBase() {
  const raw = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
  if (raw) {
    const base = raw.endsWith('/api') ? raw : `${raw}/api`;
    if (import.meta.env.PROD && isPlaceholderApiUrl(base)) {
      // eslint-disable-next-line no-console
      console.error(
        '[LMS] VITE_API_URL is an example/placeholder. Vercel → Environment Variables → set it to your REAL backend URL from the backend project + /api, then redeploy.'
      );
      return null;
    }
    return base;
  }
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
  const base = String(config.baseURL ?? api.defaults.baseURL ?? '');
  const onPublicSite =
    typeof window !== 'undefined' &&
    window.location.protocol === 'https:' &&
    !['localhost', '127.0.0.1'].includes(window.location.hostname);
  if (onPublicSite && (/localhost/i.test(base) || base.includes('127.0.0.1'))) {
    return Promise.reject(
      new Error(
        'Browser blocked localhost (old or wrong build). Frontend Vercel → set VITE_API_URL = https://YOUR-BACKEND.vercel.app/api → Redeploy. If code is in a separate GitHub repo, push latest frontend from this project first.'
      )
    );
  }
  if (onPublicSite && isPlaceholderApiUrl(base)) {
    return Promise.reject(
      new Error(
        'VITE_API_URL is still a placeholder (e.g. your-lms-backend). In Vercel → Frontend project → Environment Variables, set VITE_API_URL to your actual backend URL from the backend Vercel deployment + /api, then redeploy.'
      )
    );
  }
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

