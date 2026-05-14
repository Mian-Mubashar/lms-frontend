import api from './api';

/**
 * Turn stored paths (e.g. uploads/courses/xxx.jpg) into a URL the browser can load.
 * Multer stores relative paths; <img src> must hit the API host, not the Vite dev origin.
 */
export function resolveMediaUrl(path) {
  if (path == null || path === '') return '';
  const raw = String(path).trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;

  const normalized = raw.replace(/\\/g, '/');
  const withSlash = normalized.startsWith('/') ? normalized : `/${normalized}`;

  const base = api.defaults.baseURL || '';
  if (base.startsWith('http://') || base.startsWith('https://')) {
    try {
      const { origin } = new URL(base);
      return `${origin}${withSlash}`;
    } catch {
      return withSlash;
    }
  }

  // Dev: Vite proxies /uploads → backend (see vite.config.js)
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${withSlash}`;
  }

  return withSlash;
}
