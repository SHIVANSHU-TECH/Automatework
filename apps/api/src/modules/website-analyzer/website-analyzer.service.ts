import { v4 as uuidv4 } from 'uuid';
import { fetchWebsiteHtml } from './scraper/crawler.service';
import { normalizeWebsiteUrl } from './scraper/validation.service';
import { inspectWebsite } from './analysis/inspector.service';
import { runLighthouse } from './analysis/lighthouse.service';
import { getDomainInfo } from './analysis/domain.service';
import { getSecurityHeaders } from './analysis/security-headers.service';
import { getCrawlabilityInfo } from './analysis/crawlability.service';
import { getContentInsights } from './analysis/content-insights.service';
import { getTrancoRank } from './analysis/tranco.service';
import { dbSet, paths } from '../database/database';
import type { WebsiteAnalyzerRequest, WebsiteAnalyzerResponse } from './types';

export const analyzeWebsite = async (
  request: WebsiteAnalyzerRequest,
): Promise<WebsiteAnalyzerResponse> => {
  const normalizedUrl = normalizeWebsiteUrl(request.websiteUrl);
  if (!normalizedUrl) {
    throw new Error(
      'Invalid website URL. Please enter a valid domain e.g. fit29.com or https://fit29.com',
    );
  }

  const { html } = await fetchWebsiteHtml(normalizedUrl);
  const hostname = new URL(normalizedUrl).hostname;

  // ─── Run all analysis in parallel ──────────────────────────────────────────
  // Use allSettled so one failure doesn't abort the whole analysis
  const [
    inspectionResult,
    lighthouseResult,
    domainResult,
    securityResult,
    crawlabilityResult,
    trancoResult,
  ] = await Promise.allSettled([
    inspectWebsite(html, normalizedUrl),
    runLighthouse(normalizedUrl),           // may return null on error
    getDomainInfo(hostname),                // may return null on error
    getSecurityHeaders(normalizedUrl),
    getCrawlabilityInfo(normalizedUrl, html),
    getTrancoRank(hostname),
  ]);

  // ─── Unwrap results ─────────────────────────────────────────────────────────
  const analysis =
    inspectionResult.status === 'fulfilled'
      ? inspectionResult.value
      : (() => { throw new Error((inspectionResult as PromiseRejectedResult).reason?.message ?? 'Analysis failed'); })();

  const lighthouse =
    lighthouseResult.status === 'fulfilled' ? lighthouseResult.value : null;

  const domainInfo =
    domainResult.status === 'fulfilled' ? domainResult.value ?? undefined : undefined;

  const securityHeaders =
    securityResult.status === 'fulfilled' ? securityResult.value : undefined;

  const crawlability =
    crawlabilityResult.status === 'fulfilled' ? crawlabilityResult.value : undefined;

  const trafficRank =
    trancoResult.status === 'fulfilled' ? trancoResult.value : undefined;

  // Content insights are synchronous (HTML-based) — derive from the html we already have
  let contentInsights: WebsiteAnalyzerResponse['contentInsights'];
  try {
    contentInsights = getContentInsights(html);
  } catch {
    contentInsights = undefined;
  }

  const now        = new Date().toISOString();
  const analysisId = uuidv4();

  // ─── Persist to Firestore ───────────────────────────────────────────────────
  if (request.clientId && request.userId) {
    const record = {
      analysisId,
      clientId: request.clientId,
      websiteUrl: normalizedUrl,
      framework: analysis.framework ?? null,
      cms: analysis.cms ?? null,
      hosting: analysis.hosting ?? null,
      analytics: analysis.analytics ?? [],
      performanceScore: analysis.performanceScore ?? null,
      isMobileResponsive: analysis.isMobileResponsive ?? false,
      brokenLinks: analysis.brokenLinks ?? [],
      accessibilityIssues: analysis.accessibilityIssues ?? [],
      seoIssues: analysis.seoIssues ?? [],
      sslValid: analysis.sslValid,
      contactInformation: analysis.contactInformation ?? [],
      socialLinks: analysis.socialLinks ?? [],
      businessCategory: analysis.businessCategory,
      detectedTechnologies: analysis.detectedTechnologies ?? [],
      headings: analysis.contentExtraction.headings ?? [],
      paragraphs: analysis.contentExtraction.paragraphs ?? [],
      services: analysis.contentExtraction.services ?? [],
      testimonials: analysis.contentExtraction.testimonials ?? [],
      pricingItems: analysis.contentExtraction.pricing ?? [],
      forms: analysis.contentExtraction.forms ?? [],
      ctas: analysis.contentExtraction.ctas ?? [],
      navigationItems: analysis.contentExtraction.navigation ?? [],
      footerItems: analysis.contentExtraction.footer ?? [],
      metadata: analysis.contentExtraction.metadata ?? {},
      // V2 fields
      coreWebVitals: lighthouse?.coreWebVitals ?? null,
      lighthouseScores: lighthouse?.lighthouseScores
        ? { ...lighthouse.lighthouseScores, opportunities: [] } // don't bloat Firestore
        : null,
      domainInfo: domainInfo ?? null,
      securityHeaders: securityHeaders ?? null,
      crawlability: crawlability ?? null,
      contentInsights: contentInsights ?? null,
      trafficRank: trafficRank ?? null,
      createdAt: now,
      updatedAt: now,
    };

    await dbSet(paths.analysis(request.userId, analysisId), record);
  }

  // ─── Build response ─────────────────────────────────────────────────────────
  const response: WebsiteAnalyzerResponse = {
    ...analysis,
    coreWebVitals:   lighthouse?.coreWebVitals   ?? undefined,
    lighthouseScores: lighthouse?.lighthouseScores ?? undefined,
    lighthouseError:  lighthouse === null ? 'Lighthouse analysis unavailable' : undefined,
    domainInfo,
    securityHeaders,
    crawlability,
    contentInsights,
    trafficRank,
    analysisTimestamp: now,
  };

  return response;
};
