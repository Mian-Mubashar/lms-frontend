/** Substrings that must never be used as a real production API base (copy-paste from examples). */
export const PLACEHOLDER_API_SUBSTRINGS = [
  'your-lms-backend',
  'your-backend',
  'example.com',
  '<your',
  'changeme',
  'paste-here'
];

export function isPlaceholderApiUrl(url) {
  const u = String(url || '').toLowerCase();
  return PLACEHOLDER_API_SUBSTRINGS.some((s) => u.includes(s));
}
