import { Router } from 'express';
import { analyzeWebsite } from '../modules/website-analyzer/website-analyzer.service';
import { requireAuth, type AuthRequest } from '../modules/auth/middleware';

export const websiteAnalyzerRouter = Router();
websiteAnalyzerRouter.use(requireAuth);

websiteAnalyzerRouter.post('/analyze', async (req: AuthRequest, res) => {
  try {
    const result = await analyzeWebsite({ ...req.body, userId: req.userId });
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message || 'Unable to analyze website' });
  }
});
