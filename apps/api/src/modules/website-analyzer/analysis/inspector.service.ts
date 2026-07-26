import { load, type CheerioAPI } from 'cheerio';
import dns from 'dns/promises';
import axios from 'axios';
import { extractContent } from '../../content-extraction/content.service';

export type InspectionResult = {
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
};

const knownFrameworks = [
  { name: 'React',     pattern: /react(?:\.js)?/i },
  { name: 'Next.js',  pattern: /next(?:\.js)?/i },
  { name: 'Vue.js',   pattern: /vue(?:\.js)?/i },
  { name: 'Angular',  pattern: /angular(?:\.js)?/i },
  { name: 'WordPress',pattern: /wp-content|wordpress/i },
];

const analyticsProviders = ['google-analytics', 'gtag', 'ga.js', 'mixpanel', 'segment', 'hotjar'];
const socialDomains = ['facebook.com', 'twitter.com', 'linkedin.com', 'instagram.com', 'youtube.com', 'tiktok.com'];

const normalizeText = (value: string) => value.replace(/\s+/g, ' ').trim();

const detectCategory = (text: string): string => {
  const normalized = text.toLowerCase();
  if (/ecommerce|online store|shopping cart/.test(normalized)) return 'E-commerce';
  if (/saas|software as a service|software platform/.test(normalized)) return 'SaaS';
  if (/health|medical|clinic/.test(normalized)) return 'Healthcare';
  if (/finance|bank|insurance|investment/.test(normalized)) return 'Finance';
  if (/education|learning|training|academy/.test(normalized)) return 'Education';
  if (/real estate|property|estate/.test(normalized)) return 'Real Estate';
  return 'Professional Services';
};

const detectTechnologies = ($: CheerioAPI): string[] => {
  const technologies = new Set<string>();

  $('script[src], link[href], meta[name="generator"]').each((_, el) => {
    const attrs = ['src', 'href', 'content'] as const;
    for (const attr of attrs) {
      const value = $(el).attr(attr);
      if (!value) continue;
      const lower = value.toLowerCase();
      if (lower.includes('react'))                                technologies.add('React');
      if (lower.includes('next'))                                 technologies.add('Next.js');
      if (lower.includes('angular'))                              technologies.add('Angular');
      if (lower.includes('vue'))                                  technologies.add('Vue.js');
      if (lower.includes('wordpress') || lower.includes('wp-content')) technologies.add('WordPress');
      if (lower.includes('shopify'))                              technologies.add('Shopify');
      if (lower.includes('googleanalytics') || lower.includes('gtag')) technologies.add('Google Analytics');
      if (lower.includes('hotjar'))                               technologies.add('Hotjar');
      if (lower.includes('segment'))                              technologies.add('Segment');
      if (lower.includes('hubspot'))                              technologies.add('HubSpot');
    }
  });

  return Array.from(technologies);
};

const detectFramework = ($: CheerioAPI): string | undefined => {
  const html = $.html();
  const generator = $('meta[name="generator"]').attr('content');
  const source = [html, generator].filter(Boolean).join(' ');
  return knownFrameworks.find((entry) => entry.pattern.test(source))?.name;
};

const detectCms = ($: CheerioAPI): string | undefined => {
  const generator = $('meta[name="generator"]').attr('content') ?? '';
  if (/wordpress/i.test(generator)) return 'WordPress';
  if (/shopify/i.test(generator))   return 'Shopify';
  if (/drupal/i.test(generator))    return 'Drupal';
  if (/joomla/i.test(generator))    return 'Joomla';
  return undefined;
};

const detectHosting = async (hostname: string): Promise<string | undefined> => {
  try {
    const record = await dns.lookup(hostname);
    const ip = record.address;
    if (ip.startsWith('34.') || ip.startsWith('35.'))             return 'Google Cloud';
    if (ip.startsWith('52.') || ip.startsWith('54.'))             return 'AWS';
    if (ip.startsWith('13.') || ip.startsWith('40.'))             return 'Azure';
  } catch {
    return undefined;
  }
  return undefined;
};

const collectSocialLinks = ($: CheerioAPI): string[] => {
  const links: string[] = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;
    for (const domain of socialDomains) {
      if (href.includes(domain)) links.push(href);
    }
  });
  return [...new Set(links)];
};

const collectAnalytics = ($: CheerioAPI): string[] => {
  const found: string[] = [];
  $('script[src], script').each((_, el) => {
    const src  = $(el).attr('src') ?? '';
    const text = $(el).text();
    for (const provider of analyticsProviders) {
      if (src.includes(provider) || text.includes(provider)) found.push(provider);
    }
  });
  return [...new Set(found)];
};

const collectContactInformation = ($: CheerioAPI, text: string): string[] => {
  const contacts = new Set<string>();
  $('a[href^="mailto:"]').each((_, el) => { contacts.add($(el).attr('href') ?? ''); });
  $('a[href^="tel:"]').each((_, el)    => { contacts.add($(el).attr('href') ?? ''); });

  Array.from(text.matchAll(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g))
    .forEach((m) => contacts.add(m[0]));
  // Stricter phone pattern: must look like a real phone number (min 7 digits, typical formats)
  Array.from(text.matchAll(/(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}|\+\d{1,3}[\s.-]\d{2,}[\s.-]\d{2,}[\s.-]\d{2,}/g))
    .forEach((m) => contacts.add(normalizeText(m[0])));

  return Array.from(contacts);
};

const detectSeoIssues = ($: CheerioAPI): string[] => {
  const issues: string[] = [];
  if (!$('title').text().trim())                        issues.push('Missing page title');
  if (!$('meta[name="description"]').attr('content'))   issues.push('Missing meta description');
  if ($('h1').length === 0)                             issues.push('Missing H1 heading');
  return issues;
};

const detectAccessibilityIssues = ($: CheerioAPI): string[] => {
  const issues: string[] = [];
  if (!$('html').attr('lang')) issues.push('Document missing lang attribute');

  $('img').each((_, el) => {
    if (!$(el).attr('alt')) issues.push('Image missing alt text');
  });
  $('input, textarea, select').each((_, el) => {
    const id = $(el).attr('id');
    if (!id || $(`label[for="${id}"]`).length === 0) {
      issues.push('Form field missing associated label');
    }
  });

  return [...new Set(issues)];
};

const gatherBrokenLinks = async ($: CheerioAPI, baseUrl: string): Promise<string[]> => {
  const broken: string[] = [];
  const host = new URL(baseUrl).host;
  const links = ($('a[href]').map((_, el) => $(el).attr('href')).get() as string[])
    .map((href) => { try { return new URL(href, baseUrl).toString(); } catch { return undefined; } })
    .filter((href): href is string => typeof href === 'string')
    .filter((href) => new URL(href).host === host)
    .slice(0, 10);

  await Promise.all(
    links.map(async (href) => {
      try {
        const res = await axios.head(href, { timeout: 7000, maxRedirects: 3 });
        if (res.status >= 400) broken.push(href);
      } catch {
        broken.push(href);
      }
    })
  );

  return [...new Set(broken)];
};

const estimatePerformanceScore = (html: string, assetCount: number): number => {
  if (!html) return 0;
  const sizeKb = Buffer.byteLength(html, 'utf8') / 1024;
  return Math.round(Math.max(0, 100 - sizeKb - assetCount * 2));
};

export const inspectWebsite = async (html: string, url: string): Promise<InspectionResult> => {
  const $ = load(html);
  const pageText = normalizeText($.text());

  const [contentExtraction, brokenLinks, hosting] = await Promise.all([
    extractContent(html),
    gatherBrokenLinks($, url),
    detectHosting(new URL(url).hostname),
  ]);

  return {
    framework:            detectFramework($),
    cms:                  detectCms($),
    hosting,
    analytics:            collectAnalytics($),
    performanceScore:     estimatePerformanceScore(html, $('img, script, link').length),
    isMobileResponsive:   $('meta[name="viewport"]').length > 0,
    brokenLinks,
    accessibilityIssues:  detectAccessibilityIssues($),
    seoIssues:            detectSeoIssues($),
    sslValid:             url.startsWith('https://'),
    contactInformation:   collectContactInformation($, pageText),
    socialLinks:          collectSocialLinks($),
    businessCategory:     detectCategory(pageText),
    detectedTechnologies: detectTechnologies($),
    contentExtraction,
  };
};
