/**
 * Vercel sets VERCEL=1 during build. Require a real public VITE_API_URL (not examples).
 */
import { isPlaceholderApiUrl } from '../src/config/apiUrlGuards.js';

const v = String(process.env.VITE_API_URL || '').trim();

if (process.env.VERCEL === '1') {
  if (!v) {
    console.error(`
[Vercel] Missing VITE_API_URL

In your FRONTEND Vercel project:
  Settings → Environment Variables
  Name:  VITE_API_URL
  Value: copy from BACKEND project → Deployments → your production URL, then add /api
  Example: https://lms-backend-xxxxx.vercel.app/api
  Enable: Production + Preview → Save → Redeploy
`);
    process.exit(1);
  }
  if (/localhost|127\.0\.0\.1/i.test(v)) {
    console.error(`
[Vercel] VITE_API_URL must NOT use localhost.

Use your deployed backend URL, e.g.:
  https://lms-backend-xxxxx.vercel.app/api
`);
    process.exit(1);
  }
  if (!/^https:\/\//i.test(v)) {
    console.error(`
[Vercel] VITE_API_URL must start with https://
Got: ${v.slice(0, 80)}${v.length > 80 ? '…' : ''}
`);
    process.exit(1);
  }
  if (isPlaceholderApiUrl(v)) {
    console.error(`
[Vercel] VITE_API_URL looks like a placeholder / example, not your real backend.

Do NOT use: your-lms-backend, example.com, or README text.
DO use the exact URL from your BACKEND Vercel project (Domains or latest deployment), + /api
`);
    process.exit(1);
  }
}
