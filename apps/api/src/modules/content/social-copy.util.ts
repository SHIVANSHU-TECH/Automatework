/**
 * Clean AI-generated social copy so it reads like a real person wrote it.
 * Strips markdown bold/italic asterisks, underscore emphasis, and other AI tells.
 */

export function stripAiFormatting(text: string): string {
  if (!text) return '';
  return text
    // Remove markdown bold/italic: **text**, *text*, __text__, _text_
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_\n]+)_/g, '$1')
  // Remove leftover lone asterisks used as bullets or emphasis
  .replace(/^\s*\*\s+/gm, '• ')
  .replace(/\*/g, '')
  // Remove leftover underscore emphasis leftovers already handled above
  // Remove markdown headers / code fences
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    // Collapse AI-ish filler phrases (light touch)
    .replace(/\bIn today's (?:fast-paced|digital|ever-evolving) world,?\s*/gi, '')
    .replace(/\bLet's dive in\.?\s*/gi, '')
    .replace(/\bWithout further ado,?\s*/gi, '')
    .replace(/\bGame[- ]changer\b/gi, 'big shift')
    .replace(/\bUnlock(?:ing)? (?:the )?potential\b/gi, 'making the most of')
    .replace(/\bLeverage\b/gi, 'use')
    .replace(/\bSynergy\b/gi, 'teamwork')
    // Normalize whitespace
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function cleanHashtags(tags: unknown, max: number): string[] {
  if (!Array.isArray(tags)) return [];
  const cleaned = tags
    .map((t) => String(t ?? '').replace(/^#+/, '').replace(/[^a-zA-Z0-9_]/g, '').trim())
    .filter(Boolean)
    .slice(0, Math.max(0, max));
  // Dedupe case-insensitively
  const seen = new Set<string>();
  return cleaned.filter((t) => {
    const key = t.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Free X/Twitter limit is 280 characters per tweet. */
export const X_FREE_CHAR_LIMIT = 280;

/**
 * Ensure a single tweet (body + optional hashtags) fits free-tier limit.
 * Truncates cleanly at a word boundary when needed.
 */
export function fitXTweet(body: string, hashtags: string[], limit = X_FREE_CHAR_LIMIT): {
  body: string;
  hashtags: string[];
} {
  const cleanBody = stripAiFormatting(body);
  let tags = cleanHashtags(hashtags, 2);

  const tagSuffix = (list: string[]) =>
    list.length ? `\n\n${list.map((h) => `#${h}`).join(' ')}` : '';

  // Drop hashtags until body + tags fit; then trim body if still over
  while (tags.length > 0 && (cleanBody + tagSuffix(tags)).length > limit) {
    tags = tags.slice(0, -1);
  }

  let finalBody = cleanBody;
  const available = limit - tagSuffix(tags).length;
  if (finalBody.length > available) {
    const cut = finalBody.slice(0, Math.max(0, available - 1));
    const lastSpace = cut.lastIndexOf(' ');
    finalBody = (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trimEnd() + '…';
  }

  return { body: finalBody, hashtags: tags };
}

/**
 * For threads: each segment separated by --- must be ≤ limit (hashtags only on last tweet).
 */
export function fitXThread(body: string, hashtags: string[], limit = X_FREE_CHAR_LIMIT): {
  body: string;
  hashtags: string[];
} {
  const parts = stripAiFormatting(body)
    .split(/\n*\s*---\s*\n*/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length <= 1) {
    return fitXTweet(body, hashtags, limit);
  }

  const tags = cleanHashtags(hashtags, 2);
  const fitted = parts.map((part, i) => {
    const isLast = i === parts.length - 1;
    const { body: b } = fitXTweet(part, isLast ? tags : [], limit);
    return b;
  });

  return {
    body: fitted.join('\n\n---\n\n'),
    hashtags: tags,
  };
}
