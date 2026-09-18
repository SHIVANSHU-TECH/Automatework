import { load, type CheerioAPI } from 'cheerio';

export type DevelopmentInsights = {
  modernityScore: number; // 0–100
  freshnessLabel: 'modern' | 'aging' | 'outdated';
  outdatedTech: string[];
  missingEssentials: string[];
  developmentIssues: string[];
  recommendations: string[];
};

const yearFromCopyright = (text: string): number | null => {
  const matches = Array.from(text.matchAll(/(?:©|copyright)\s*(?:\(c\))?\s*((?:19|20)\d{2})/gi));
  if (!matches.length) {
    const plain = Array.from(text.matchAll(/\b(19[89]\d|20[0-2]\d)\b/g)).map((m) => Number(m[1]));
    if (!plain.length) return null;
    return Math.min(...plain);
  }
  return Math.min(...matches.map((m) => Number(m[1])));
};

/**
 * Assess site freshness, missing essentials, and development debt
 * beyond classic SEO checks — useful for proposal scoping.
 */
export function getDevelopmentInsights(html: string, url: string): DevelopmentInsights {
  const $ = load(html);
  const lower = html.toLowerCase();
  const pageText = $.text();
  const outdatedTech: string[] = [];
  const missingEssentials: string[] = [];
  const developmentIssues: string[] = [];
  const recommendations: string[] = [];

  // ── Outdated / legacy technology ──────────────────────────────────────────
  if (/jquery[.-]?(1\.|2\.)/i.test(html) || lower.includes('jquery-1.') || lower.includes('jquery-2.')) {
    outdatedTech.push('Legacy jQuery (1.x / 2.x)');
  }
  if (/bootstrap[.-]?3/i.test(html) || lower.includes('bootstrap/3')) {
    outdatedTech.push('Bootstrap 3 (end-of-life)');
  }
  if (lower.includes('angular.js') || lower.includes('angularjs') || /ng-app|ng-controller/.test(lower)) {
    outdatedTech.push('AngularJS (legacy)');
  }
  if (lower.includes('.swf') || lower.includes('application/x-shockwave-flash')) {
    outdatedTech.push('Adobe Flash remnants');
  }
  if (lower.includes('document.write(')) {
    developmentIssues.push('Uses document.write — blocks rendering and is outdated');
  }
  if ($('table[width], table[bgcolor], font[face], center, marquee, blink').length > 0) {
    outdatedTech.push('Legacy HTML layout patterns (tables / font tags)');
  }
  if (/ua-\d{4,}-\d+/i.test(html)) {
    outdatedTech.push('Universal Analytics (UA) — retired; migrate to GA4');
  }

  // ── Copyright / age signal ────────────────────────────────────────────────
  const copyrightYear = yearFromCopyright(pageText);
  const currentYear = new Date().getFullYear();
  if (copyrightYear && copyrightYear <= currentYear - 4) {
    developmentIssues.push(
      `Footer copyright still shows ${copyrightYear} — site may not have been refreshed recently`,
    );
    recommendations.push('Refresh branding, copy, and copyright year to signal an actively maintained site');
  }

  // ── Missing essentials (business / conversion) ────────────────────────────
  const hasViewport = $('meta[name="viewport"]').length > 0;
  if (!hasViewport) {
    missingEssentials.push('Mobile viewport meta tag');
    recommendations.push('Add a responsive viewport and mobile-first layout');
  }

  if (!url.startsWith('https://')) {
    missingEssentials.push('HTTPS / SSL');
    recommendations.push('Move the entire site to HTTPS with automatic HTTP→HTTPS redirects');
  }

  const hasFavicon =
    $('link[rel*="icon"]').length > 0 ||
    lower.includes('favicon.ico');
  if (!hasFavicon) {
    missingEssentials.push('Favicon');
  }

  const hasAnalytics =
    lower.includes('gtag(') ||
    lower.includes('googletagmanager') ||
    lower.includes('ga(') ||
    lower.includes('hotjar') ||
    lower.includes('clarity') ||
    lower.includes('segment');
  if (!hasAnalytics) {
    missingEssentials.push('Analytics / conversion tracking');
    recommendations.push('Install analytics (e.g. GA4) so marketing and UX decisions are data-driven');
  }

  const hasCta =
    $('a, button').filter((_, el) => {
      const t = $(el).text().toLowerCase();
      return /get started|contact|book|demo|sign up|free trial|request|quote|buy|shop|subscribe|learn more/i.test(t);
    }).length > 0 ||
    /get started|contact us|book a|free trial|request a quote/i.test(pageText);
  if (!hasCta) {
    missingEssentials.push('Clear call-to-action');
    recommendations.push('Add prominent CTAs above the fold for primary conversions');
  }

  const hasForm = $('form').length > 0 || $('input[type="email"], input[type="tel"]').length > 0;
  if (!hasForm) {
    missingEssentials.push('Lead / contact form');
    recommendations.push('Add a contact or lead-capture form with clear fields and spam protection');
  }

  const hasPrivacy =
    $('a[href*="privacy"]').length > 0 ||
    /privacy policy/i.test(pageText);
  if (!hasPrivacy) {
    missingEssentials.push('Privacy policy link');
    recommendations.push('Publish a privacy policy and cookie notice for compliance and trust');
  }

  const hasOg =
    $('meta[property="og:title"]').length > 0 &&
    $('meta[property="og:image"]').length > 0;
  if (!hasOg) {
    missingEssentials.push('Social share preview (Open Graph)');
  }

  const hasSchema =
    $('script[type="application/ld+json"]').length > 0 ||
    $('[itemtype]').length > 0;
  if (!hasSchema) {
    missingEssentials.push('Structured data (Schema.org)');
  }

  // ── Development quality ───────────────────────────────────────────────────
  const inlineHandlers = $('[onclick],[onload],[onsubmit]').length;
  if (inlineHandlers > 3) {
    developmentIssues.push(`${inlineHandlers} inline event handlers — harder to maintain and often insecure`);
  }

  const httpAssets = $('script[src], link[href], img[src]')
    .map((_, el) => $(el).attr('src') || $(el).attr('href') || '')
    .get()
    .filter((src) => typeof src === 'string' && src.startsWith('http://'));
  if (httpAssets.length > 0 && url.startsWith('https://')) {
    developmentIssues.push(`${httpAssets.length} insecure HTTP asset(s) on an HTTPS page (mixed content)`);
    recommendations.push('Serve all scripts, styles, and images over HTTPS');
  }

  const imgWithoutLazy = $('img:not([loading])').length;
  const imgTotal = $('img').length;
  if (imgTotal >= 6 && imgWithoutLazy >= 4) {
    developmentIssues.push('Images are not lazy-loaded — slows first paint on long pages');
    recommendations.push('Add loading="lazy" to below-the-fold images and compress assets (WebP/AVIF)');
  }

  const renderBlocking =
    $('link[rel="stylesheet"]:not([media]), script[src]:not([async]):not([defer]):not([type="module"])').length;
  if (renderBlocking > 6) {
    developmentIssues.push(`${renderBlocking} render-blocking CSS/JS resources`);
    recommendations.push('Defer non-critical JavaScript and inline or async critical CSS');
  }

  if (!$('html').attr('lang')) {
    developmentIssues.push('Missing html lang attribute — hurts accessibility and localization');
  }

  const hasChat =
    lower.includes('intercom') ||
    lower.includes('crisp') ||
    lower.includes('tawk') ||
    lower.includes('zendesk') ||
    lower.includes('drift');
  const looksB2b = /saas|software|agency|consult|service|enterprise|b2b/i.test(pageText);
  if (looksB2b && !hasChat && !hasForm) {
    missingEssentials.push('Live chat or easy contact path for buyers');
  }

  // ── Score ─────────────────────────────────────────────────────────────────
  let score = 100;
  score -= outdatedTech.length * 12;
  score -= missingEssentials.length * 8;
  score -= developmentIssues.length * 6;
  if (copyrightYear && copyrightYear <= currentYear - 6) score -= 10;
  score = Math.max(5, Math.min(100, Math.round(score)));

  const freshnessLabel: DevelopmentInsights['freshnessLabel'] =
    score >= 70 ? 'modern' : score >= 45 ? 'aging' : 'outdated';

  if (freshnessLabel === 'outdated') {
    recommendations.unshift(
      'Plan a staged redesign or rebuild — the current site signals outdated technology and weak conversion paths',
    );
  } else if (freshnessLabel === 'aging') {
    recommendations.unshift(
      'Modernise key pages and tech debt before competitors pull further ahead',
    );
  }

  // Deduplicate recommendations
  const uniqueRecs = [...new Set(recommendations)].slice(0, 8);

  return {
    modernityScore: score,
    freshnessLabel,
    outdatedTech: [...new Set(outdatedTech)],
    missingEssentials: [...new Set(missingEssentials)],
    developmentIssues: [...new Set(developmentIssues)],
    recommendations: uniqueRecs,
  };
}

/** Optional helper if callers already have Cheerio loaded */
export function getDevelopmentInsightsFromCheerio($: CheerioAPI, html: string, url: string): DevelopmentInsights {
  return getDevelopmentInsights(html || $.html() || '', url);
}
