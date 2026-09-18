import { Router } from 'express';
import { requireAuth, type AuthRequest } from '../modules/auth/middleware';
import { dbSet, dbGet, dbGetAll, dbRemove } from '../modules/database/database';
import { generateAiAnalysis } from '../modules/ai/ai.service';
import { cleanHashtags, stripAiFormatting } from '../modules/content/social-copy.util';
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

const HUMAN_VOICE_RULES = `
WRITING RULES (strict — posts that break these get ignored):
- Sound like a real founder or marketer talking to peers — warm, specific, conversational.
- NEVER use asterisks (*) or underscores (_) for emphasis or bold. No markdown at all.
- NEVER write like ChatGPT: no "In today's digital world", "Let's dive in", "game-changer", "leverage", "unlock potential", "delve", "tapestry", "landscape".
- Prefer short sentences. Mix sentence length. Occasional one-line paragraphs for scroll-stopping rhythm.
- Use concrete details, mini-stories, or a real tension the reader feels — not generic advice.
- Hashtags: plain words only (no # inside the JSON strings). Max as requested. Prefer niche over spammy.
- Emojis only where they feel natural — never decorate every line.
- CTA should feel like a real invite, not a sales script.
`.trim();


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
      emojiUsage === 'Moderate' ? 'Use 3-5 emojis strategically where a human would.' :
      'Use emojis generously but still naturally.';

    const lengthGuide = length.includes('Short') ? '50-100 words' :
      length.includes('Long') ? '400-600 words' : '150-300 words';

    const tagCount = Math.min(Math.max(Number(hashtagCount) || 3, 0), 8);

    const prompt = `You write LinkedIn posts that get reach because people feel seen — not because they sound "AI polished".

Content Type: ${contentType}
Topic: ${topic}
Tone: ${tone} (still human — never stiff or corporate-robot)
Target Audience: ${audience}
Word Count: ${lengthGuide}
CTA direction: ${cta}
Emoji: ${emojiInstructions}
Hashtags: exactly ${tagCount} (words only, no # symbol in the strings)
${proposalContext ? `Context from proposal: ${proposalContext}` : ''}

${HUMAN_VOICE_RULES}

Return a JSON object with exactly these fields:
{
  "headline": "attention-grabbing headline (max 10 words, no asterisks)",
  "hook": "first 1-2 lines that stop the scroll — personal or specific",
  "body": "main content — human voice, line breaks ok, ZERO asterisks",
  "ctaText": "natural call to action",
  "hashtags": ["WordOne", "WordTwo"],
  "imageSuggestions": ["3 specific image or graphic ideas"],
  "carouselSuggestions": ["3 carousel slide ideas if applicable"],
  "commentStrategy": "one sentence on how to boost comments",
  "bestPostingTime": "best day and time to post (e.g., Tuesday 8-9am)"
}

Return ONLY the JSON object.`;

    const aiResult = await generateAiAnalysis({ prompt });

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
      hashtagCount: tagCount,
      headline:          stripAiFormatting(parsed.headline          ?? topic),
      hook:              stripAiFormatting(parsed.hook              ?? ''),
      body:              stripAiFormatting(parsed.body              ?? aiResult.raw),
      ctaText:           stripAiFormatting(parsed.ctaText           ?? cta),
      hashtags:          cleanHashtags(parsed.hashtags, tagCount),
      imageSuggestions:  (parsed.imageSuggestions  ?? []).map((s) => stripAiFormatting(String(s))),
      carouselSuggestions: (parsed.carouselSuggestions ?? []).map((s) => stripAiFormatting(String(s))),
      commentStrategy:   stripAiFormatting(parsed.commentStrategy   ?? ''),
      bestPostingTime:   parsed.bestPostingTime   ?? 'Tuesday 8-9am',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    res.json({ post });
  } catch (error) {
    res.status(500).json({ message: 'Generation failed. Please try again in a moment.' });
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
      'Case Study': `Write a LinkedIn case study as a short story: the mess they were in, what changed, what improved. No fluff.`,
      'Project Showcase': `Write a LinkedIn project showcase like you're telling a peer what you built and why it mattered.`,
      'Client Win': `Write a LinkedIn post celebrating a client win — proud, specific, not salesy.`,
    };

    const prompt = `${promptMap[postType] ?? promptMap['Case Study']}

${context}

${HUMAN_VOICE_RULES}

Return a JSON object with: headline, hook, body, ctaText, hashtags (5 words, no #), imageSuggestions (3), carouselSuggestions (3), commentStrategy, bestPostingTime.
No asterisks or markdown anywhere in the text fields.
Return ONLY the JSON.`;

    const aiResult = await generateAiAnalysis({ prompt });
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
      headline:            stripAiFormatting(parsed.headline            ?? proposal.title),
      hook:                stripAiFormatting(parsed.hook                ?? ''),
      body:                stripAiFormatting(parsed.body                ?? aiResult.raw),
      ctaText:             stripAiFormatting(parsed.ctaText             ?? 'Reach out to learn more'),
      hashtags:            cleanHashtags(parsed.hashtags, 5),
      imageSuggestions:    (parsed.imageSuggestions    ?? []).map((s) => stripAiFormatting(String(s))),
      carouselSuggestions: (parsed.carouselSuggestions ?? []).map((s) => stripAiFormatting(String(s))),
      commentStrategy:     stripAiFormatting(parsed.commentStrategy     ?? ''),
      bestPostingTime:     parsed.bestPostingTime     ?? 'Tuesday 8-9am',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    res.json({ post });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate from proposal. Please try again in a moment.' });
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

// ─── LinkedIn Connection & Posting ───────────────────────────────────────────

// Removed unused mock connection endpoints (now handled by frontend direct intent)
