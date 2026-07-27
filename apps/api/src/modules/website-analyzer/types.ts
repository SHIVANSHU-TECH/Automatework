export type WebsiteAnalyzerRequest = {
  websiteUrl: string;
  clientId?: string;
  userId?: string;
  crawlDepth?: number;
};

export type WebsiteAnalyzerResponse = {
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
};
