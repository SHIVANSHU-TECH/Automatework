import { Router } from 'express';
import { createProposal, getProposalById, listProposals, updateProposal } from '../modules/proposal-generator/proposal.service';

export const proposalRouter = Router();

proposalRouter.get('/', async (_req, res) => {
  try {
    const proposals = await listProposals();
    res.json({ proposals });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message || 'Unable to load proposals' });
  }
});

proposalRouter.get('/:id', async (req, res) => {
  try {
    const proposal = await getProposalById(req.params.id);

    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    res.json({ proposal });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message || 'Unable to load proposal' });
  }
});

proposalRouter.post('/', async (req, res) => {
  try {
    const proposal = await createProposal(req.body);
    res.status(201).json({ proposal });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message || 'Unable to create proposal' });
  }
});

proposalRouter.put('/:id', async (req, res) => {
  try {
    const proposal = await updateProposal(req.params.id, req.body);
    res.json({ proposal });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message || 'Unable to update proposal' });
  }
});
