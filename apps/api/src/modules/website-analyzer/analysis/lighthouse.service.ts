import { chromium } from 'playwright';
import type { LighthouseScores, CoreWebVitals, LighthouseOpportunity } from '../types';

const TIMEOUT_MS = 45_000; // Lighthouse can be slow on cold starts

// Rating thresholds
const lcpRating = (v: number): CoreWebVitals['lcpRating'] =>
  v <= 2500 ? 'good' : v <= 4000 ? 'needs-improvement' : 'poor';
const clsRating = (v: number): CoreWebVitals['clsRating'] =>
  v <= 0.1 ? 'good' : v <= 0.25 ? 'needs-improvement' : 'poor';
const fcpRating = (v: number): CoreWebVitals['fcpRating'] =>
  v <= 1800 ? 'good' : v <= 3000 ? 'needs-improvement' : 'poor';
const ttfbRating = (v: number): CoreWebVitals['ttfbRating'] =>
  v <= 800 ? 'good' : v <= 1800 ? 'needs-improvement' : 'poor';

const impactFromScore = (score: number | null): LighthouseOpportunity['impact'] => {
  if (score === null) return 'medium';
  if (score < 0.5) return 'high';
  if (score < 0.9) return 'medium';
  return 'low';
};

export async function runLighthouse(url: string): Promise<{
  coreWebVitals: CoreWebVitals;
  lighthouseScores: LighthouseScores;
} | null> {
  let browser: ReturnType<typeof chromium.launch> extends Promise<infer T> ? T : never = null as never;

  try {
    // Launch Chromium via Playwright (already installed)
    browser = await chromium.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    const port = 9222 + Math.floor(Math.random() * 1000);

    // We use lighthouse programmatically with the Playwright browser's CDP endpoint
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const lighthouse = require('lighthouse') as typeof import('lighthouse');

    const result = await Promise.race([
      lighthouse(url, {
        port,
        output: 'json',
        logLevel: 'silent',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        formFactor: 'desktop',
        screenEmulation: { disabled: true },
        throttlingMethod: 'simulate',
        skipAudits: ['uses-http2', 'valid-source-maps'],
      }),
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Lighthouse timeout')), TIMEOUT_MS)
      ),
    ]);

    if (!result || !result.lhr) return null;

    const lhr = result.lhr;

    // ─── Core Web Vitals ────────────────────────────────────────────────────
    const getNumeric = (id: string): number | undefined => {
      const audit = lhr.audits?.[id];
      return audit?.numericValue ?? undefined;
    };

    const lcpMs  = getNumeric('largest-contentful-paint');
    const clsVal = getNumeric('cumulative-layout-shift');
    const fcpMs  = getNumeric('first-contentful-paint');
    const ttfbMs = getNumeric('server-response-time');
    const ttiMs  = getNumeric('interactive');
    const siMs   = getNumeric('speed-index');
    const tbtMs  = getNumeric('total-blocking-time');

    const cwv: CoreWebVitals = {
      lcp:  lcpMs  !== undefined ? Math.round(lcpMs)  : undefined,
      cls:  clsVal !== undefined ? Math.round(clsVal * 1000) / 1000 : undefined,
      fcp:  fcpMs  !== undefined ? Math.round(fcpMs)  : undefined,
      ttfb: ttfbMs !== undefined ? Math.round(ttfbMs) : undefined,
      tti:  ttiMs  !== undefined ? Math.round(ttiMs)  : undefined,
      speedIndex: siMs !== undefined ? Math.round(siMs) : undefined,
      tbt:  tbtMs  !== undefined ? Math.round(tbtMs)  : undefined,
      lcpRating:  lcpMs  !== undefined ? lcpRating(lcpMs)   : undefined,
      clsRating:  clsVal !== undefined ? clsRating(clsVal)  : undefined,
      fcpRating:  fcpMs  !== undefined ? fcpRating(fcpMs)   : undefined,
      ttfbRating: ttfbMs !== undefined ? ttfbRating(ttfbMs) : undefined,
    };

    // ─── Category scores ────────────────────────────────────────────────────
    const catScore = (cat: string): number =>
      Math.round((lhr.categories?.[cat]?.score ?? 0) * 100);

    // ─── Opportunities (savings) ────────────────────────────────────────────
    const opportunities: LighthouseOpportunity[] = [];
    const diagnostics: string[] = [];

    Object.values(lhr.audits ?? {}).forEach((audit) => {
      if (!audit || audit.score === 1 || audit.score === null) return;
      if (audit.details?.type === 'opportunity' && (audit.details as { overallSavingsMs?: number }).overallSavingsMs) {
        const savingsMs = (audit.details as { overallSavingsMs?: number }).overallSavingsMs ?? 0;
        if (savingsMs > 200) {
          opportunities.push({
            id: audit.id,
            title: audit.title,
            description: audit.description ?? '',
            savingsMs: Math.round(savingsMs),
            impact: impactFromScore(audit.score),
          });
        }
      } else if (audit.details?.type === 'table' || audit.details?.type === 'list') {
        if (audit.score !== null && audit.score < 0.9 && audit.title) {
          diagnostics.push(audit.title);
        }
      }
    });

    // Sort by savings descending
    opportunities.sort((a, b) => (b.savingsMs ?? 0) - (a.savingsMs ?? 0));

    const scores: LighthouseScores = {
      performance:   catScore('performance'),
      accessibility: catScore('accessibility'),
      bestPractices: catScore('best-practices'),
      seo:           catScore('seo'),
      opportunities: opportunities.slice(0, 10),
      diagnostics:   diagnostics.slice(0, 8),
    };

    return { coreWebVitals: cwv, lighthouseScores: scores };

  } catch (err) {
    console.error('[Lighthouse] Error:', (err as Error).message);
    return null;
  } finally {
    if (browser) {
      try { await browser.close(); } catch { /* ignore */ }
    }
  }
}
