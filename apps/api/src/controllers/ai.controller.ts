import { Router } from 'express';
import { generateAiAnalysis } from '../modules/ai/ai.service';

export const aiRouter = Router();

aiRouter.post('/', async (req, res) => {
  try {
    const { prompt, model } = req.body;

    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    const result = await generateAiAnalysis({ prompt, model });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message || 'AI analysis failed' });
  }
});
