/**
 * Vercel sets VERCEL=1 during build. Require a public VITE_API_URL so the
 * bundle never ships with localhost (browsers block HTTPS → loopback).
 */
const v = String(process.env.VITE_API_URL || '').trim();

if (process.env.VERCEL === '1') {
  if (!v) {
    console.error(`
[Vercel] Missing VITE_API_URL

In your FRONTEND Vercel project (the one that builds lms-frontend):
  Settings → Environment Variables
  Name:  VITE_API_URL
  Value: https://<your-BACKEND>.vercel.app/api
  Enable: Production + Preview → Save → Redeploy

If frontend code lives in a separate GitHub repo, push the latest code there too.
`);
    process.exit(1);
  }
  if (/localhost|127\.0\.0\.1/i.test(v)) {
    console.error(`
[Vercel] VITE_API_URL must NOT use localhost.

Use your deployed backend URL, e.g.:
  https://lms-backend-xxxxx.vercel.app/api

(Find it in your BACKEND Vercel project → Domains / latest deployment URL.)
`);
    process.exit(1);
  }
  if (!/^https:\/\//i.test(v)) {
    console.error(`
[Vercel] VITE_API_URL should start with https://
Current value starts with: ${v.slice(0, 12)}...
`);
    process.exit(1);
  }
}
