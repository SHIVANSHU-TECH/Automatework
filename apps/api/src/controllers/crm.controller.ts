import { Router } from 'express';
import { dbSet, dbGetAll, paths } from '../modules/database/database';
import { requireAuth, type AuthRequest } from '../modules/auth/middleware';
import { v4 as uuidv4 } from 'uuid';

export const crmRouter = Router();
crmRouter.use(requireAuth);

crmRouter.get('/', async (req: AuthRequest, res) => {
  try {
    const clients = await dbGetAll(paths.clients(req.userId!));
    res.json({ clients });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message || 'Unable to load clients' });
  }
});

crmRouter.post('/clients', async (req: AuthRequest, res) => {
  try {
    const { name, websiteUrl, businessCategory, contactEmail, contactPhone, socialLinks } = req.body as {
      name: string; websiteUrl: string; businessCategory?: string;
      contactEmail?: string; contactPhone?: string; socialLinks?: string[];
    };
    const clientId = uuidv4();
    const now = new Date().toISOString();
    const client = {
      clientId, name, websiteUrl,
      businessCategory: businessCategory ?? null,
      contactEmail: contactEmail ?? null,
      contactPhone: contactPhone ?? null,
      socialLinks: socialLinks ?? [],
      userId: req.userId,
      createdAt: now, updatedAt: now,
    };
    await dbSet(paths.client(req.userId!, clientId), client);
    res.status(201).json({ clientId });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message || 'Unable to create client' });
  }
});

crmRouter.get('/proposals', async (req: AuthRequest, res) => {
  try {
    const proposals = await dbGetAll(paths.proposals(req.userId!));
    const sorted = (proposals as Array<{ updatedAt: string }>).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    res.json({ proposals: sorted });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message || 'Unable to load proposals' });
  }
});
