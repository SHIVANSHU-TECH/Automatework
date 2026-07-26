import { DateString, ProposalStatus, UUID } from '@shared';

export type Client = {
  clientId: UUID;
  name: string;
  websiteUrl: string;
  businessCategory: string;
  contactEmail?: string;
  contactPhone?: string;
  socialLinks: string[];
};

export type Proposal = {
  proposalId: UUID;
  clientId: UUID;
  title: string;
  status: ProposalStatus;
  createdAt: DateString;
  updatedAt: DateString;
  submittedAt?: DateString;
  version: number;
  executiveSummary: string;
  scope: string;
  timeline: string;
  deliverables: string;
  pricing: string;
  maintenancePlan: string;
  whyChooseUs: string;
  caseStudies: string;
  terms: string;
  signature: string;
  metadata: Record<string, unknown>;
};

export type WebsiteAnalysis = {
  analysisId: UUID;
  clientId: UUID;
  websiteUrl: string;
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
  headings: string[];
  paragraphs: string[];
  services: string[];
  testimonials: string[];
  pricingItems: string[];
  forms: string[];
  ctas: string[];
  navigationItems: string[];
  footerItems: string[];
  metadata: Record<string, unknown>;
  createdAt: DateString;
  updatedAt: DateString;
};

export type AiAnalysis = {
  aiAnalysisId: UUID;
  proposalId: UUID;
  businessSummary: string;
  companyOverview: string;
  websiteStrengths: string;
  websiteWeaknesses: string;
  businessOpportunities: string;
  technicalRecommendations: string;
  uiRecommendations: string;
  uxRecommendations: string;
  seoRecommendations: string;
  performanceRecommendations: string;
  securityRecommendations: string;
  accessibilityRecommendations: string;
  automationOpportunities: string;
  suggestedFeatures: string;
  suggestedTechStack: string;
  estimatedTimeline: string;
  estimatedTeamSize: string;
  estimatedCost: string;
  upsellingOpportunities: string;
  createdAt: DateString;
  updatedAt: DateString;
};

export type DashboardStats = {
  totalClients: number;
  totalProposals: number;
  pendingProposals: number;
  exportedProposals: number;
  recentActivity: Array<{ label: string; date: DateString; type: string }>;
};
