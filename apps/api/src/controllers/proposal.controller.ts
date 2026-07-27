import { Router } from 'express';
import { requireAuth, type AuthRequest } from '../modules/auth/middleware';
import { dbSet, dbGet, dbGetAll, paths } from '../modules/database/database';
import { v4 as uuidv4 } from 'uuid';
import type { Proposal } from '@domain';

export const proposalRouter = Router();
proposalRouter.use(requireAuth);

// Helper — Express 5 types req.params values as string | string[]
const paramId = (id: string | string[]): string =>
  Array.isArray(id) ? id[0] : id;

proposalRouter.get('/', async (req: AuthRequest, res) => {
  try {
    const all = await dbGetAll<Proposal>(paths.proposals(req.userId!));
    const sorted = all.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    res.json({ proposals: sorted });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message || 'Unable to load proposals' });
  }
});

proposalRouter.get('/:id', async (req: AuthRequest, res) => {
  try {
    const id = paramId(req.params.id);
    const proposal = await dbGet<Proposal>(paths.proposal(req.userId!, id));
    if (!proposal) return res.status(404).json({ message: 'Proposal not found' });
    res.json({ proposal });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message || 'Unable to load proposal' });
  }
});

proposalRouter.post('/', async (req: AuthRequest, res) => {
  try {
    const now = new Date().toISOString();
    const proposalId = uuidv4();
    const proposal: Proposal = {
      proposalId,
      clientId:         req.body.clientId         ?? 'unknown',
      title:            req.body.title             ?? 'Untitled',
      status:           req.body.status            ?? 'draft',
      createdAt:        now,
      updatedAt:        now,
      submittedAt:      req.body.submittedAt,
      version:          req.body.version           ?? 1,
      executiveSummary: req.body.executiveSummary  ?? '',
      scope:            req.body.scope             ?? '',
      timeline:         req.body.timeline          ?? '',
      deliverables:     req.body.deliverables      ?? '',
      pricing:          req.body.pricing           ?? '',
      maintenancePlan:  req.body.maintenancePlan   ?? '',
      whyChooseUs:      req.body.whyChooseUs       ?? '',
      caseStudies:      req.body.caseStudies       ?? '',
      terms:            req.body.terms             ?? '',
      signature:        req.body.signature         ?? '',
      metadata:         { ...req.body.metadata, userId: req.userId },
    };
    await dbSet(paths.proposal(req.userId!, proposalId), proposal);
    res.status(201).json({ proposal });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message || 'Unable to create proposal' });
  }
});

proposalRouter.put('/:id', async (req: AuthRequest, res) => {
  try {
    const id = paramId(req.params.id);
    const existing = await dbGet<Proposal>(paths.proposal(req.userId!, id));
    if (!existing) return res.status(404).json({ message: 'Proposal not found' });
    const updated: Proposal = {
      ...existing,
      ...req.body,
      proposalId:  existing.proposalId,   // never overwrite ID
      updatedAt:   new Date().toISOString(),
    };
    await dbSet(paths.proposal(req.userId!, id), updated);
    res.json({ proposal: updated });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message || 'Unable to update proposal' });
  }
});
