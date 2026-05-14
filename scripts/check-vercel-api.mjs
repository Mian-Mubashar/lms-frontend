/**
 * Vercel sets VERCEL=1 during build. Require a real public VITE_API_URL (not examples).
 * Self-contained (no imports) so this always runs even if a split GitHub repo missed a file.
 */
const v = String(process.env.VITE_API_URL || '').trim();

function isPlaceholderApiUrl(url) {
  const u = String(url || '').toLowerCase();
  const bad = [
    'your-lms-backend',
    'your-backend',
    'example.com',
    '<your',
    'changeme',
    'paste-here'
  ];
  return bad.some((s) => u.includes(s));
}

if (process.env.VERCEL === '1') {
  if (!v) {
    console.error(`
[Vercel] Missing VITE_API_URL  →  npm run build exits 1 on purpose.

Fix:
  1) Open your FRONTEND project on Vercel (the one that builds this app).
  2) Settings → Environment Variables → Add:
       Name:   VITE_API_URL
       Value:  https://<YOUR-REAL-BACKEND>.vercel.app/api
       (Copy the backend URL from your BACKEND Vercel project → Deployments / Domains, then add /api)
  3) Enable this variable for Production AND Preview (all deploy targets you use).
  4) Save → Deployments → Redeploy (or push a new commit).

If you use two GitHub repos, add the variable in the Vercel project that is linked to THIS repo.
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

Replace it with the exact HTTPS URL from your BACKEND Vercel project + /api
(do not use README / example hostnames).
`);
    process.exit(1);
  }
}
