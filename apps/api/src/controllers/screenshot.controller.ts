import { Router } from 'express';
import path from 'path';
import { captureScreenshot } from '../modules/screenshot-engine/screenshot.service';

export const screenshotRouter = Router();

screenshotRouter.post('/', async (req, res) => {
  try {
    const { url, mode } = req.body;

    if (!url) {
      return res.status(400).json({ message: 'URL is required' });
    }

    const screenshot = await captureScreenshot(url, mode ?? 'desktop');
    const filename = path.basename(screenshot.path);
    const downloadUrl = `${req.protocol}://${req.get('host')}/screenshots/files/${filename}`;

    res.json({ ...screenshot, downloadUrl });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message || 'Unable to capture screenshot' });
  }
});
