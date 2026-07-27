import { Router } from 'express';
import { streamReport } from '../modules/report-generator/report.service';
import { requireAuth, type AuthRequest } from '../modules/auth/middleware';
import { dbGet, paths } from '../modules/database/database';
import type { Proposal } from '@domain';

export const reportRouter = Router();
reportRouter.use(requireAuth);

reportRouter.post('/export', async (req: AuthRequest, res) => {
  try {
    const { proposalId, format } = req.body as { proposalId: string; format: string };
    if (!proposalId || !format) {
      return res.status(400).json({ message: 'proposalId and format are required' });
    }
    // Fetch the user-scoped proposal
    const proposal = await dbGet<Proposal>(paths.proposal(req.userId!, proposalId));
    if (!proposal) return res.status(404).json({ message: 'Proposal not found' });
    await streamReport({ proposalId, format, proposal }, res);
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ message: (error as Error).message || 'Unable to generate report' });
    }
  }
});
