import { v4 as uuidv4 } from 'uuid';
import { dbSet, dbGet, dbGetAll, paths } from '../database/database';
import type { CreateProposalRequest } from './types';
import type { Proposal } from '@domain';

// ─── Create ───────────────────────────────────────────────────────────────────

export const createProposal = async (request: CreateProposalRequest): Promise<Proposal> => {
  const now = new Date().toISOString();
  const proposalId = uuidv4();

  const proposal: Proposal = {
    proposalId,
    clientId: request.clientId,
    title: request.title,
    status: request.status,
    createdAt: now,
    updatedAt: now,
    submittedAt: request.submittedAt,
    version: request.version,
    executiveSummary: request.executiveSummary,
    scope: request.scope,
    timeline: request.timeline,
    deliverables: request.deliverables,
    pricing: request.pricing,
    maintenancePlan: request.maintenancePlan,
    whyChooseUs: request.whyChooseUs,
    caseStudies: request.caseStudies,
    terms: request.terms,
    signature: request.signature,
    metadata: request.metadata ?? {},
  };

  await dbSet(paths.proposal(proposalId), proposal);

  return proposal;
};

// ─── Read one ─────────────────────────────────────────────────────────────────

export const getProposalById = async (proposalId: string): Promise<Proposal | null> => {
  return dbGet<Proposal>(paths.proposal(proposalId));
};

// ─── Read all ─────────────────────────────────────────────────────────────────

export const listProposals = async (): Promise<Proposal[]> => {
  const proposals = await dbGetAll<Proposal>(paths.proposals());
  return proposals.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
};

// ─── Update ───────────────────────────────────────────────────────────────────

export const updateProposal = async (proposalId: string, values: Partial<Proposal>): Promise<Proposal> => {
  const existing = await getProposalById(proposalId);
  if (!existing) {
    throw new Error('Proposal not found');
  }

  const updated: Proposal = {
    ...existing,
    ...values,
    proposalId,          // never allow overwriting the ID
    updatedAt: new Date().toISOString(),
  };

  await dbSet(paths.proposal(proposalId), updated);

  return updated;
};
