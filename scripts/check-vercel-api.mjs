/**
 * Vercel injects VERCEL=1 during build. Require VITE_API_URL so production
 * bundles never ship with localhost API (split frontend/backend deploys).
 */
if (process.env.VERCEL === '1' && !String(process.env.VITE_API_URL || '').trim()) {
  console.error(`
[Vercel] Missing VITE_API_URL

Add in your FRONTEND project:
  Settings → Environment Variables
  Name:  VITE_API_URL
  Value: https://<your-lms-backend>.vercel.app/api
  (tick Production + Preview, then Redeploy)

Without this, the site calls the wrong host and login/API will fail.
`);
  process.exit(1);
}
