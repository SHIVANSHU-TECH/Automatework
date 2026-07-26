import { Router } from 'express';
import { analyzeWebsite } from '../modules/website-analyzer/website-analyzer.service';

export const websiteAnalyzerRouter = Router();

websiteAnalyzerRouter.post('/analyze', async (req, res) => {
  try {
    const result = await analyzeWebsite(req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message || 'Unable to analyze website' });
  }
});
