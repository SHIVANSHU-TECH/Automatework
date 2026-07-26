import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import { v4 as uuidv4 } from 'uuid';

export type ScreenshotMode = 'desktop' | 'tablet' | 'mobile';

export type ScreenshotResult = {
  path: string;
  mode: ScreenshotMode;
};

const screenshotDirectory = path.resolve(__dirname, '../../data/screenshots');

const viewportForMode = (mode: ScreenshotMode) => {
  switch (mode) {
    case 'mobile':
      return { width: 375, height: 812 };
    case 'tablet':
      return { width: 768, height: 1024 };
    default:
      return { width: 1280, height: 800 };
  }
};

export const captureScreenshot = async (url: string, mode: ScreenshotMode): Promise<ScreenshotResult> => {
  if (!fs.existsSync(screenshotDirectory)) {
    fs.mkdirSync(screenshotDirectory, { recursive: true });
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: viewportForMode(mode) });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });

  const filename = `${uuidv4()}-${mode}.png`;
  const filePath = path.join(screenshotDirectory, filename);
  await page.screenshot({ path: filePath, fullPage: false });

  await browser.close();
  return { path: filePath, mode };
};
