'use client';

import { useState } from 'react';
import { fetchJson } from '../../src/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

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
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}

function ScoreRing({ score }: { score: number }) {
  const color =
    score >= 70 ? 'text-green-600' : score >= 40 ? 'text-yellow-500' : 'text-red-500';
  return (
    <div className={`flex flex-col items-center justify-center rounded-full border-4 ${score >= 70 ? 'border-green-500' : score >= 40 ? 'border-yellow-400' : 'border-red-400'} h-20 w-20`}>
      <span className={`text-2xl font-bold ${color}`}>{score}</span>
      <span className="text-[10px] text-slate-500">/ 100</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-base font-semibold text-slate-800">{title}</h3>
      {children}
    </div>
  );
}

function TagList({ items, emptyText = 'None detected' }: { items: string[]; emptyText?: string }) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-slate-400">{emptyText}</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <span key={i} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">
          {item}
        </span>
      ))}
    </div>
  );
}

function IssueList({ items, emptyText = 'No issues found ✓' }: { items: string[]; emptyText?: string }) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-green-600 font-medium">{emptyText}</p>;
  }
  return (
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
          <span className="mt-0.5 text-red-500">✗</span>
          {item}
        </li>
      ))}
    </ul>
  );
}

function BulletList({ items, max = 8 }: { items: string[]; max?: number }) {
  const visible = items.slice(0, max);
  return (
    <ul className="space-y-1">
      {visible.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
          <span className="line-clamp-2">{item}</span>
        </li>
      ))}
      {items.length > max && (
        <li className="text-xs text-slate-400">+{items.length - max} more…</li>
      )}
    </ul>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function WebsiteAnalyzerPage() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await fetchJson<AnalysisResult>('/api/website-analyzer/analyze', {
        method: 'POST',
        body: JSON.stringify({ websiteUrl: url.trim() }),
      });
      setResult(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">

        {/* Header */}
        <section>
          <h1 className="text-3xl font-bold text-slate-900">Website Analyzer</h1>
          <p className="mt-1 text-slate-500">
            Crawl any website and extract technology, SEO, performance, and accessibility insights.
          </p>
        </section>

        {/* Input */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Website URL</span>
            <div className="flex gap-3">
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !loading && url && handleAnalyze()}
                className="flex-1 rounded-md border border-slate-300 bg-slate-50 px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="fit29.com or https://example.com"
              />
              <button
                onClick={handleAnalyze}
                disabled={loading || !url.trim()}
                className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Analyzing…
                  </span>
                ) : 'Analyze'}
              </button>
            </div>
          </label>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">

            {/* Overview row */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <ScoreRing score={result.performanceScore ?? 0} />
                <p className="mt-2 text-xs font-medium text-slate-500">Performance</p>
              </div>

              <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Security</p>
                <Badge
                  label={result.sslValid ? 'SSL Valid ✓' : 'No SSL ✗'}
                  color={result.sslValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                />
                <Badge
                  label={result.isMobileResponsive ? 'Mobile Ready ✓' : 'Not Mobile ✗'}
                  color={result.isMobileResponsive ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}
                />
              </div>

              <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Stack</p>
                <p className="text-sm text-slate-700"><span className="font-medium">Framework:</span> {result.framework ?? '—'}</p>
                <p className="text-sm text-slate-700"><span className="font-medium">CMS:</span> {result.cms ?? '—'}</p>
                <p className="text-sm text-slate-700"><span className="font-medium">Hosting:</span> {result.hosting ?? '—'}</p>
              </div>

              <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Business</p>
                <Badge label={result.businessCategory} color="bg-blue-100 text-blue-700" />
                {result.analytics.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {result.analytics.map((a, i) => (
                      <Badge key={i} label={a} color="bg-purple-100 text-purple-700" />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Issues row */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Section title={`SEO Issues (${result.seoIssues.length})`}>
                <IssueList items={result.seoIssues} />
              </Section>
              <Section title={`Accessibility Issues (${result.accessibilityIssues.length})`}>
                <IssueList items={result.accessibilityIssues} />
              </Section>
              <Section title={`Broken Links (${result.brokenLinks.length})`}>
                <IssueList items={result.brokenLinks} emptyText="No broken links found ✓" />
              </Section>
            </div>

            {/* Technologies */}
            <Section title="Detected Technologies">
              <TagList items={result.detectedTechnologies} />
            </Section>

            {/* Contact + Social */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Section title="Contact Information">
                <TagList items={result.contactInformation} emptyText="No contact info found" />
              </Section>
              <Section title="Social Links">
                {result.socialLinks.length === 0 ? (
                  <p className="text-sm text-slate-400">No social links found</p>
                ) : (
                  <ul className="space-y-1">
                    {result.socialLinks.map((link, i) => (
                      <li key={i}>
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 underline break-all"
                        >
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            </div>

            {/* Content Extraction */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Section title="Page Headings">
                <BulletList items={result.contentExtraction.headings} max={10} />
              </Section>
              <Section title="Navigation">
                <TagList items={result.contentExtraction.navigation} />
              </Section>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Section title="CTAs Detected">
                <TagList items={result.contentExtraction.ctas} />
              </Section>
              <Section title="Services Detected">
                <BulletList items={result.contentExtraction.services} max={8} />
              </Section>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Section title="Pricing Information">
                <BulletList items={result.contentExtraction.pricing} max={6} />
              </Section>
              <Section title="Testimonials">
                <BulletList items={result.contentExtraction.testimonials} max={4} />
              </Section>
            </div>

            {/* Meta */}
            <Section title="Page Metadata">
              {Object.keys(result.contentExtraction.metadata).length === 0 ? (
                <p className="text-sm text-slate-400">No metadata found</p>
              ) : (
                <dl className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                  {Object.entries(result.contentExtraction.metadata).map(([k, v]) => (
                    <div key={k} className="flex gap-2 text-sm">
                      <dt className="font-medium text-slate-600 shrink-0">{k}:</dt>
                      <dd className="text-slate-700 break-all">{v}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </Section>

            {/* Key paragraphs */}
            <Section title="Key Content Paragraphs">
              <div className="space-y-2">
                {result.contentExtraction.paragraphs.slice(0, 5).map((p, i) => (
                  <p key={i} className="text-sm text-slate-600 line-clamp-3 border-l-2 border-blue-200 pl-3">
                    {p}
                  </p>
                ))}
                {result.contentExtraction.paragraphs.length > 5 && (
                  <p className="text-xs text-slate-400">+{result.contentExtraction.paragraphs.length - 5} more paragraphs</p>
                )}
              </div>
            </Section>

          </div>
        )}
      </div>
    </main>
  );
}
