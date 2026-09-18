import { Router } from 'express';
import { generateAiAnalysis } from '../modules/ai/ai.service';
import { publicErrorMessage } from '../modules/logging/safe-error';

export const aiRouter = Router();

aiRouter.post('/', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    // Ignore client-supplied model IDs — always use the server default
    const result = await generateAiAnalysis({ prompt });
    res.json(result);
  } catch (error) {
    res.status(500).json({
      message: publicErrorMessage(error, 'AI analysis failed. Please try again in a moment.'),
    });
  }
});
