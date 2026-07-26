/**
 * Normalise a URL entered by the user.
 * - Strips leading/trailing whitespace
 * - Auto-prepends https:// if no protocol is present
 * - Returns null when the result is still not a valid http(s) URL
 */
export const normalizeWebsiteUrl = (raw: string): string | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // If the user typed a bare domain like "fit29.com" or "www.fit29.com"
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
  } catch {
    // fall through
  }
  return null;
};

/** Legacy boolean validator kept for any remaining callers */
export const validateWebsiteUrl = (url: string): boolean => normalizeWebsiteUrl(url) !== null;
