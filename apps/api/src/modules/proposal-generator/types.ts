import type { Proposal } from '@domain';

export type CreateProposalRequest = Omit<Proposal, 'proposalId' | 'createdAt' | 'updatedAt'>;

export type ProposalResponse = Proposal;
