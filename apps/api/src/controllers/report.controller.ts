import { Router } from 'express';
import { streamReport } from '../modules/report-generator/report.service';

export const reportRouter = Router();

reportRouter.post('/export', async (req, res) => {
  try {
    const { proposalId, format } = req.body as { proposalId: string; format: string };

    if (!proposalId || !format) {
      return res.status(400).json({ message: 'proposalId and format are required' });
    }

    await streamReport({ proposalId, format }, res);
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ message: (error as Error).message || 'Unable to generate report' });
    }
  }
});
