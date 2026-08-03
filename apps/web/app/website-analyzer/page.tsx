'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchJson } from '../../src/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CoreWebVitals {
  lcp?: number;
  cls?: number;
  fcp?: number;
  ttfb?: number;
  tti?: number;
  speedIndex?: number;
  tbt?: number;
  lcpRating?: 'good' | 'needs-improvement' | 'poor';
  clsRating?: 'good' | 'needs-improvement' | 'poor';
  fcpRating?: 'good' | 'needs-improvement' | 'poor';
  ttfbRating?: 'good' | 'needs-improvement' | 'poor';
}

interface LighthouseOpportunity {
  id: string;
  title: string;
  description: string;
  savingsMs?: number;
  impact: 'high' | 'medium' | 'low';
}

interface LighthouseScores {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  opportunities: LighthouseOpportunity[];
  diagnostics: string[];
}

interface DomainInfo {
  domainAge?: string;
  domainAgeMonths?: number;
  registrar?: string;
  createdAt?: string;
  expiresAt?: string;
  registrant?: string;
  isExpiringSoon?: boolean;
}

interface SecurityHeaders {
  hsts?: boolean;
  xFrameOptions?: boolean;
  xContentTypeOptions?: boolean;
  contentSecurityPolicy?: boolean;
  referrerPolicy?: boolean;
  permissionsPolicy?: boolean;
  score: number;
  missing: string[];
  present: string[];
}

interface CrawlabilityInfo {
  robotsTxtFound: boolean;
  sitemapFound: boolean;
  sitemapUrl?: string;
  sitemapUrlCount?: number;
  isIndexable: boolean;
  canonicalUrl?: string;
  hasCanonical: boolean;
  openGraphComplete: boolean;
  openGraphTags: Record<string, string>;
  twitterCardPresent: boolean;
  schemaMarkupFound: boolean;
  schemaTypes: string[];
}

interface ContentInsights {
  wordCount: number;
  readabilityScore: number;
  readabilityGrade: string;
  topKeywords: Array<{ word: string; count: number; density: string }>;
  avgSentenceLength: number;
  hasStructuredContent: boolean;
  contentDepth: 'thin' | 'moderate' | 'deep';
}

interface TrafficRank {
  globalRank?: number;
  inTop100k?: boolean;
  inTop1M?: boolean;
  rankCategory?: string;
  trancoSource?: string;
}

interface AnalysisResult {
  framework?: string;
  cms?: string;
  hosting?: string;
  analytics: string[];
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
  // V2
  coreWebVitals?: CoreWebVitals;
  lighthouseScores?: LighthouseScores;
  lighthouseError?: string;
  domainInfo?: DomainInfo;
  securityHeaders?: SecurityHeaders;
  crawlability?: CrawlabilityInfo;
  contentInsights?: ContentInsights;
  trafficRank?: TrafficRank;
  analysisTimestamp?: string;
}

// ─── Shared UI components ─────────────────────────────────────────────────────

function Badge({ label, color }: { label: string; color: string }) {
  return <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-medium ${color}`}>{label}</span>;
}

function ScoreRing({ score, label }: { score: number; label: string }) {
  const color  = score >= 70 ? 'text-green-600'  : score >= 40 ? 'text-yellow-500' : 'text-red-500';
  const border = score >= 70 ? 'border-green-500' : score >= 40 ? 'border-yellow-400' : 'border-red-400';
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`flex flex-col items-center justify-center rounded-full border-4 ${border} h-20 w-20`}>
        <span className={`text-2xl font-bold ${color}`}>{score}</span>
        <span className="text-[10px] text-slate-500">/ 100</span>
      </div>
      <span className="text-xs font-medium text-slate-600 text-center">{label}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-slate-800">{title}</h3>
      {children}
    </div>
  );
}

function TagList({ items, emptyText = 'None detected' }: { items: string[]; emptyText?: string }) {
  if (!items?.length) return <p className="text-sm text-slate-400">{emptyText}</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <span key={i} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">{item}</span>
      ))}
    </div>
  );
}

function IssueList({ items, emptyText = 'No issues found ✓' }: { items: string[]; emptyText?: string }) {
  if (!items?.length) return <p className="text-sm text-green-600 font-medium">{emptyText}</p>;
  return (
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
          <span className="mt-0.5 text-red-500 shrink-0">✗</span>{item}
        </li>
      ))}
    </ul>
  );
}

function BulletList({ items, max = 6 }: { items: string[]; max?: number }) {
  const [expanded, setExpanded] = useState(false);
  const visible  = expanded ? items : items.slice(0, max);
  const overflow = items.length - max;
  return (
    <ul className="space-y-1">
      {visible.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
          <span className="line-clamp-2">{item}</span>
        </li>
      ))}
      {overflow > 0 && (
        <li>
          <button
            onClick={() => setExpanded(v => !v)}
            className="text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors cursor-pointer mt-0.5"
          >
            {expanded ? '− Show less' : `+${overflow} more`}
          </button>
        </li>
      )}
    </ul>
  );
}

// ─── CWV rating helpers ───────────────────────────────────────────────────────

function ratingColor(r?: string) {
  if (r === 'good')             return 'text-green-600 bg-green-50 border-green-200';
  if (r === 'needs-improvement') return 'text-amber-600 bg-amber-50 border-amber-200';
  return 'text-red-600 bg-red-50 border-red-200';
}

function ratingLabel(r?: string) {
  if (r === 'good')             return 'Good';
  if (r === 'needs-improvement') return 'Needs Work';
  return 'Poor';
}

// ─── Lighthouse section ───────────────────────────────────────────────────────

function LighthouseSection({ scores, cwv, error }: { scores?: LighthouseScores; cwv?: CoreWebVitals; error?: string }) {
  if (error && !scores) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-1 text-sm font-semibold text-slate-800">Lighthouse Analysis</h3>
        <p className="text-xs text-slate-400">{error}</p>
      </div>
    );
  }
  if (!scores) return null;

  const cats = [
    { label: 'Performance',    score: scores.performance    },
    { label: 'Accessibility',  score: scores.accessibility  },
    { label: 'Best Practices', score: scores.bestPractices  },
    { label: 'SEO',            score: scores.seo            },
  ];

  const impactColor = (impact: LighthouseOpportunity['impact']) =>
    impact === 'high' ? 'bg-red-100 text-red-700' : impact === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600';

  return (
    <div className="space-y-4">
      {/* Score rings */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-slate-800">Lighthouse Scores</h3>
        <div className="flex flex-wrap gap-6 justify-around">
          {cats.map(c => <ScoreRing key={c.label} score={c.score} label={c.label} />)}
        </div>
      </div>

      {/* Core Web Vitals */}
      {cwv && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-800">Core Web Vitals</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { key: 'LCP',  value: cwv.lcp  !== undefined ? `${(cwv.lcp / 1000).toFixed(2)}s`  : '—', rating: cwv.lcpRating,  desc: 'Largest Contentful Paint' },
              { key: 'CLS',  value: cwv.cls  !== undefined ? cwv.cls.toFixed(3)                  : '—', rating: cwv.clsRating,  desc: 'Cumulative Layout Shift' },
              { key: 'FCP',  value: cwv.fcp  !== undefined ? `${(cwv.fcp / 1000).toFixed(2)}s`  : '—', rating: cwv.fcpRating,  desc: 'First Contentful Paint' },
              { key: 'TTFB', value: cwv.ttfb !== undefined ? `${cwv.ttfb}ms`                     : '—', rating: cwv.ttfbRating, desc: 'Time to First Byte' },
            ].map(m => (
              <div key={m.key} className={`rounded-xl border p-3 ${ratingColor(m.rating)}`}>
                <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{m.key}</p>
                <p className="text-xl font-black mt-0.5">{m.value}</p>
                <p className="text-[10px] opacity-60 mt-0.5">{m.desc}</p>
                {m.rating && <p className="text-[10px] font-semibold mt-1">{ratingLabel(m.rating)}</p>}
              </div>
            ))}
          </div>

          {/* Additional metrics */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { label: 'Speed Index',  value: cwv.speedIndex !== undefined ? `${(cwv.speedIndex / 1000).toFixed(2)}s` : '—' },
              { label: 'TTI',          value: cwv.tti        !== undefined ? `${(cwv.tti / 1000).toFixed(2)}s`        : '—' },
              { label: 'Total Blocking', value: cwv.tbt      !== undefined ? `${cwv.tbt}ms`                           : '—' },
            ].map(m => (
              <div key={m.label} className="rounded-lg bg-slate-50 border border-slate-200 p-2.5 text-center">
                <p className="text-[10px] text-slate-500 font-medium">{m.label}</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{m.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Opportunities */}
      {scores.opportunities.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-800">Lighthouse Opportunities</h3>
          <div className="space-y-2">
            {scores.opportunities.map((o, i) => (
              <div key={i} className="flex items-start justify-between gap-3 rounded-lg bg-slate-50 border border-slate-200 p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800">{o.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{o.description}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {o.savingsMs !== undefined && (
                    <span className="text-xs font-bold text-slate-700">−{o.savingsMs >= 1000 ? `${(o.savingsMs / 1000).toFixed(1)}s` : `${o.savingsMs}ms`}</span>
                  )}
                  <span className={`text-[10px] font-semibold uppercase rounded-full px-2 py-0.5 ${impactColor(o.impact)}`}>{o.impact}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Domain Intelligence ──────────────────────────────────────────────────────

function DomainSection({ info }: { info?: DomainInfo }) {
  if (!info) return null;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-slate-800">Domain Intelligence</h3>
      {info.isExpiringSoon && (
        <div className="mb-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700 font-medium">
          Domain expiring soon — renew before it lapses.
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Domain Age',  value: info.domainAge ?? '—' },
          { label: 'Registrar',   value: info.registrar  ?? '—' },
          { label: 'Created',     value: info.createdAt  ? new Date(info.createdAt).toLocaleDateString()  : '—' },
          { label: 'Expires',     value: info.expiresAt  ? new Date(info.expiresAt).toLocaleDateString()  : '—' },
        ].map(f => (
          <div key={f.label} className="rounded-lg bg-slate-50 border border-slate-200 p-3">
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">{f.label}</p>
            <p className="text-sm font-semibold text-slate-800 mt-0.5 break-words">{f.value}</p>
          </div>
        ))}
      </div>
      {info.registrant && (
        <p className="mt-2 text-xs text-slate-500">Registrant: <span className="text-slate-700 font-medium">{info.registrant}</span></p>
      )}
    </div>
  );
}

// ─── Security Headers ─────────────────────────────────────────────────────────

function SecuritySection({ headers }: { headers?: SecurityHeaders }) {
  if (!headers) return null;
  const scoreColor = headers.score >= 70 ? 'text-green-600' : headers.score >= 40 ? 'text-amber-600' : 'text-red-600';
  const scoreBg    = headers.score >= 70 ? 'bg-green-50 border-green-200' : headers.score >= 40 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-4">
        <h3 className="text-sm font-semibold text-slate-800">Security Headers</h3>
        <div className={`rounded-xl border px-3 py-1.5 text-center min-w-[60px] ${scoreBg}`}>
          <p className={`text-xl font-black ${scoreColor}`}>{headers.score}</p>
          <p className="text-[10px] text-slate-500">/100</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {[
          { label: 'HSTS',                   present: headers.hsts                   },
          { label: 'X-Frame-Options',         present: headers.xFrameOptions          },
          { label: 'X-Content-Type-Options',  present: headers.xContentTypeOptions    },
          { label: 'Content-Security-Policy', present: headers.contentSecurityPolicy  },
          { label: 'Referrer-Policy',         present: headers.referrerPolicy         },
          { label: 'Permissions-Policy',      present: headers.permissionsPolicy      },
        ].map(h => (
          <div key={h.label} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${h.present ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
            <span>{h.present ? '✓' : '✗'}</span>
            <span>{h.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Crawlability ─────────────────────────────────────────────────────────────

function CrawlabilitySection({ info }: { info?: CrawlabilityInfo }) {
  if (!info) return null;
  const checks = [
    { label: 'robots.txt',      ok: info.robotsTxtFound                                },
    { label: 'XML Sitemap',     ok: info.sitemapFound,   detail: info.sitemapUrlCount !== undefined ? `${info.sitemapUrlCount} URLs` : undefined },
    { label: 'Indexable',       ok: info.isIndexable                                   },
    { label: 'Canonical URL',   ok: info.hasCanonical                                  },
    { label: 'Open Graph Complete', ok: info.openGraphComplete                         },
    { label: 'Twitter Card',    ok: info.twitterCardPresent                            },
    { label: 'Schema Markup',   ok: info.schemaMarkupFound, detail: info.schemaTypes.slice(0,3).join(', ') || undefined },
  ];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-slate-800">Crawlability & Indexing</h3>
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {checks.map(c => (
          <div key={c.label} className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs font-medium ${c.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
            <span className="flex items-center gap-1.5">
              <span>{c.ok ? '✓' : '✗'}</span>
              <span>{c.label}</span>
            </span>
            {c.detail && <span className="text-[10px] opacity-70 font-normal">{c.detail}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Content Insights ─────────────────────────────────────────────────────────

function ContentInsightsSection({ insights }: { insights?: ContentInsights }) {
  if (!insights) return null;
  const depthColor = insights.contentDepth === 'deep' ? 'bg-green-100 text-green-700' : insights.contentDepth === 'moderate' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';
  const readColor  = insights.readabilityScore >= 70 ? 'text-green-600' : insights.readabilityScore >= 50 ? 'text-amber-600' : 'text-red-600';
  const maxDensity = Math.max(...insights.topKeywords.map(k => parseFloat(k.density)));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-slate-800">Content Insights</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-center">
          <p className="text-2xl font-black text-blue-600">{insights.wordCount.toLocaleString()}</p>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5">Word Count</p>
        </div>
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-center">
          <p className={`text-2xl font-black ${readColor}`}>{insights.readabilityScore}</p>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5">Readability</p>
        </div>
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-center">
          <p className="text-2xl font-black text-slate-700">{insights.avgSentenceLength}</p>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5">Avg Sentence</p>
        </div>
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-center">
          <span className={`text-xs font-bold rounded-full px-2.5 py-1 ${depthColor}`}>{insights.contentDepth.charAt(0).toUpperCase() + insights.contentDepth.slice(1)}</span>
          <p className="text-[10px] text-slate-500 font-medium mt-1.5">Content Depth</p>
        </div>
      </div>

      <p className="text-xs text-slate-500 mb-3">Reading Level: <span className="font-semibold text-slate-700">{insights.readabilityGrade}</span></p>

      {insights.topKeywords.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-600 mb-2">Top Keywords</p>
          <div className="space-y-2">
            {insights.topKeywords.map(k => {
              const pct = maxDensity > 0 ? (parseFloat(k.density) / maxDensity) * 100 : 0;
              return (
                <div key={k.word} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-slate-700 w-24 shrink-0">{k.word}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-slate-500 w-12 text-right shrink-0">{k.density} ({k.count}×)</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Traffic Rank ─────────────────────────────────────────────────────────────

function TrafficRankSection({ rank }: { rank?: TrafficRank }) {
  if (!rank) return null;
  const isRanked = rank.inTop1M;
  const badgeColor = rank.inTop100k ? 'bg-green-100 text-green-700 border-green-200' : isRanked ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-600 border-slate-200';
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-slate-800">Traffic Rank (Tranco)</h3>
      <div className="flex items-center gap-4 flex-wrap">
        <div className={`rounded-xl border px-5 py-3 text-center min-w-[120px] ${badgeColor}`}>
          {isRanked && rank.globalRank !== undefined ? (
            <>
              <p className="text-2xl font-black">#{rank.globalRank.toLocaleString()}</p>
              <p className="text-[10px] font-medium mt-0.5">Global Rank</p>
            </>
          ) : (
            <>
              <p className="text-sm font-bold">Not Ranked</p>
              <p className="text-[10px] font-medium mt-0.5">Outside top 1M</p>
            </>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">{rank.rankCategory ?? '—'}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {isRanked ? 'Site is in the Tranco top 1 million domains list.' : 'This site is not in the top 1 million visited domains.'}
          </p>
          {rank.trancoSource && rank.trancoSource !== 'unavailable' && (
            <p className="text-[10px] text-slate-400 mt-1">Tranco list date: {rank.trancoSource}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Problems & SEO Solutions ─────────────────────────────────────────────────

interface Problem {
  issue: string;
  impact: 'high' | 'medium' | 'low';
  solution: string;
  seoTip: string;
}

function buildProblems(r: AnalysisResult): Problem[] {
  const problems: Problem[] = [];

  r.seoIssues.forEach(issue => {
    const lower = issue.toLowerCase();
    let solution = 'Review and fix this SEO issue to improve search engine visibility.';
    let seoTip = 'Addressing this will help search engines better understand your page.';
    if (lower.includes('meta description') || lower.includes('missing meta')) {
      solution = 'Add a unique meta description (150–160 characters) to every page that summarises the content and includes a target keyword.';
      seoTip = 'Meta descriptions directly influence click-through rates in search results. A compelling description can significantly increase organic traffic.';
    } else if (lower.includes('title') || lower.includes('missing title')) {
      solution = 'Set a descriptive <title> tag (50–60 characters) on every page including your primary keyword near the beginning.';
      seoTip = 'Page titles are one of the strongest on-page SEO signals. Missing or duplicate titles cause ranking issues.';
    } else if (lower.includes('h1') || lower.includes('heading')) {
      solution = 'Ensure each page has exactly one H1 tag containing the primary keyword. Use H2–H6 tags to create a logical content hierarchy.';
      seoTip = 'A proper heading structure helps search engines parse content relevance and improves readability for users.';
    } else if (lower.includes('canonical')) {
      solution = 'Add canonical tags to indicate the preferred version of each URL and prevent duplicate content penalties.';
      seoTip = 'Canonical tags are essential for sites with similar or duplicate content spread across multiple URLs.';
    } else if (lower.includes('robots') || lower.includes('noindex')) {
      solution = 'Review your robots.txt and meta robots tags. Ensure important pages are not accidentally blocked from indexing.';
      seoTip = 'Accidentally blocking pages with noindex or disallow rules can remove them from search results entirely.';
    } else if (lower.includes('alt') || lower.includes('image')) {
      solution = 'Add descriptive alt attributes to all images. Include relevant keywords naturally without keyword stuffing.';
      seoTip = 'Alt text helps search engines index images and improves accessibility, which is a ranking factor.';
    }
    problems.push({ issue, impact: 'high', solution, seoTip });
  });

  r.accessibilityIssues.forEach(issue => {
    const lower = issue.toLowerCase();
    let solution = 'Fix this accessibility issue to improve usability for all users.';
    let seoTip = 'Accessibility improvements often align with SEO best practices and can improve rankings.';
    if (lower.includes('alt') || lower.includes('image')) {
      solution = 'Add descriptive alt text to all images. Decorative images should use alt="".';
      seoTip = 'Proper alt text improves both accessibility and image SEO, helping your images rank in Google Images.';
    } else if (lower.includes('link') || lower.includes('anchor')) {
      solution = 'Give all links descriptive text. Replace "click here" with meaningful phrases describing the destination.';
      seoTip = 'Descriptive anchor text helps search engines understand what the linked page is about and passes more relevant link equity.';
    } else if (lower.includes('label') || lower.includes('form') || lower.includes('input')) {
      solution = 'Associate every form input with a visible <label> element using the for/id attribute pair.';
      seoTip = 'Well-labeled forms improve user engagement, reducing form abandonment and improving conversion signals.';
    } else if (lower.includes('button') || lower.includes('type')) {
      solution = 'Add type="button", type="submit", or type="reset" to all <button> elements to define their intended behaviour.';
      seoTip = 'Properly functioning interactive elements improve user experience, reducing bounce rate.';
    }
    problems.push({ issue, impact: 'medium', solution, seoTip });
  });

  if (!r.sslValid) {
    problems.push({
      issue: 'No SSL certificate (HTTP)',
      impact: 'high',
      solution: "Install an SSL certificate (free via Let's Encrypt) and redirect all HTTP traffic to HTTPS.",
      seoTip: 'HTTPS is a confirmed Google ranking factor. Non-HTTPS sites are marked as "Not Secure" in browsers, reducing user trust and click-through rates.',
    });
  }

  if (!r.isMobileResponsive) {
    problems.push({
      issue: 'Not mobile responsive',
      impact: 'high',
      solution: "Implement a responsive design using CSS media queries or a mobile-first framework. Test with Google's Mobile-Friendly Test tool.",
      seoTip: 'Google uses mobile-first indexing, meaning the mobile version of your site is the primary version used for ranking.',
    });
  }

  if ((r.performanceScore ?? 100) < 50) {
    problems.push({
      issue: `Low performance score (${r.performanceScore}/100)`,
      impact: 'high',
      solution: 'Run a Lighthouse audit, compress images, remove render-blocking resources, enable lazy loading, and use a CDN.',
      seoTip: 'Core Web Vitals (LCP, CLS, FID) are Google ranking factors. A score below 50 significantly hurts search rankings.',
    });
  } else if ((r.performanceScore ?? 100) < 70) {
    problems.push({
      issue: `Performance needs improvement (${r.performanceScore}/100)`,
      impact: 'medium',
      solution: 'Optimise images to WebP, defer non-critical JavaScript, and enable browser caching headers.',
      seoTip: 'Improving performance from 50–70 range to 90+ can move pages up several positions in search results.',
    });
  }

  if (r.brokenLinks.length > 0) {
    problems.push({
      issue: `${r.brokenLinks.length} broken link${r.brokenLinks.length > 1 ? 's' : ''} detected`,
      impact: 'medium',
      solution: 'Fix or remove all broken links. Set up 301 redirects for moved content and regularly audit links with a crawl tool.',
      seoTip: 'Broken links create a poor user experience and waste crawl budget. Google may lower the trust score of pages with many broken links.',
    });
  }

  if (!r.contactInformation.length) {
    problems.push({
      issue: 'No contact information found',
      impact: 'low',
      solution: 'Add a visible contact page with phone, email, and physical address. Include schema.org LocalBusiness markup.',
      seoTip: 'Contact information signals trustworthiness (E-E-A-T) to Google. Local businesses especially benefit from NAP consistency.',
    });
  }

  if (r.securityHeaders && r.securityHeaders.score < 50) {
    problems.push({
      issue: `Security headers score low (${r.securityHeaders.score}/100)`,
      impact: 'medium',
      solution: `Add missing headers: ${r.securityHeaders.missing.join(', ')}. Configure these in your web server or CDN settings.`,
      seoTip: 'Security headers protect users and signal trustworthiness to Google, which is a factor in E-E-A-T evaluations.',
    });
  }

  if (r.crawlability && !r.crawlability.sitemapFound) {
    problems.push({
      issue: 'No XML sitemap found',
      impact: 'medium',
      solution: 'Create an XML sitemap and submit it to Google Search Console. Most CMS platforms can generate one automatically.',
      seoTip: 'A sitemap speeds up indexing and ensures all pages are discoverable by search engines.',
    });
  }

  if (r.contentInsights && r.contentInsights.contentDepth === 'thin') {
    problems.push({
      issue: `Thin content (${r.contentInsights.wordCount} words)`,
      impact: 'medium',
      solution: 'Expand page content to at least 500–800 words. Add more detailed descriptions, FAQs, or supporting information.',
      seoTip: 'Google considers thin content a quality issue. Pages with less than 300 words often rank poorly for competitive keywords.',
    });
  }

  return problems;
}

const impactConfig = {
  high:   { label: 'High',   bg: 'bg-red-50',   border: 'border-red-200',   badge: 'bg-red-100 text-red-700',    dot: 'bg-red-500'   },
  medium: { label: 'Medium', bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  low:    { label: 'Low',    bg: 'bg-slate-50', border: 'border-slate-200', badge: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
};

function ProblemsSection({ result }: { result: AnalysisResult }) {
  const problems = buildProblems(result);
  if (!problems.length) return null;
  const high   = problems.filter(p => p.impact === 'high');
  const medium = problems.filter(p => p.impact === 'medium');
  const low    = problems.filter(p => p.impact === 'low');
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Website Problems & Solutions</h3>
          <p className="text-xs text-slate-500 mt-0.5">Identified issues with actionable fixes and SEO improvement tips.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {high.length   > 0 && <span className="rounded-full bg-red-100 text-red-700 text-xs font-medium px-2.5 py-0.5">{high.length} High</span>}
          {medium.length > 0 && <span className="rounded-full bg-amber-100 text-amber-700 text-xs font-medium px-2.5 py-0.5">{medium.length} Medium</span>}
          {low.length    > 0 && <span className="rounded-full bg-slate-100 text-slate-600 text-xs font-medium px-2.5 py-0.5">{low.length} Low</span>}
        </div>
      </div>
      <div className="space-y-3">
        {problems.map((p, i) => {
          const cfg = impactConfig[p.impact];
          return (
            <div key={i} className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4 space-y-2`}>
              <div className="flex items-start gap-2.5">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${cfg.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-slate-800">{p.issue}</p>
                    <span className={`text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5 ${cfg.badge}`}>{cfg.label}</span>
                  </div>
                  <div className="mt-2 space-y-1.5">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-0.5">Solution</p>
                      <p className="text-xs text-slate-700 leading-relaxed">{p.solution}</p>
                    </div>
                    <div className="rounded-lg bg-white/70 border border-blue-100 px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600 mb-0.5">SEO Impact</p>
                      <p className="text-xs text-slate-600 leading-relaxed">{p.seoTip}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function WebsiteAnalyzerPage() {
  const router = useRouter();
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;

  const [url, setUrl]                     = useState(searchParams?.get('url') ?? '');
  const [result, setResult]               = useState<AnalysisResult | null>(null);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [saving, setSaving]               = useState(false);
  const [savedClientId, setSavedClientId] = useState<string | null>(searchParams?.get('clientId') ?? null);
  const [clientName, setClientName]       = useState('');
  const [showSaveForm, setShowSaveForm]   = useState(false);
  const [creatingProposal, setCreatingProposal] = useState(false);

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSavedClientId(null);
    setShowSaveForm(false);
    try {
      const data = await fetchJson<AnalysisResult>('/api/website-analyzer/analyze', {
        method: 'POST',
        body: JSON.stringify({ websiteUrl: url.trim() }),
      });
      setResult(data);
      const title = data.contentExtraction?.metadata?.title ?? '';
      setClientName(title || url.trim());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToCrm = async () => {
    if (!clientName.trim() || !result) return;
    setSaving(true);
    try {
      const res = await fetchJson<{ clientId: string }>('/api/crm/clients', {
        method: 'POST',
        body: JSON.stringify({
          name: clientName.trim(),
          websiteUrl: url.trim(),
          businessCategory: result.businessCategory,
          contactEmail: result.contactInformation.find(c => c.includes('@')) ?? '',
          contactPhone: '',
          socialLinks: result.socialLinks,
        }),
      });
      setSavedClientId(res.clientId);
      setShowSaveForm(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateProposal = async () => {
    if (!result) return;
    setCreatingProposal(true);
    try {
      const siteName = result.contentExtraction?.metadata?.title || url.trim();
      const res = await fetchJson<{ proposal: { proposalId: string } }>('/api/proposals', {
        method: 'POST',
        body: JSON.stringify({
          clientId: savedClientId ?? 'unknown-client',
          title: `Proposal for ${siteName}`,
          status: 'draft',
          submittedAt: null,
          version: 1,
          executiveSummary: buildExecutiveSummary(result, url),
          scope: buildScope(result),
          timeline: '4–8 weeks depending on scope',
          deliverables: buildDeliverables(result),
          pricing: '',
          maintenancePlan: 'Monthly maintenance retainer available upon request.',
          whyChooseUs: '',
          caseStudies: '',
          terms: 'Net 30 payment terms. 50% deposit required to begin work.',
          signature: '',
          metadata: { sourceUrl: url, analyzedAt: new Date().toISOString() },
        }),
      });
      router.push(`/proposals/${res.proposal.proposalId}`);
    } catch (err) {
      setError((err as Error).message);
      setCreatingProposal(false);
    }
  };

  return (
    <main className="p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="page-header">
          <h1 className="text-2xl font-bold text-slate-900">Website Analyzer</h1>
          <p className="mt-1 text-sm text-slate-500">Crawl any website and extract technology, SEO, performance, Lighthouse, and content insights.</p>
        </div>

        {/* URL input */}
        <div className="card">
          <div className="flex gap-3">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !loading && url && handleAnalyze()}
              className="input-base flex-1"
              placeholder="fit29.com or https://example.com"
            />
            <button onClick={handleAnalyze} disabled={loading || !url.trim()} className="btn-primary shrink-0">
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>Analyzing…
                </span>
              ) : 'Analyze'}
            </button>
          </div>
          {loading && (
            <p className="mt-2 text-xs text-slate-400">Running Lighthouse, WHOIS, security headers, and Tranco rank lookup — this may take 30–60 seconds.</p>
          )}
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">
            <strong>Error:</strong> {error}
          </div>
        )}

        {result && (
          <div className="space-y-4">
            {/* Action bar */}
            <div className="card flex flex-wrap items-center justify-between gap-3 border-blue-100 bg-blue-50">
              <div>
                <p className="text-sm font-semibold text-blue-900">Analysis complete for <span className="font-mono">{url}</span></p>
                <p className="text-xs text-blue-600 mt-0.5">
                  {savedClientId ? '✓ Saved to CRM' : 'Save to CRM to track this client and link proposals.'}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {!savedClientId && !showSaveForm && (
                  <button onClick={() => setShowSaveForm(true)} className="btn-secondary text-sm px-4 py-2">Save to CRM</button>
                )}
                <button onClick={handleCreateProposal} disabled={creatingProposal} className="btn-primary text-sm px-4 py-2">
                  {creatingProposal ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>Creating…
                    </span>
                  ) : 'Create Proposal'}
                </button>
              </div>
            </div>

            {/* Save to CRM form */}
            {showSaveForm && (
              <div className="card border-green-100 bg-green-50 flex items-end gap-3">
                <label className="flex-1 flex flex-col gap-1">
                  <span className="text-xs font-semibold text-green-800 uppercase tracking-wide">Client Name</span>
                  <input className="input-base" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Client / Company name" />
                </label>
                <button onClick={handleSaveToCrm} disabled={saving || !clientName.trim()} className="btn-primary shrink-0">{saving ? 'Saving…' : 'Save'}</button>
                <button onClick={() => setShowSaveForm(false)} className="btn-secondary shrink-0">Cancel</button>
              </div>
            )}

            {/* Metrics overview */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="card flex flex-col items-center justify-center">
                <ScoreRing score={result.performanceScore ?? 0} label="Performance" />
              </div>
              <div className="card flex flex-col gap-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Security</p>
                <Badge label={result.sslValid ? 'SSL Valid ✓' : 'No SSL ✗'} color={result.sslValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} />
                <Badge label={result.isMobileResponsive ? 'Mobile Ready ✓' : 'Not Mobile ✗'} color={result.isMobileResponsive ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'} />
              </div>
              <div className="card flex flex-col gap-1.5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Stack</p>
                <p className="text-xs text-slate-700"><span className="font-medium">Framework:</span> {result.framework ?? '—'}</p>
                <p className="text-xs text-slate-700"><span className="font-medium">CMS:</span> {result.cms ?? '—'}</p>
                <p className="text-xs text-slate-700"><span className="font-medium">Hosting:</span> {result.hosting ?? '—'}</p>
              </div>
              <div className="card flex flex-col gap-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Business</p>
                <Badge label={result.businessCategory} color="bg-blue-100 text-blue-700" />
                {result.analytics.slice(0, 2).map((a, i) => <Badge key={i} label={a} color="bg-purple-100 text-purple-700" />)}
              </div>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {[
                { label: 'SEO Issues',       value: result.seoIssues.length,           color: result.seoIssues.length > 0 ? 'text-red-600' : 'text-green-600' },
                { label: 'Accessibility',    value: result.accessibilityIssues.length, color: result.accessibilityIssues.length > 0 ? 'text-amber-600' : 'text-green-600' },
                { label: 'Broken Links',     value: result.brokenLinks.length,         color: result.brokenLinks.length > 0 ? 'text-red-600' : 'text-green-600' },
                { label: 'Technologies',     value: result.detectedTechnologies.length, color: 'text-blue-600' },
                { label: 'Content Sections', value: [result.contentExtraction.headings, result.contentExtraction.services, result.contentExtraction.ctas, result.contentExtraction.pricing, result.contentExtraction.navigation, result.contentExtraction.forms].filter(a => a.length > 0).length, color: 'text-indigo-600' },
              ].map(s => (
                <div key={s.label} className="card flex flex-col gap-0.5 py-3 items-center text-center">
                  <span className={`text-2xl font-black ${s.color}`}>{s.value}</span>
                  <span className="text-[10px] text-slate-500 font-medium leading-tight">{s.label}</span>
                </div>
              ))}
            </div>

            {/* Lighthouse + Core Web Vitals */}
            <LighthouseSection scores={result.lighthouseScores} cwv={result.coreWebVitals} error={result.lighthouseError} />

            {/* Domain + Traffic rank */}
            <div className="grid gap-4 sm:grid-cols-2">
              <DomainSection info={result.domainInfo} />
              <TrafficRankSection rank={result.trafficRank} />
            </div>

            {/* Security + Crawlability */}
            <div className="grid gap-4 sm:grid-cols-2">
              <SecuritySection headers={result.securityHeaders} />
              <CrawlabilitySection info={result.crawlability} />
            </div>

            {/* Content Insights */}
            <ContentInsightsSection insights={result.contentInsights} />

            {/* Issues */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Section title={`SEO Issues (${result.seoIssues.length})`}><IssueList items={result.seoIssues} /></Section>
              <Section title={`Accessibility (${result.accessibilityIssues.length})`}><IssueList items={result.accessibilityIssues} /></Section>
              <Section title={`Broken Links (${result.brokenLinks.length})`}><IssueList items={result.brokenLinks} emptyText="No broken links ✓" /></Section>
            </div>

            <Section title="Detected Technologies"><TagList items={result.detectedTechnologies} /></Section>

            <div className="grid gap-4 sm:grid-cols-2">
              <Section title="Contact Info"><TagList items={result.contactInformation} emptyText="None found" /></Section>
              <Section title="Social Links">
                {!result.socialLinks.length ? <p className="text-sm text-slate-400">None found</p> : (
                  <ul className="space-y-1">{result.socialLinks.map((l, i) => <li key={i}><a href={l} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline break-all">{l}</a></li>)}</ul>
                )}
              </Section>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Section title="Headings"><BulletList items={result.contentExtraction.headings} max={8} /></Section>
              <Section title="Navigation"><TagList items={result.contentExtraction.navigation} /></Section>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Section title="CTAs"><TagList items={result.contentExtraction.ctas} /></Section>
              <Section title="Services"><BulletList items={result.contentExtraction.services} max={6} /></Section>
            </div>

            {result.contentExtraction.pricing.length > 0 && (
              <Section title="Pricing Information"><BulletList items={result.contentExtraction.pricing} max={6} /></Section>
            )}

            <Section title="Page Metadata">
              {!Object.keys(result.contentExtraction.metadata).length ? <p className="text-sm text-slate-400">None</p> : (
                <dl className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                  {Object.entries(result.contentExtraction.metadata).map(([k, v]) => (
                    <div key={k} className="flex gap-2 text-xs"><dt className="font-medium text-slate-600 shrink-0">{k}:</dt><dd className="text-slate-700 break-all">{v}</dd></div>
                  ))}
                </dl>
              )}
            </Section>

            {/* Problems & Solutions */}
            <ProblemsSection result={result} />
          </div>
        )}
      </div>
    </main>
  );
}

// ─── Proposal auto-fill helpers ───────────────────────────────────────────────

function buildExecutiveSummary(r: AnalysisResult, url: string): string {
  const name  = r.contentExtraction?.metadata?.title || url;
  const techs = r.detectedTechnologies.slice(0, 3).join(', ') || 'standard web technologies';
  const issues = [...r.seoIssues, ...r.accessibilityIssues].length;
  return `${name} is a ${r.businessCategory} website built on ${techs}. ` +
    `Our analysis identified ${issues} improvement opportunities across SEO, accessibility, and performance. ` +
    `This proposal outlines our recommended approach to modernise and optimise the platform.`;
}

function buildScope(r: AnalysisResult): string {
  const lines: string[] = [];
  if (r.seoIssues.length)           lines.push(`• SEO improvements: ${r.seoIssues.join(', ')}`);
  if (r.accessibilityIssues.length) lines.push(`• Accessibility fixes: ${r.accessibilityIssues.slice(0, 3).join(', ')}`);
  if (!r.isMobileResponsive)        lines.push('• Mobile responsiveness implementation');
  if ((r.performanceScore ?? 100) < 60) lines.push('• Performance optimisation (current score: ' + r.performanceScore + '/100)');
  if (r.brokenLinks.length)         lines.push(`• Fix ${r.brokenLinks.length} broken link(s)`);
  if (!lines.length)                lines.push('• General website audit and optimisation');
  return lines.join('\n');
}

function buildDeliverables(r: AnalysisResult): string {
  const items = [
    '• Full website audit report',
    r.seoIssues.length ? '• SEO optimisation' : '',
    r.accessibilityIssues.length ? '• Accessibility remediation' : '',
    '• Performance improvements',
    '• Updated analytics setup',
    '• Final QA and deployment',
  ].filter(Boolean);
  return items.join('\n');
}
