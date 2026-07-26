import { AiAnalysis, Client, Proposal, WebsiteAnalysis } from './entities';

export interface ClientRepository {
  create(client: Client): Promise<Client>;
  getById(clientId: string): Promise<Client | null>;
  search(term: string): Promise<Client[]>;
}

export interface WebsiteAnalysisRepository {
  create(analysis: WebsiteAnalysis): Promise<WebsiteAnalysis>;
  getByClientId(clientId: string): Promise<WebsiteAnalysis[]>;
  getById(analysisId: string): Promise<WebsiteAnalysis | null>;
}

export interface ProposalRepository {
  create(proposal: Proposal): Promise<Proposal>;
  update(proposalId: string, proposal: Partial<Proposal>): Promise<Proposal>;
  getById(proposalId: string): Promise<Proposal | null>;
  search(query: string): Promise<Proposal[]>;
}

export interface AiAnalysisRepository {
  create(analysis: AiAnalysis): Promise<AiAnalysis>;
  getByProposalId(proposalId: string): Promise<AiAnalysis | null>;
}
