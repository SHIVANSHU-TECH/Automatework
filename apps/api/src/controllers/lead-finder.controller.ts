import { Router } from 'express';
import { requireAuth, type AuthRequest } from '../modules/auth/middleware';
import { dbSet, dbGet, dbGetAll, dbRemove, paths } from '../modules/database/database';
import { generateAiAnalysis } from '../modules/ai/ai.service';
import axios from 'axios';
import { load } from 'cheerio';
import { v4 as uuidv4 } from 'uuid';

export const leadFinderRouter = Router();
leadFinderRouter.use(requireAuth);

// ─── Types ────────────────────────────────────────────────────────────────────

interface Lead {
  leadId: string;
  userId: string;
  companyName: string;
  website: string;
  businessCategory: string;
  location: string;
  country: string;
  city: string;
  contactPage?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  socialLinks: string[];
  detectedTechnologies: string[];
  websiteHealthScore: number;
  websiteQualityScore: number;
  potentialServices: string[];
  priorityScore: number;
  aiLeadScore: number;
  outreachStrategy: string;
  tags: string[];
  savedTocrm: boolean;
  proposalId?: string;
  createdAt: string;
  updatedAt: string;
  source: string;
}

// ─── Search leads ─────────────────────────────────────────────────────────────

leadFinderRouter.post('/search', async (req: AuthRequest, res) => {
  try {
    const {
      industry = '',
      country = '',
      city = '',
      keywords = '',
      companySize = '',
      limit = 10,
    } = req.body as {
      industry?: string; country?: string; city?: string;
      keywords?: string; companySize?: string; limit?: number;
    };

    const query = [keywords, industry, city, country].filter(Boolean).join(' ');
    if (!query.trim()) {
      return res.status(400).json({ message: 'At least one search criteria is required' });
    }

    // Use AI to generate realistic lead data based on search criteria
    const prompt = `You are a business lead generation assistant. Generate ${Math.min(limit, 20)} realistic business leads based on these criteria:
Industry: ${industry || 'any'}
Country: ${country || 'any'}
City: ${city || 'any'}
Keywords: ${keywords || 'any'}
Company Size: ${companySize || 'any'}

For each lead, provide a JSON array with objects containing:
- companyName: realistic company name
- website: realistic website URL (use real TLD)
- businessCategory: specific category
- location: "City, Country" format
- country: country name
- city: city name
- email: realistic business email if findable
- phone: realistic phone number if findable
- linkedinUrl: LinkedIn company page URL format
- detectedTechnologies: array of 2-5 common web technologies they might use
- potentialServices: array of 3-5 software services they might need
- source: one of "Google Search", "LinkedIn", "Business Directory", "Startup Directory"

Return ONLY the JSON array, no other text.`;

    const aiResult = await generateAiAnalysis({ prompt, model: 'llama-3.1-8b-instant' });

    let leadsData: Array<Partial<Lead>> = [];
    try {
      const jsonMatch = aiResult.raw.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        leadsData = JSON.parse(jsonMatch[0]);
      }
    } catch {
      leadsData = [];
    }

    // Enrich each lead with scores
    const leads: Lead[] = leadsData.map((l) => {
      const techScore = Math.min((l.detectedTechnologies?.length ?? 0) * 10, 30);
      const serviceScore = Math.min((l.potentialServices?.length ?? 0) * 10, 30);
      const contactScore = (l.email ? 15 : 0) + (l.phone ? 10 : 0) + (l.linkedinUrl ? 15 : 0);
      const aiLeadScore = Math.min(40 + techScore + serviceScore - contactScore + Math.floor(Math.random() * 20), 100);
      const priorityScore = Math.ceil(aiLeadScore / 20);

      return {
        leadId: uuidv4(),
        userId: req.userId!,
        companyName:  l.companyName   ?? 'Unknown Company',
        website:      l.website       ?? '',
        businessCategory: l.businessCategory ?? industry ?? 'Professional Services',
        location:     l.location      ?? `${city}, ${country}`.trim().replace(/^,|,$/, ''),
        country:      l.country       ?? country ?? '',
        city:         l.city          ?? city    ?? '',
        contactPage:  l.website ? `${l.website}/contact` : undefined,
        email:        l.email,
        phone:        l.phone,
        linkedinUrl:  l.linkedinUrl,
        socialLinks:  [],
        detectedTechnologies: l.detectedTechnologies ?? [],
        websiteHealthScore:   Math.floor(50 + Math.random() * 50),
        websiteQualityScore:  Math.floor(40 + Math.random() * 60),
        potentialServices: l.potentialServices ?? [],
        priorityScore,
        aiLeadScore,
        outreachStrategy: aiLeadScore >= 70
          ? 'High priority — contact directly via email with a personalised audit offer'
          : aiLeadScore >= 40
          ? 'Medium priority — LinkedIn connection + nurture sequence'
          : 'Low priority — add to newsletter list for retargeting',
        tags: [industry, country, companySize].filter(Boolean),
        savedTocrm: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: l.source ?? 'Business Directory',
      };
    });

    res.json({ leads, total: leads.length });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message || 'Lead search failed' });
  }
});

// ─── Get saved leads ──────────────────────────────────────────────────────────

leadFinderRouter.get('/', async (req: AuthRequest, res) => {
  try {
    const leads = await dbGetAll<Lead>(`user_data/${req.userId}/leads`);
    const sorted = leads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ leads: sorted });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message || 'Failed to load leads' });
  }
});

// ─── Save a lead ──────────────────────────────────────────────────────────────

leadFinderRouter.post('/save', async (req: AuthRequest, res) => {
  try {
    const lead = req.body as Lead;
    if (!lead.leadId) lead.leadId = uuidv4();
    lead.userId = req.userId!;
    lead.updatedAt = new Date().toISOString();
    if (!lead.createdAt) lead.createdAt = new Date().toISOString();
    await dbSet(`user_data/${req.userId}/leads/${lead.leadId}`, lead);
    res.status(201).json({ lead });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message || 'Failed to save lead' });
  }
});

// ─── Update lead (tag, mark as saved to CRM, etc.) ───────────────────────────

leadFinderRouter.put('/:id', async (req: AuthRequest, res) => {
  try {
    const leadId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const existing = await dbGet<Lead>(`user_data/${req.userId}/leads/${leadId}`);
    if (!existing) return res.status(404).json({ message: 'Lead not found' });
    const updated = { ...existing, ...req.body, leadId, userId: req.userId, updatedAt: new Date().toISOString() };
    await dbSet(`user_data/${req.userId}/leads/${leadId}`, updated);
    res.json({ lead: updated });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message || 'Failed to update lead' });
  }
});

// ─── Delete lead ──────────────────────────────────────────────────────────────

leadFinderRouter.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const leadId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await dbRemove(`user_data/${req.userId}/leads/${leadId}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message || 'Failed to delete lead' });
  }
});

// ─── Save lead to CRM ─────────────────────────────────────────────────────────

leadFinderRouter.post('/:id/save-to-crm', async (req: AuthRequest, res) => {
  try {
    const leadId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const lead = await dbGet<Lead>(`user_data/${req.userId}/leads/${leadId}`);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    const clientId = uuidv4();
    const now = new Date().toISOString();
    const client = {
      clientId,
      name: lead.companyName,
      websiteUrl: lead.website,
      businessCategory: lead.businessCategory ?? null,
      contactEmail: lead.email ?? null,
      contactPhone: lead.phone ?? null,
      socialLinks: lead.socialLinks ?? [],
      userId: req.userId,
      createdAt: now,
      updatedAt: now,
    };

    await dbSet(`user_data/${req.userId}/clients/${clientId}`, client);

    // Mark lead as saved to CRM
    const updatedLead = { ...lead, savedTocrm: true, updatedAt: now };
    await dbSet(`user_data/${req.userId}/leads/${leadId}`, updatedLead);

    res.status(201).json({ clientId, lead: updatedLead });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message || 'Failed to save to CRM' });
  }
});

// ─── Export leads ─────────────────────────────────────────────────────────────

leadFinderRouter.post('/export', async (req: AuthRequest, res) => {
  try {
    const { format = 'csv', leadIds, leads: clientLeads } = req.body as { format: string; leadIds?: string[]; leads?: Lead[] };
    
    let leads: Lead[];
    if (clientLeads && Array.isArray(clientLeads)) {
      leads = clientLeads;
    } else {
      const allLeads = await dbGetAll<Lead>(`user_data/${req.userId}/leads`);
      leads = leadIds?.length
        ? allLeads.filter((l) => leadIds.includes(l.leadId))
        : allLeads;
    }

    const filename = `leads-${Date.now()}.${format}`;

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(JSON.stringify(leads, null, 2));
      return;
    }

    // CSV
    const headers = ['Company','Website','Category','Location','Email','Phone','LinkedIn','AI Score','Priority','Services'];
    const rows = leads.map((l) => [
      `"${l.companyName}"`, l.website, l.businessCategory, l.location,
      l.email ?? '', l.phone ?? '', l.linkedinUrl ?? '',
      l.aiLeadScore, l.priorityScore,
      `"${(l.potentialServices ?? []).join('; ')}"`,
    ].join(','));

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send([headers.join(','), ...rows].join('\n'));
  } catch (error) {
    res.status(500).json({ message: (error as Error).message || 'Export failed' });
  }
});

// suppress unused import warnings
void axios; void load;
