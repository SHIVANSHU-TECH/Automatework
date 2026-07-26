import { Router } from 'express';
import { dbSet, dbGetAll, paths } from '../modules/database/database';
import { v4 as uuidv4 } from 'uuid';

export const crmRouter = Router();

// ─── List all clients ─────────────────────────────────────────────────────────

crmRouter.get('/', async (_req, res) => {
  try {
    const clients = await dbGetAll(paths.clients());
    res.json({ clients });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message || 'Unable to load clients' });
  }
});

// ─── Create client ────────────────────────────────────────────────────────────

crmRouter.post('/clients', async (req, res) => {
  try {
    const { name, websiteUrl, businessCategory, contactEmail, contactPhone, socialLinks } = req.body as {
      name: string;
      websiteUrl: string;
      businessCategory?: string;
      contactEmail?: string;
      contactPhone?: string;
      socialLinks?: string[];
    };

    const clientId = uuidv4();
    const now = new Date().toISOString();

    const client = {
      clientId,
      name,
      websiteUrl,
      businessCategory: businessCategory ?? null,
      contactEmail: contactEmail ?? null,
      contactPhone: contactPhone ?? null,
      socialLinks: socialLinks ?? [],
      createdAt: now,
      updatedAt: now,
    };

    await dbSet(paths.client(clientId), client);

    res.status(201).json({ clientId });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message || 'Unable to create client' });
  }
});

// ─── List proposals (for CRM view) ───────────────────────────────────────────

crmRouter.get('/proposals', async (_req, res) => {
  try {
    const proposals = await dbGetAll(paths.proposals());
    // Sort by updatedAt descending
    const sorted = (proposals as Array<{ updatedAt: string }>).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    res.json({ proposals: sorted });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message || 'Unable to load proposals' });
  }
});
