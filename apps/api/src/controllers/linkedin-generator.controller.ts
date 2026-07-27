import { Router } from 'express';
import { requireAuth, type AuthRequest } from '../modules/auth/middleware';
import { dbSet, dbGet, dbGetAll, dbRemove } from '../modules/database/database';
import { generateAiAnalysis } from '../modules/ai/ai.service';
import { v4 as uuidv4 } from 'uuid';

export const linkedinRouter = Router();
linkedinRouter.use(requireAuth);

interface LinkedInPost {
  postId: string;
  userId: string;
  contentType: string;
  topic: string;
  tone: string;
  audience: string;
  length: string;
  cta: string;
  emojiUsage: string;
  hashtagCount: number;
  headline: string;
  hook: string;
  body: string;
  ctaText: string;
  hashtags: string[];
  imageSuggestions: string[];
  carouselSuggestions: string[];
  commentStrategy: string;
  bestPostingTime: string;
  proposalId?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Generate post ────────────────────────────────────────────────────────────

linkedinRouter.post('/generate', async (req: AuthRequest, res) => {
  try {
    const {
      contentType = 'Educational',
      topic,
      tone = 'Professional',
      audience = 'Software Decision Makers',
      length = 'Medium (150-300 words)',
      cta = 'Comment below',
      emojiUsage = 'Moderate',
      hashtagCount = 5,
      proposalContext = '',
    } = req.body as {
      contentType?: string; topic: string; tone?: string; audience?: string;
      length?: string; cta?: string; emojiUsage?: string; hashtagCount?: number;
      proposalContext?: string;
    };

    if (!topic?.trim()) {
      return res.status(400).json({ message: 'Topic is required' });
    }

    const emojiInstructions = emojiUsage === 'None' ? 'Use NO emojis.' :
      emojiUsage === 'Minimal' ? 'Use 1-2 emojis maximum.' :
      emojiUsage === 'Moderate' ? 'Use 3-5 emojis strategically.' :
      'Use emojis generously throughout.';

    const lengthGuide = length.includes('Short') ? '50-100 words' :
      length.includes('Long') ? '400-600 words' : '150-300 words';

    const prompt = `You are an expert LinkedIn content creator for a software development agency. Generate a high-performing LinkedIn post.

Content Type: ${contentType}
Topic: ${topic}
Tone: ${tone}
Target Audience: ${audience}
Word Count: ${lengthGuide}
CTA: ${cta}
Emoji: ${emojiInstructions}
Hashtags: exactly ${hashtagCount}
${proposalContext ? `Context from proposal: ${proposalContext}` : ''}

Return a JSON object with exactly these fields:
{
  "headline": "attention-grabbing headline (max 10 words)",
  "hook": "first 1-2 lines that stop the scroll",
  "body": "main content body",
  "ctaText": "specific call to action sentence",
  "hashtags": ["array", "of", "${hashtagCount}", "relevant", "hashtags"],
  "imageSuggestions": ["3 specific image or graphic ideas"],
  "carouselSuggestions": ["3 carousel slide ideas if applicable"],
  "commentStrategy": "one sentence on how to boost comments",
  "bestPostingTime": "best day and time to post (e.g., Tuesday 8-9am)"
}

Return ONLY the JSON object.`;

    const aiResult = await generateAiAnalysis({ prompt, model: 'llama3-8b-8192' });

    let parsed: Partial<LinkedInPost> = {};
    try {
      const jsonMatch = aiResult.raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
    } catch { parsed = {}; }

    const post: LinkedInPost = {
      postId: uuidv4(),
      userId: req.userId!,
      contentType,
      topic,
      tone,
      audience,
      length,
      cta,
      emojiUsage,
      hashtagCount,
      headline:          parsed.headline          ?? topic,
      hook:              parsed.hook              ?? '',
      body:              parsed.body              ?? aiResult.raw,
      ctaText:           parsed.ctaText           ?? cta,
      hashtags:          parsed.hashtags          ?? [],
      imageSuggestions:  parsed.imageSuggestions  ?? [],
      carouselSuggestions: parsed.carouselSuggestions ?? [],
      commentStrategy:   parsed.commentStrategy   ?? '',
      bestPostingTime:   parsed.bestPostingTime   ?? 'Tuesday 8-9am',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    res.json({ post });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message || 'Generation failed' });
  }
});

// ─── Generate from proposal ───────────────────────────────────────────────────

linkedinRouter.post('/from-proposal', async (req: AuthRequest, res) => {
  try {
    const { proposalId, postType = 'Case Study' } = req.body as { proposalId: string; postType?: string };
    if (!proposalId) return res.status(400).json({ message: 'proposalId required' });

    const { dbGet, paths } = await import('../modules/database/database');
    type P = { title: string; executiveSummary?: string; deliverables?: string; scope?: string };
    const proposal = await dbGet<P>(paths.proposal(req.userId!, proposalId));
    if (!proposal) return res.status(404).json({ message: 'Proposal not found' });

    const context = `Project: ${proposal.title}\nSummary: ${proposal.executiveSummary ?? ''}\nDeliverables: ${proposal.deliverables ?? ''}\nScope: ${proposal.scope ?? ''}`;

    // Reuse the generate endpoint logic inline
    const promptMap: Record<string, string> = {
      'Case Study': `Write a LinkedIn case study post about this project. Highlight the problem, solution, and results.`,
      'Project Showcase': `Write a LinkedIn project showcase post. Highlight technical excellence and innovation.`,
      'Client Win': `Write a LinkedIn post celebrating a client success story. Be proud but not boastful.`,
    };

    const prompt = `${promptMap[postType] ?? promptMap['Case Study']}

${context}

Return a JSON object with: headline, hook, body, ctaText, hashtags (5 items), imageSuggestions (3 items), carouselSuggestions (3 items), commentStrategy, bestPostingTime.
Return ONLY the JSON.`;

    const aiResult = await generateAiAnalysis({ prompt, model: 'llama3-8b-8192' });
    let parsed: Partial<LinkedInPost> = {};
    try {
      const jsonMatch = aiResult.raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
    } catch { parsed = {}; }

    const post: LinkedInPost = {
      postId: uuidv4(),
      userId: req.userId!,
      contentType: postType,
      topic: proposal.title,
      tone: 'Professional',
      audience: 'Potential Clients',
      length: 'Medium',
      cta: 'DM us',
      emojiUsage: 'Moderate',
      hashtagCount: 5,
      proposalId,
      headline:            parsed.headline            ?? proposal.title,
      hook:                parsed.hook                ?? '',
      body:                parsed.body                ?? aiResult.raw,
      ctaText:             parsed.ctaText             ?? 'Reach out to learn more',
      hashtags:            parsed.hashtags            ?? [],
      imageSuggestions:    parsed.imageSuggestions    ?? [],
      carouselSuggestions: parsed.carouselSuggestions ?? [],
      commentStrategy:     parsed.commentStrategy     ?? '',
      bestPostingTime:     parsed.bestPostingTime     ?? 'Tuesday 8-9am',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    res.json({ post });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message || 'Failed to generate from proposal' });
  }
});

// ─── Save post ────────────────────────────────────────────────────────────────

linkedinRouter.post('/save', async (req: AuthRequest, res) => {
  try {
    const post = req.body as LinkedInPost;
    if (!post.postId) post.postId = uuidv4();
    post.userId = req.userId!;
    post.updatedAt = new Date().toISOString();
    if (!post.createdAt) post.createdAt = new Date().toISOString();
    await dbSet(`user_data/${req.userId}/linkedin_posts/${post.postId}`, post);
    res.status(201).json({ post });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message || 'Failed to save' });
  }
});

// ─── List saved posts ─────────────────────────────────────────────────────────

linkedinRouter.get('/', async (req: AuthRequest, res) => {
  try {
    const posts = await dbGetAll<LinkedInPost>(`user_data/${req.userId}/linkedin_posts`);
    const sorted = posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ posts: sorted });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message || 'Failed to load posts' });
  }
});

// ─── Delete post ──────────────────────────────────────────────────────────────

linkedinRouter.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await dbRemove(`user_data/${req.userId}/linkedin_posts/${id}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message || 'Failed to delete' });
  }
});

// ─── Export post ──────────────────────────────────────────────────────────────

linkedinRouter.post('/:id/export', async (req: AuthRequest, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { format = 'markdown' } = req.body as { format: string };
    const post = await dbGet<LinkedInPost>(`user_data/${req.userId}/linkedin_posts/${id}`);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const filename = `linkedin-${id.slice(0, 8)}.${format === 'docx' ? 'docx' : format === 'html' ? 'html' : 'md'}`;

    if (format === 'markdown') {
      const md = `# ${post.headline}\n\n${post.hook}\n\n${post.body}\n\n${post.ctaText}\n\n${post.hashtags.map(h => `#${h.replace(/^#/, '')}`).join(' ')}`;
      res.setHeader('Content-Type', 'text/markdown');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(md);
    }

    if (format === 'html') {
      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${post.headline}</title></head><body>
<h1>${post.headline}</h1>
<p><strong>${post.hook}</strong></p>
<p>${post.body.replace(/\n/g, '<br/>')}</p>
<p>${post.ctaText}</p>
<p>${post.hashtags.map(h => `<span>#${h.replace(/^#/, '')}</span>`).join(' ')}</p>
</body></html>`;
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(html);
    }

    // DOCX
    const { Document, Packer, Paragraph, HeadingLevel } = require('docx');
    const doc = new Document({ sections: [{ children: [
      new Paragraph({ text: post.headline, heading: HeadingLevel.HEADING_1 }),
      new Paragraph({ text: post.hook }),
      new Paragraph({ text: '' }),
      new Paragraph({ text: post.body }),
      new Paragraph({ text: '' }),
      new Paragraph({ text: post.ctaText }),
      new Paragraph({ text: post.hashtags.join(' ') }),
    ]}]});
    const buffer = await Packer.toBuffer(doc);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.end(buffer);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message || 'Export failed' });
  }
});
