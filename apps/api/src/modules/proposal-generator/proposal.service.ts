// Proposal CRUD is now handled directly in proposal.controller.ts
// with user-scoped paths. This stub satisfies any remaining imports.
import { dbGet, dbGetAll, paths } from '../database/database';
import type { Proposal } from '@domain';

/** Used by report.service.ts as a fallback — requires userId from metadata */
export const getProposalById = async (proposalId: string): Promise<Proposal | null> => {
  // Without userId we can't do a scoped lookup — callers should use the
  // controller-level lookup instead. Return null gracefully.
  void proposalId; void dbGet; void paths;
  return null;
};

export const listProposals = async (): Promise<Proposal[]> => {
  void dbGetAll; void paths;
  return [];
};
