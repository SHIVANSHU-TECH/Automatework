import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { authRouter } from './controllers/auth.controller';
import { websiteAnalyzerRouter } from './controllers/website-analyzer.controller';
import { proposalRouter } from './controllers/proposal.controller';
import { crmRouter } from './controllers/crm.controller';
import { reportRouter } from './controllers/report.controller';
import { aiRouter } from './controllers/ai.controller';
import { screenshotRouter } from './controllers/screenshot.controller';
// V2 modules
import { leadFinderRouter } from './controllers/lead-finder.controller';
import { linkedinRouter } from './controllers/linkedin-generator.controller';
import { xRouter } from './controllers/x-generator.controller';
import { urlShortenerRouter } from './controllers/url-shortener.controller';
import { dbGet, dbSet } from './modules/database/database';

dotenv.config();

const app = express();
const port = process.env.PORT ?? 4000;

app.use(cors());
app.use(express.json());

// Never expose stack traces or raw errors in production responses
if (process.env.NODE_ENV === 'production') {
  app.set('env', 'production');
}

// V1 routes (unchanged)
app.use('/api/auth', authRouter);
app.use('/api/website-analyzer', websiteAnalyzerRouter);
app.use('/api/proposals', proposalRouter);
app.use('/api/crm', crmRouter);
app.use('/api/reports', reportRouter);
app.use('/api/ai', aiRouter);
app.use('/api/screenshots', screenshotRouter);

// V2 routes
app.use('/api/leads', leadFinderRouter);
app.use('/api/linkedin', linkedinRouter);
app.use('/api/x-generator', xRouter);
app.use('/api/urls', urlShortenerRouter);

type ShortIndex = {
  shortId: string;
  userId: string;
  originalUrl: string;
  password?: string;
  expiresAt?: string;
};

type ShortUrlRecord = {
  shortId: string;
  totalClicks: number;
  analytics?: Array<Record<string, string>>;
  updatedAt?: string;
};

const trackClick = (index: ShortIndex, req: express.Request) => {
  const clickEvent = {
    timestamp: new Date().toISOString(),
    country:   (req.headers['cf-ipcountry'] as string) ?? 'Unknown',
    device:    /mobile/i.test(req.headers['user-agent'] ?? '') ? 'Mobile' : 'Desktop',
    browser:   /chrome/i.test(req.headers['user-agent'] ?? '') ? 'Chrome' :
               /firefox/i.test(req.headers['user-agent'] ?? '') ? 'Firefox' :
               /safari/i.test(req.headers['user-agent'] ?? '') ? 'Safari' : 'Other',
    os:        /windows/i.test(req.headers['user-agent'] ?? '') ? 'Windows' :
               /mac/i.test(req.headers['user-agent'] ?? '') ? 'macOS' :
               /linux/i.test(req.headers['user-agent'] ?? '') ? 'Linux' :
               /android/i.test(req.headers['user-agent'] ?? '') ? 'Android' :
               /ios|iphone|ipad/i.test(req.headers['user-agent'] ?? '') ? 'iOS' : 'Other',
    referrer:  req.headers.referer ?? 'Direct',
  };

  dbGet<ShortUrlRecord>(`user_data/${index.userId}/short_urls/${index.shortId}`).then((existing) => {
    if (!existing) return;
    const updated = {
      ...existing,
      totalClicks: (existing.totalClicks ?? 0) + 1,
      analytics: [...(existing.analytics ?? []).slice(-999), clickEvent],
      updatedAt: new Date().toISOString(),
    };
    dbSet(`user_data/${index.userId}/short_urls/${index.shortId}`, updated).catch(() => {});
  }).catch(() => {});
};

const passwordHtml = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Protected Link</title>
<style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f8fafc;margin:0}
.box{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:32px;max-width:360px;width:100%;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.08)}
h2{margin:0 0 8px;font-size:18px;color:#1e293b}p{color:#64748b;font-size:14px;margin:0 0 20px}
input{width:100%;padding:10px 14px;border:1px solid #e2e8f0;border-radius:10px;font-size:14px;box-sizing:border-box;margin-bottom:12px}
button{width:100%;padding:10px;background:#2563eb;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer}</style>
</head><body><div class="box"><h2>Protected Link</h2><p>This link is password-protected.</p>
<form method="get"><input name="p" type="password" placeholder="Enter password" autofocus/><button type="submit">Open Link</button></form></div></body></html>`;

const expiredHtml = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Link Expired</title>
<style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f8fafc;margin:0}
.box{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:32px;max-width:360px;width:100%;text-align:center}
h2{color:#dc2626;margin:0 0 8px}p{color:#64748b;font-size:14px;margin:0}</style>
</head><body><div class="box"><h2>Link Expired</h2><p>This short link has expired and is no longer available.</p></div></body></html>`;

const notFoundHtml = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Link Not Found</title>
<style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f8fafc;margin:0}
.box{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:32px;max-width:360px;width:100%;text-align:center}
h2{color:#1e293b;margin:0 0 8px}p{color:#64748b;font-size:14px;margin:0}</style>
</head><body><div class="box"><h2>Link Not Found</h2><p>This short link does not exist or has been removed.</p></div></body></html>`;

/** Shared short-link resolver — always returns a proper browser redirect or HTML page (never raw Express "Cannot GET"). */
async function resolveShortLink(req: express.Request, res: express.Response) {
  try {
    const code = String(req.params.code ?? '');
    const index = await dbGet<ShortIndex>(`short_codes/${code}`);

    if (!index) {
      return res.status(404).type('html').send(notFoundHtml);
    }

    if (index.expiresAt && new Date(index.expiresAt) < new Date()) {
      return res.status(410).type('html').send(expiredHtml);
    }

    const provided = req.query.p as string | undefined;
    if (index.password && provided !== index.password) {
      return res.status(401).type('html').send(passwordHtml);
    }

    trackClick(index, req);
    return res.redirect(302, index.originalUrl);
  } catch {
    return res.status(500).type('html').send(
      `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Temporarily Unavailable</title></head>
      <body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8fafc">
      <div style="text-align:center;max-width:360px;padding:24px"><h2 style="color:#1e293b">Temporarily Unavailable</h2>
      <p style="color:#64748b;font-size:14px">Please try again in a moment.</p></div></body></html>`,
    );
  }
}

// Short URL redirect (public) — support both /s/:code and legacy /api/urls/r/:code
app.get('/s/:code', resolveShortLink);

app.use('/reports/files', express.static(path.resolve(__dirname, '../data/reports')));
app.use('/screenshots/files', express.static(path.resolve(__dirname, '../data/screenshots')));

// Friendly fallback instead of Express "Cannot GET /..."
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'Endpoint not found.' });
  }
  res.status(404).type('html').send(notFoundHtml);
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
