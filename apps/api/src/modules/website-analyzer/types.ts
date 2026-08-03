export type WebsiteAnalyzerRequest = {
  websiteUrl: string;
  clientId?: string;
  userId?: string;
  crawlDepth?: number;
};

// ─── Core Web Vitals from Lighthouse ─────────────────────────────────────────

export type CoreWebVitals = {
  lcp?: number;           // Largest Contentful Paint (ms)
  cls?: number;           // Cumulative Layout Shift (score)
  fcp?: number;           // First Contentful Paint (ms)
  ttfb?: number;          // Time to First Byte (ms)
  tti?: number;           // Time to Interactive (ms)
  speedIndex?: number;    // Speed Index (ms)
  tbt?: number;           // Total Blocking Time (ms)
  lcpRating?: 'good' | 'needs-improvement' | 'poor';
  clsRating?: 'good' | 'needs-improvement' | 'poor';
  fcpRating?: 'good' | 'needs-improvement' | 'poor';
  ttfbRating?: 'good' | 'needs-improvement' | 'poor';
};

export type LighthouseScores = {
  performance: number;    // 0–100
  accessibility: number;  // 0–100
  bestPractices: number;  // 0–100
  seo: number;            // 0–100
  opportunities: LighthouseOpportunity[];
  diagnostics: string[];
};

export type LighthouseOpportunity = {
  id: string;
  title: string;
  description: string;
  savingsMs?: number;     // potential milliseconds saved
  impact: 'high' | 'medium' | 'low';
};

// ─── Domain intelligence ──────────────────────────────────────────────────────

export type DomainInfo = {
  domainAge?: string;         // e.g. "3 years 4 months"
  domainAgeMonths?: number;
  registrar?: string;
  createdAt?: string;
  expiresAt?: string;
  registrant?: string;
  isExpiringSoon?: boolean;   // within 90 days
};

// ─── HTTP Security Headers ────────────────────────────────────────────────────

export type SecurityHeaders = {
  hsts?: boolean;
  xFrameOptions?: boolean;
  xContentTypeOptions?: boolean;
  contentSecurityPolicy?: boolean;
  referrerPolicy?: boolean;
  permissionsPolicy?: boolean;
  score: number;        // 0–100 based on headers present
  missing: string[];    // list of missing security headers
  present: string[];    // list of present security headers
};

// ─── Crawlability ─────────────────────────────────────────────────────────────

export type CrawlabilityInfo = {
  robotsTxtFound: boolean;
  robotsTxtContent?: string;
  sitemapFound: boolean;
  sitemapUrl?: string;
  sitemapUrlCount?: number;
  isIndexable: boolean;           // no noindex on homepage
  canonicalUrl?: string;
  hasCanonical: boolean;
  openGraphComplete: boolean;
  openGraphTags: Record<string, string>;
  twitterCardPresent: boolean;
  schemaMarkupFound: boolean;
  schemaTypes: string[];
};

// ─── Content intelligence ─────────────────────────────────────────────────────

export type ContentInsights = {
  wordCount: number;
  readabilityScore: number;       // Flesch-Kincaid 0–100 (higher = easier)
  readabilityGrade: string;       // e.g. "Grade 8", "College level"
  topKeywords: Array<{ word: string; count: number; density: string }>;
  avgSentenceLength: number;
  hasStructuredContent: boolean;  // has lists, tables, code blocks
  contentDepth: 'thin' | 'moderate' | 'deep'; // based on word count
};

// ─── Traffic rank ─────────────────────────────────────────────────────────────

export type TrafficRank = {
  globalRank?: number;       // from Tranco top-1M list
  inTop100k?: boolean;
  inTop1M?: boolean;
  rankCategory?: string;     // e.g. "Top 10k", "Top 100k", "Not ranked"
  trancoSource?: string;     // Tranco list date
};

// ─── Full response ────────────────────────────────────────────────────────────

export type WebsiteAnalyzerResponse = {
  // V1 fields (unchanged)
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
  contentExtraction: {
    headings: string[];
    paragraphs: string[];
    services: string[];
    testimonials: string[];
    pricing: string[];
    forms: string[];
    ctas: string[];
    navigation: string[];
    footer: string[];
    metadata: Record<string, string>;
  };

  // V2 new fields
  coreWebVitals?: CoreWebVitals;
  lighthouseScores?: LighthouseScores;
  domainInfo?: DomainInfo;
  securityHeaders?: SecurityHeaders;
  crawlability?: CrawlabilityInfo;
  contentInsights?: ContentInsights;
  trafficRank?: TrafficRank;

  // Analysis metadata
  analysisTimestamp?: string;
  lighthouseError?: string;   // if Lighthouse timed out, show error gracefully
};
