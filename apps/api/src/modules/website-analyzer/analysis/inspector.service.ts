import { load, type CheerioAPI } from 'cheerio';
import dns from 'dns/promises';
import axios from 'axios';
import { extractContent } from '../../content-extraction/content.service';
import type {
  CoreWebVitals,
  LighthouseScores,
  DomainInfo,
  SecurityHeaders,
  CrawlabilityInfo,
  ContentInsights,
  TrafficRank,
} from '../types';

export type InspectionResult = {
  // V1 fields
  framework?: string;
  cms?: string;
  hosting?: string;
  analytics?: string[];
  performanceScore?: number;
  isMobileResponsive?: boolean;
  brokenLinks: string[];
  accessibilityIssues: string[];
  seoIssues: string[];
  sslValid: boolean;
  contactInformation: string[];
  socialLinks: string[];
  businessCategory: string;
  detectedTechnologies: string[];
  contentExtraction: Awaited<ReturnType<typeof extractContent>>;

  // V2 fields (populated by website-analyzer.service.ts via parallel calls)
  coreWebVitals?: CoreWebVitals;
  lighthouseScores?: LighthouseScores;
  domainInfo?: DomainInfo;
  securityHeaders?: SecurityHeaders;
  crawlability?: CrawlabilityInfo;
  contentInsights?: ContentInsights;
  trafficRank?: TrafficRank;
  analysisTimestamp?: string;
  lighthouseError?: string;
};

const socialDomains = [
  'facebook.com', 'twitter.com', 'x.com', 'linkedin.com',
  'instagram.com', 'youtube.com', 'tiktok.com', 'pinterest.com',
];

const normalizeText = (value: string) => value.replace(/\s+/g, ' ').trim();

// ─── Business category ────────────────────────────────────────────────────────

const detectCategory = (text: string): string => {
  const t = text.toLowerCase();
  if (/ecommerce|online store|shopping cart|add to cart|buy now/.test(t)) return 'E-commerce';
  if (/saas|software as a service|software platform|free trial|pricing plan/.test(t)) return 'SaaS';
  if (/health|medical|clinic|doctor|patient|telehealth|glp-1|semaglutide/.test(t)) return 'Healthcare';
  if (/finance|bank|insurance|investment|mortgage|loan/.test(t)) return 'Finance';
  if (/education|learning|training|academy|course|university/.test(t)) return 'Education';
  if (/real estate|property|estate|rent|lease|apartment/.test(t)) return 'Real Estate';
  return 'Professional Services';
};

// ─── Technology detection ─────────────────────────────────────────────────────

const detectTechnologies = ($: CheerioAPI, html: string): string[] => {
  const technologies = new Set<string>();
  const lower = html.toLowerCase();

  // Script/link src attributes
  $('script[src], link[href], meta[name="generator"], meta[name="framework"]').each((_, el) => {
    const attrs = ['src', 'href', 'content'] as const;
    for (const attr of attrs) {
      const value = $(el).attr(attr);
      if (!value) continue;
      const v = value.toLowerCase();
      if (v.includes('react'))                                  technologies.add('React');
      if (v.includes('next') || v.includes('_next'))            technologies.add('Next.js');
      if (v.includes('angular'))                                technologies.add('Angular');
      if (v.includes('vue'))                                    technologies.add('Vue.js');
      if (v.includes('svelte'))                                 technologies.add('Svelte');
      if (v.includes('nuxt'))                                   technologies.add('Nuxt.js');
      if (v.includes('wordpress') || v.includes('wp-content')) technologies.add('WordPress');
      if (v.includes('shopify'))                                technologies.add('Shopify');
      if (v.includes('wix'))                                    technologies.add('Wix');
      if (v.includes('webflow'))                                technologies.add('Webflow');
      if (v.includes('squarespace'))                            technologies.add('Squarespace');
      if (v.includes('gtag') || v.includes('googleanalytics'))  technologies.add('Google Analytics');
      if (v.includes('hotjar'))                                 technologies.add('Hotjar');
      if (v.includes('segment'))                                technologies.add('Segment');
      if (v.includes('hubspot'))                                technologies.add('HubSpot');
      if (v.includes('intercom'))                               technologies.add('Intercom');
      if (v.includes('stripe'))                                 technologies.add('Stripe');
      if (v.includes('tailwind'))                               technologies.add('Tailwind CSS');
      if (v.includes('bootstrap'))                              technologies.add('Bootstrap');
    }
  });

  // HTML body / inline signals — catches Vite/hashed bundles
  if (lower.includes('__reactfiber') || lower.includes('__react_root') ||
      lower.includes('react.createElement') || lower.includes('_jsx('))    technologies.add('React');
  if (lower.includes('__next') || lower.includes('_next/static'))          technologies.add('Next.js');
  if (lower.includes('__vue__') || lower.includes('vue.config'))           technologies.add('Vue.js');
  if (lower.includes('ng-version') || lower.includes('ng-app'))            technologies.add('Angular');
  if (lower.includes('__sveltekit') || lower.includes('svelte'))           technologies.add('Svelte');
  if (lower.includes('nuxtapp') || lower.includes('__nuxt'))               technologies.add('Nuxt.js');
  if (lower.includes('wp-content') || lower.includes('wp-json'))           technologies.add('WordPress');
  if (lower.includes('cdn.shopify'))                                        technologies.add('Shopify');
  if (lower.includes('static.wixstatic'))                                  technologies.add('Wix');
  if (lower.includes('webflow'))                                            technologies.add('Webflow');
  if (lower.includes('gtag(') || lower.includes('ga('))                    technologies.add('Google Analytics');
  if (lower.includes('fbq('))                                               technologies.add('Facebook Pixel');
  if (lower.includes('clarity('))                                           technologies.add('Microsoft Clarity');
  if (lower.includes('dataLayer'))                                          technologies.add('Google Tag Manager');
  if (lower.includes('stripe'))                                             technologies.add('Stripe');
  if (lower.includes('intercom'))                                           technologies.add('Intercom');
  if (lower.includes('crisp'))                                              technologies.add('Crisp Chat');
  if (lower.includes('tailwind'))                                           technologies.add('Tailwind CSS');
  if (lower.includes('bootstrap'))                                          technologies.add('Bootstrap');
  if (lower.includes('vite'))                                               technologies.add('Vite');

  return Array.from(technologies);
};

// ─── Framework detection ──────────────────────────────────────────────────────

const detectFramework = ($: CheerioAPI, html: string): string | undefined => {
  const lower = html.toLowerCase();
  const generator = $('meta[name="generator"]').attr('content') ?? '';

  // Generator meta tag
  if (/wordpress/i.test(generator)) return 'WordPress';
  if (/shopify/i.test(generator))   return 'Shopify';
  if (/drupal/i.test(generator))    return 'Drupal';
  if (/joomla/i.test(generator))    return 'Joomla';
  if (/wix/i.test(generator))       return 'Wix';
  if (/webflow/i.test(generator))   return 'Webflow';

  // Script tags & HTML signals
  if (lower.includes('_next/static') || lower.includes('__next')) return 'Next.js';
  if ($('script[src*="/_next/"]').length > 0)                      return 'Next.js';
  if (lower.includes('nuxtapp') || lower.includes('__nuxt'))       return 'Nuxt.js';
  if (lower.includes('ng-version') || $('[ng-version]').length)    return 'Angular';
  if (lower.includes('__sveltekit'))                                return 'SvelteKit';
  if (lower.includes('__vue__'))                                    return 'Vue.js';
  if (lower.includes('react.createElement') || lower.includes('_jsx(') ||
      lower.includes('__reactfiber'))                               return 'React';
  if (lower.includes('wp-content') || lower.includes('wp-json'))   return 'WordPress';
  if (lower.includes('cdn.shopify'))                                return 'Shopify';
  if (lower.includes('static.wixstatic'))                          return 'Wix';
  if (lower.includes('webflow'))                                    return 'Webflow';
  if (lower.includes('squarespace'))                                return 'Squarespace';

  return undefined;
};

// ─── CMS detection ────────────────────────────────────────────────────────────

const detectCms = ($: CheerioAPI, html: string): string | undefined => {
  const generator = $('meta[name="generator"]').attr('content') ?? '';
  const lower = html.toLowerCase();

  if (/wordpress/i.test(generator) || lower.includes('wp-content') || lower.includes('wp-json')) return 'WordPress';
  if (/shopify/i.test(generator) || lower.includes('cdn.shopify'))    return 'Shopify';
  if (/drupal/i.test(generator))                                       return 'Drupal';
  if (/joomla/i.test(generator))                                       return 'Joomla';
  if (/wix/i.test(generator) || lower.includes('static.wixstatic'))   return 'Wix';
  if (lower.includes('webflow'))                                        return 'Webflow';
  if (lower.includes('squarespace'))                                    return 'Squarespace';
  if (lower.includes('ghost'))                                          return 'Ghost';
  if (lower.includes('contentful'))                                     return 'Contentful';
  if (lower.includes('sanity'))                                         return 'Sanity';

  return undefined;
};

// ─── Hosting detection ────────────────────────────────────────────────────────

const detectHosting = async ($: CheerioAPI, html: string, hostname: string): Promise<string | undefined> => {
  const lower = html.toLowerCase();

  // Headers / HTML signals first (faster and more reliable)
  if (lower.includes('vercel') || lower.includes('_vercel'))             return 'Vercel';
  if (lower.includes('netlify') || lower.includes('netlify.app'))        return 'Netlify';
  if (lower.includes('cloudflare') || lower.includes('cf-ray'))          return 'Cloudflare';
  if (lower.includes('github.io'))                                        return 'GitHub Pages';
  if (lower.includes('render.com') || lower.includes('onrender.com'))    return 'Render';
  if (lower.includes('railway'))                                          return 'Railway';
  if (lower.includes('fly.io'))                                           return 'Fly.io';
  if (hostname.endsWith('.vercel.app'))                                   return 'Vercel';
  if (hostname.endsWith('.netlify.app'))                                  return 'Netlify';
  if (hostname.endsWith('.onrender.com'))                                 return 'Render';
  if (hostname.endsWith('.github.io'))                                    return 'GitHub Pages';
  if (hostname.endsWith('.pages.dev'))                                    return 'Cloudflare Pages';
  if (hostname.endsWith('.fly.dev'))                                      return 'Fly.io';
  if (hostname.endsWith('.railway.app'))                                  return 'Railway';
  if (hostname.endsWith('.lovable.app') || hostname.endsWith('.lovable.dev')) return 'Lovable (Vercel)';

  // DNS IP-based fallback
  try {
    const record = await dns.lookup(hostname);
    const ip = record.address;
    if (ip.startsWith('34.') || ip.startsWith('35.') || ip.startsWith('104.') || ip.startsWith('172.217.')) return 'Google Cloud';
    if (ip.startsWith('52.') || ip.startsWith('54.') || ip.startsWith('18.') || ip.startsWith('3.'))        return 'AWS';
    if (ip.startsWith('13.') || ip.startsWith('40.') || ip.startsWith('20.'))                               return 'Azure';
    if (ip.startsWith('104.') || ip.startsWith('172.') || ip.startsWith('198.41.'))                         return 'Cloudflare';
  } catch {
    // DNS lookup failed — ignore
  }

  return undefined;
};

// ─── Analytics ────────────────────────────────────────────────────────────────

const collectAnalytics = ($: CheerioAPI, html: string): string[] => {
  const found = new Set<string>();
  const lower = html.toLowerCase();

  if (lower.includes('google-analytics') || lower.includes('gtag(') || lower.includes("'UA-") || lower.includes('"UA-') || lower.includes("'G-") || lower.includes('"G-')) found.add('Google Analytics');
  if (lower.includes('gtm.js') || lower.includes('googletagmanager'))   found.add('Google Tag Manager');
  if (lower.includes('hotjar'))                                          found.add('Hotjar');
  if (lower.includes('mixpanel'))                                        found.add('Mixpanel');
  if (lower.includes('segment.com') || lower.includes('analytics.js'))  found.add('Segment');
  if (lower.includes('fbq('))                                            found.add('Facebook Pixel');
  if (lower.includes('clarity(') || lower.includes('clarity.ms'))       found.add('Microsoft Clarity');
  if (lower.includes('amplitude'))                                       found.add('Amplitude');
  if (lower.includes('posthog'))                                         found.add('PostHog');
  if (lower.includes('heap.io') || lower.includes('heap.load'))         found.add('Heap');
  if (lower.includes('intercom'))                                        found.add('Intercom');

  return Array.from(found);
};

// ─── Social links ─────────────────────────────────────────────────────────────

const collectSocialLinks = ($: CheerioAPI): string[] => {
  const links = new Set<string>();
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') ?? '';
    for (const domain of socialDomains) {
      if (href.includes(domain)) links.add(href);
    }
  });
  return Array.from(links);
};

// ─── Contact info ─────────────────────────────────────────────────────────────

const collectContactInformation = ($: CheerioAPI, text: string): string[] => {
  const contacts = new Set<string>();
  $('a[href^="mailto:"]').each((_, el) => { contacts.add($(el).attr('href') ?? ''); });
  $('a[href^="tel:"]').each((_, el)    => { contacts.add($(el).attr('href') ?? ''); });

  Array.from(text.matchAll(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g))
    .forEach((m) => contacts.add(m[0]));
  Array.from(text.matchAll(/(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}|\+\d{1,3}[\s.-]\d{2,}[\s.-]\d{2,}[\s.-]\d{2,}/g))
    .forEach((m) => contacts.add(normalizeText(m[0])));

  return Array.from(contacts).filter(Boolean);
};

// ─── SEO ─────────────────────────────────────────────────────────────────────

const detectSeoIssues = ($: CheerioAPI): string[] => {
  const issues: string[] = [];
  const title = $('title').text().trim();
  const desc  = $('meta[name="description"]').attr('content') ?? '';
  const ogTitle = $('meta[property="og:title"]').attr('content') ?? '';

  if (!title && !ogTitle)               issues.push('Missing page title');
  if (!desc)                             issues.push('Missing meta description');
  if ($('h1').length === 0)              issues.push('Missing H1 heading');
  if (title.length > 70)                issues.push('Page title too long (> 70 chars)');
  if (desc.length > 160)                issues.push('Meta description too long (> 160 chars)');
  if (!$('meta[name="robots"]').length) issues.push('No robots meta tag');
  const canonical = $('link[rel="canonical"]').attr('href');
  if (!canonical)                        issues.push('No canonical URL tag');

  return issues;
};

// ─── Accessibility ───────────────────────────────────────────────────────────

const detectAccessibilityIssues = ($: CheerioAPI): string[] => {
  const issues = new Set<string>();

  if (!$('html').attr('lang'))    issues.add('Document missing lang attribute');

  $('img').each((_, el) => {
    const alt = $(el).attr('alt');
    if (alt === undefined || alt === null) issues.add('Image missing alt text');
  });

  $('input:not([type="hidden"]), textarea, select').each((_, el) => {
    const id = $(el).attr('id');
    const ariaLabel = $(el).attr('aria-label');
    const ariaLabelledBy = $(el).attr('aria-labelledby');
    const hasLabel = id ? $(`label[for="${id}"]`).length > 0 : false;
    if (!hasLabel && !ariaLabel && !ariaLabelledBy) {
      issues.add('Form field missing label or aria-label');
    }
  });

  $('a').each((_, el) => {
    const text = $(el).text().trim();
    const ariaLabel = $(el).attr('aria-label');
    if (!text && !ariaLabel) issues.add('Link with no accessible text');
  });

  if ($('main, [role="main"]').length === 0) issues.add('No main landmark element');
  if ($('button:not([type])').length > 0)    issues.add('Button missing type attribute');

  return Array.from(issues);
};

// ─── Performance score (realistic heuristic) ─────────────────────────────────

const estimatePerformanceScore = ($: CheerioAPI, html: string): number => {
  let score = 100;

  const sizeKb       = Buffer.byteLength(html, 'utf8') / 1024;
  const scriptCount  = $('script[src]').length;
  const cssCount     = $('link[rel="stylesheet"]').length;
  const imgCount     = $('img').length;
  const hasViewport  = $('meta[name="viewport"]').length > 0;
  const hasLazyLoad  = $('img[loading="lazy"]').length > 0;
  const inlineStyles = $('[style]').length;
  const renderBlock  = $('link[rel="stylesheet"]:not([media]), script:not([async]):not([defer]):not([type="module"])').length;

  // Page size penalty (moderate — large HTML isn't always slow)
  if (sizeKb > 500)       score -= 20;
  else if (sizeKb > 200)  score -= 10;
  else if (sizeKb > 100)  score -= 5;

  // Script count penalty
  if (scriptCount > 20)   score -= 20;
  else if (scriptCount > 10) score -= 10;
  else if (scriptCount > 5)  score -= 5;

  // CSS count penalty
  if (cssCount > 10)      score -= 10;
  else if (cssCount > 5)  score -= 5;

  // Image count penalty
  if (imgCount > 30)      score -= 15;
  else if (imgCount > 15) score -= 8;
  else if (imgCount > 8)  score -= 3;

  // Bonuses
  if (hasViewport)        score += 5;   // mobile ready
  if (hasLazyLoad)        score += 5;   // lazy loads images
  if (inlineStyles < 5)   score += 3;   // clean CSS separation
  if (renderBlock < 3)    score += 5;   // minimal render-blocking resources

  // Penalties
  if (renderBlock > 5)    score -= 10;
  if (inlineStyles > 20)  score -= 5;

  return Math.min(100, Math.max(10, Math.round(score)));
};

// ─── Broken links ─────────────────────────────────────────────────────────────

const gatherBrokenLinks = async ($: CheerioAPI, baseUrl: string): Promise<string[]> => {
  const broken: string[] = [];
  const host = new URL(baseUrl).host;
  const links = ($('a[href]').map((_, el) => $(el).attr('href')).get() as string[])
    .map((href) => { try { return new URL(href, baseUrl).toString(); } catch { return undefined; } })
    .filter((href): href is string => !!href && new URL(href).host === host)
    .slice(0, 8);   // limit to 8 to keep response fast

  await Promise.all(
    links.map(async (href) => {
      try {
        const res = await axios.head(href, { timeout: 5000, maxRedirects: 3 });
        if (res.status >= 400) broken.push(href);
      } catch {
        broken.push(href);
      }
    })
  );

  return [...new Set(broken)];
};

// ─── Main export ──────────────────────────────────────────────────────────────

export const inspectWebsite = async (html: string, url: string): Promise<InspectionResult> => {
  const $ = load(html);
  const pageText = normalizeText($.text());
  const hostname = new URL(url).hostname;

  const [contentExtraction, brokenLinks, hosting] = await Promise.all([
    extractContent(html),
    gatherBrokenLinks($, url),
    detectHosting($, html, hostname),
  ]);

  return {
    framework:            detectFramework($, html),
    cms:                  detectCms($, html),
    hosting,
    analytics:            collectAnalytics($, html),
    performanceScore:     estimatePerformanceScore($, html),
    isMobileResponsive:   $('meta[name="viewport"]').length > 0,
    brokenLinks,
    accessibilityIssues:  detectAccessibilityIssues($),
    seoIssues:            detectSeoIssues($),
    sslValid:             url.startsWith('https://'),
    contactInformation:   collectContactInformation($, pageText),
    socialLinks:          collectSocialLinks($),
    businessCategory:     detectCategory(pageText),
    detectedTechnologies: detectTechnologies($, html),
    contentExtraction,
  };
};
