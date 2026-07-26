// NEXT_PUBLIC_API_URL is baked in at build time by Next.js.
// Set it in your Vercel project: Settings → Environment Variables
// Value: https://automatework-tmfr.onrender.com
const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === 'production'
    ? 'https://automatework-tmfr.onrender.com'   // production fallback
    : 'http://localhost:4000');                   // local dev fallback

export { apiUrl };

export const fetchJson = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(`${apiUrl}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.message ?? 'API request failed');
  }

  return response.json();
};
