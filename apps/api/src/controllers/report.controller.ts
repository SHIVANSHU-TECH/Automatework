import { Router } from 'express';
import path from 'path';
import { generateReport } from '../modules/report-generator/report.service';

export const reportRouter = Router();

reportRouter.post('/export', async (req, res) => {
  try {
    const { proposalId, format } = req.body;

    if (!proposalId || !format) {
      return res.status(400).json({ message: 'proposalId and format are required' });
    }

    const result = await generateReport({ proposalId, format });
    const filename = path.basename(result.filePath);
    const downloadUrl = `${req.protocol}://${req.get('host')}/reports/files/${filename}`;

    res.json({ filename, downloadUrl });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message || 'Unable to generate report' });
  }
});
