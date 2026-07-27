import { Router } from 'express';
import { requireAuth, type AuthRequest } from '../modules/auth/middleware';
import { dbSet, dbGet, dbGetAll, dbRemove } from '../modules/database/database';
import { v4 as uuidv4 } from 'uuid';

export const urlShortenerRouter = Router();
// Analytics endpoint is public (for click tracking); all others require auth

interface ShortUrl {
  shortId: string;
  userId: string;
  originalUrl: string;
  alias?: string;
  shortCode: string;
  shortUrl: string;
  qrCode?: string;
  password?: string;
  expiresAt?: string;
  totalClicks: number;
  uniqueVisitors: number;
  analytics: ClickEvent[];
  createdAt: string;
  updatedAt: string;
  proposalId?: string;
}

interface ClickEvent {
  timestamp: string;
  country: string;
  device: string;
  browser: string;
  os: string;
  referrer: string;
}

const generateShortCode = (alias?: string): string => {
  if (alias?.trim()) return alias.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
  return Math.random().toString(36).slice(2, 8);
};

const generateQrDataUrl = (url: string): string => {
  // Return a QR code URL using a public QR service
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
};

// ─── Create short URL ─────────────────────────────────────────────────────────

urlShortenerRouter.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const {
      originalUrl, alias, password, expiresAt, proposalId,
    } = req.body as {
      originalUrl: string; alias?: string; password?: string;
      expiresAt?: string; proposalId?: string;
    };

    if (!originalUrl?.trim()) return res.status(400).json({ message: 'originalUrl is required' });

    try { new URL(originalUrl); } catch {
      return res.status(400).json({ message: 'Invalid URL format' });
    }

    const shortId   = uuidv4();
    const shortCode = generateShortCode(alias);
    const baseUrl   = process.env.NEXT_PUBLIC_API_URL ?? 'https://automatework-tmfr.onrender.com';
    const shortUrl  = `${baseUrl}/s/${shortCode}`;

    const entry: ShortUrl = {
      shortId,
      userId: req.userId!,
      originalUrl: originalUrl.trim(),
      alias: alias?.trim(),
      shortCode,
      shortUrl,
      qrCode:    generateQrDataUrl(shortUrl),
      password:  password?.trim() || undefined,
      expiresAt: expiresAt || undefined,
      totalClicks: 0,
      uniqueVisitors: 0,
      analytics: [],
      proposalId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await dbSet(`user_data/${req.userId}/short_urls/${shortId}`, entry);
    // Also index by shortCode for redirect lookup
    await dbSet(`short_codes/${shortCode}`, { shortId, userId: req.userId, originalUrl: entry.originalUrl, password: entry.password, expiresAt: entry.expiresAt });

    res.status(201).json({ shortUrl: entry });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message || 'Failed to create short URL' });
  }
});

// ─── List user's short URLs ───────────────────────────────────────────────────

urlShortenerRouter.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const urls = await dbGetAll<ShortUrl>(`user_data/${req.userId}/short_urls`);
    const sorted = urls.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ urls: sorted });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message || 'Failed to load URLs' });
  }
});

// ─── Get single short URL ─────────────────────────────────────────────────────

urlShortenerRouter.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const url = await dbGet<ShortUrl>(`user_data/${req.userId}/short_urls/${id}`);
    if (!url) return res.status(404).json({ message: 'Short URL not found' });
    res.json({ shortUrl: url });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message || 'Failed to load URL' });
  }
});

// ─── Delete short URL ─────────────────────────────────────────────────────────

urlShortenerRouter.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const url = await dbGet<ShortUrl>(`user_data/${req.userId}/short_urls/${id}`);
    if (!url) return res.status(404).json({ message: 'Not found' });
    await dbRemove(`user_data/${req.userId}/short_urls/${id}`);
    await dbRemove(`short_codes/${url.shortCode}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message || 'Failed to delete' });
  }
});

// ─── Redirect handler (public) ────────────────────────────────────────────────

urlShortenerRouter.get('/r/:code', async (req, res) => {
  try {
    const code = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;
    const index = await dbGet<{ shortId: string; userId: string; originalUrl: string; password?: string; expiresAt?: string }>(`short_codes/${code}`);

    if (!index) return res.status(404).send('Short URL not found');

    // Check expiry
    if (index.expiresAt && new Date(index.expiresAt) < new Date()) {
      return res.status(410).send('This link has expired');
    }

    // Check password
    const provided = req.query.p as string | undefined;
    if (index.password && provided !== index.password) {
      return res.status(401).send(`<html><body><form method="get"><input name="p" type="password" placeholder="Enter password"/><button>Go</button></form></body></html>`);
    }

    // Track click
    const clickEvent: ClickEvent = {
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

    // Update analytics in Firestore (fire and forget — don't block redirect)
    dbGet<ShortUrl>(`user_data/${index.userId}/short_urls/${index.shortId}`).then((existing) => {
      if (existing) {
        const updated = {
          ...existing,
          totalClicks: existing.totalClicks + 1,
          analytics: [...(existing.analytics ?? []).slice(-999), clickEvent],
          updatedAt: new Date().toISOString(),
        };
        dbSet(`user_data/${index.userId}/short_urls/${index.shortId}`, updated).catch(() => {});
      }
    }).catch(() => {});

    res.redirect(302, index.originalUrl);
  } catch (error) {
    res.status(500).send('Redirect error');
  }
});

// ─── Analytics summary ────────────────────────────────────────────────────────

urlShortenerRouter.get('/:id/analytics', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const url = await dbGet<ShortUrl>(`user_data/${req.userId}/short_urls/${id}`);
    if (!url) return res.status(404).json({ message: 'Not found' });

    const events = url.analytics ?? [];
    const byCountry: Record<string, number> = {};
    const byDevice:  Record<string, number> = {};
    const byBrowser: Record<string, number> = {};
    const byOs:      Record<string, number> = {};
    const byDay:     Record<string, number> = {};

    events.forEach((e) => {
      byCountry[e.country]  = (byCountry[e.country]  ?? 0) + 1;
      byDevice[e.device]    = (byDevice[e.device]    ?? 0) + 1;
      byBrowser[e.browser]  = (byBrowser[e.browser]  ?? 0) + 1;
      byOs[e.os]            = (byOs[e.os]            ?? 0) + 1;
      const day = e.timestamp.slice(0, 10);
      byDay[day] = (byDay[day] ?? 0) + 1;
    });

    res.json({
      totalClicks: url.totalClicks,
      recentClicks: events.slice(-50).reverse(),
      byCountry, byDevice, byBrowser, byOs,
      clicksByDay: Object.entries(byDay).sort((a, b) => a[0].localeCompare(b[0])),
    });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message || 'Analytics failed' });
  }
});

// ─── Bulk create ──────────────────────────────────────────────────────────────

urlShortenerRouter.post('/bulk', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { urls } = req.body as { urls: Array<{ originalUrl: string; alias?: string }> };
    if (!Array.isArray(urls) || !urls.length) return res.status(400).json({ message: 'urls array required' });

    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'https://automatework-tmfr.onrender.com';
    const created: ShortUrl[] = [];

    for (const item of urls.slice(0, 50)) {
      try {
        new URL(item.originalUrl);
        const shortId   = uuidv4();
        const shortCode = generateShortCode(item.alias);
        const shortUrl  = `${baseUrl}/s/${shortCode}`;
        const entry: ShortUrl = {
          shortId, userId: req.userId!,
          originalUrl: item.originalUrl, alias: item.alias,
          shortCode, shortUrl, qrCode: generateQrDataUrl(shortUrl),
          totalClicks: 0, uniqueVisitors: 0, analytics: [],
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        };
        await dbSet(`user_data/${req.userId}/short_urls/${shortId}`, entry);
        await dbSet(`short_codes/${shortCode}`, { shortId, userId: req.userId, originalUrl: entry.originalUrl });
        created.push(entry);
      } catch { /* skip invalid */ }
    }

    res.status(201).json({ created, count: created.length });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message || 'Bulk creation failed' });
  }
});

// ─── Export ───────────────────────────────────────────────────────────────────

urlShortenerRouter.get('/export/:format', requireAuth, async (req: AuthRequest, res) => {
  try {
    const fmt = Array.isArray(req.params.format) ? req.params.format[0] : req.params.format;
    const urls = await dbGetAll<ShortUrl>(`user_data/${req.userId}/short_urls`);

    if (fmt === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="short-urls.json"`);
      return res.send(JSON.stringify(urls, null, 2));
    }

    const headers = ['Short URL','Original URL','Alias','Clicks','Created','Expires'];
    const rows = urls.map((u) => [
      u.shortUrl, u.originalUrl, u.alias ?? '', u.totalClicks,
      u.createdAt.slice(0, 10), u.expiresAt?.slice(0, 10) ?? '',
    ].join(','));

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="short-urls.csv"`);
    res.send([headers.join(','), ...rows].join('\n'));
  } catch (error) {
    res.status(500).json({ message: (error as Error).message || 'Export failed' });
  }
});
