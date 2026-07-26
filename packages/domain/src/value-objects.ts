export type WebsiteAnalysisInput = {
  websiteUrl: string;
  crawlDepth?: number;
  includeFullPage?: boolean;
};

export type ProposalInput = {
  clientId: string;
  title: string;
  templateId: string;
  objectives: string;
  timeline: string;
  budgetRange: string;
  scopeNotes?: string;
};

export type Pagination = {
  page: number;
  pageSize: number;
};
