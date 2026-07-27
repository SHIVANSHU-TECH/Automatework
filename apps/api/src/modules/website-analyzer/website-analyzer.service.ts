import { v4 as uuidv4 } from 'uuid';
import { fetchWebsiteHtml } from './scraper/crawler.service';
import { normalizeWebsiteUrl } from './scraper/validation.service';
import { inspectWebsite } from './analysis/inspector.service';
import { dbSet, paths } from '../database/database';
import type { WebsiteAnalyzerRequest, WebsiteAnalyzerResponse } from './types';

export const analyzeWebsite = async (request: WebsiteAnalyzerRequest): Promise<WebsiteAnalyzerResponse> => {
  const normalizedUrl = normalizeWebsiteUrl(request.websiteUrl);
  if (!normalizedUrl) {
    throw new Error('Invalid website URL. Please enter a valid domain e.g. fit29.com or https://fit29.com');
  }

  const { html } = await fetchWebsiteHtml(normalizedUrl);
  const analysis = await inspectWebsite(html, normalizedUrl);
  const now = new Date().toISOString();
  const analysisId = uuidv4();

  // Persist to Firebase when a clientId is provided
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
      createdAt: now,
      updatedAt: now,
    };

    await dbSet(paths.analysis(request.userId, analysisId), record);
  }

  return analysis;
};
