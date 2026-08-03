import axios from 'axios';
import { load } from 'cheerio';
import type { CrawlabilityInfo } from '../types';

export async function getCrawlabilityInfo(url: string, html: string): Promise<CrawlabilityInfo> {
  const $ = load(html);
  const base = new URL(url).origin;

  // robots.txt
  let robotsTxtFound = false;
  let robotsTxtContent: string | undefined;
  try {
    const r = await axios.get(`${base}/robots.txt`, { timeout: 5000, validateStatus: () => true });
    if (r.status === 200 && typeof r.data === 'string' && r.data.toLowerCase().includes('user-agent')) {
      robotsTxtFound = true;
      robotsTxtContent = r.data.slice(0, 1500);
    }
  } catch { /* ignore */ }

  // sitemap.xml
  let sitemapFound = false;
  let sitemapUrl: string | undefined;
  let sitemapUrlCount: number | undefined;
  const sitemapCandidates = [`${base}/sitemap.xml`, `${base}/sitemap_index.xml`, `${base}/sitemap-index.xml`];

  // also check robots.txt for Sitemap: directive
  if (robotsTxtContent) {
    const sitemapMatch = robotsTxtContent.match(/^Sitemap:\s*(.+)$/im);
    if (sitemapMatch?.[1]) sitemapCandidates.unshift(sitemapMatch[1].trim());
  }

  for (const candidate of sitemapCandidates) {
    try {
      const r = await axios.get(candidate, { timeout: 5000, validateStatus: () => true });
      if (r.status === 200 && typeof r.data === 'string' && r.data.includes('<url')) {
        sitemapFound = true;
        sitemapUrl = candidate;
        const matches = r.data.match(/<url>/g);
        sitemapUrlCount = matches?.length ?? 0;
        break;
      }
    } catch { /* ignore */ }
  }

  // Indexability
  const robotsMeta  = $('meta[name="robots"]').attr('content') ?? '';
  const isIndexable = !robotsMeta.toLowerCase().includes('noindex');

  // Canonical
  const canonicalUrl   = $('link[rel="canonical"]').attr('href');
  const hasCanonical   = !!canonicalUrl;

  // Open Graph
  const ogTags: Record<string, string> = {};
  $('meta[property^="og:"], meta[name^="og:"]').each((_, el) => {
    const prop    = $(el).attr('property') ?? $(el).attr('name') ?? '';
    const content = $(el).attr('content')  ?? '';
    if (prop && content) ogTags[prop] = content;
  });
  const requiredOg = ['og:title', 'og:description', 'og:image', 'og:url'];
  const openGraphComplete = requiredOg.every(k => !!ogTags[k]);
  const twitterCardPresent = !!$('meta[name="twitter:card"]').attr('content');

  // Schema markup
  const schemaTypes: string[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const parsed = JSON.parse($(el).text());
      const graphs = Array.isArray(parsed['@graph']) ? parsed['@graph'] : [parsed];
      graphs.forEach((g: Record<string, string>) => {
        if (g['@type']) schemaTypes.push(g['@type']);
      });
    } catch { /* ignore */ }
  });

  return {
    robotsTxtFound,
    robotsTxtContent,
    sitemapFound,
    sitemapUrl,
    sitemapUrlCount,
    isIndexable,
    canonicalUrl,
    hasCanonical,
    openGraphComplete,
    openGraphTags: ogTags,
    twitterCardPresent,
    schemaMarkupFound: schemaTypes.length > 0,
    schemaTypes: [...new Set(schemaTypes)],
  };
}
