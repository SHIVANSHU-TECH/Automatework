import { Router } from 'express';
import { requireAuth, type AuthRequest } from '../modules/auth/middleware';
import { dbSet, dbGetAll, dbRemove } from '../modules/database/database';
import { generateAiAnalysis } from '../modules/ai/ai.service';
import {
  X_FREE_CHAR_LIMIT,
  fitXThread,
  fitXTweet,
} from '../modules/content/social-copy.util';
import { v4 as uuidv4 } from 'uuid';

export const xRouter = Router();
xRouter.use(requireAuth);

interface XPost {
  postId: string;
  userId: string;
  contentType: string;
  topic: string;
  tone: string;
  audience: string;
  format: string; // 'Single Tweet' or 'Thread'
  emojiUsage: string;
  hashtagCount: number;
  body: string;
  hashtags: string[];
  bestPostingTime: string;
  proposalId?: string;
  createdAt: string;
  updatedAt: string;
}

const X_HUMAN_RULES = `
WRITING RULES (strict):
- Sound like a real person on X — punchy, clear, scroll-stopping. Not a press release.
- NEVER use asterisks (*) or markdown for emphasis.
- NEVER use AI filler: "In today's world", "game-changer", "leverage", "unlock", "delve".
- Free X accounts are limited to ${X_FREE_CHAR_LIMIT} characters per tweet. Hard limit — never exceed it.
- Hashtags: plain words only in JSON (no #). Prefer 1–2 max for reach; never spam.
- Emojis sparingly and only if they fit the voice.
`.trim();

// ─── Generate post ────────────────────────────────────────────────────────────

xRouter.post('/generate', async (req: AuthRequest, res) => {
  try {
    const {
      contentType = 'Educational',
      topic,
      tone = 'Conversational',
      audience = 'Tech Community',
      format = 'Single Tweet',
      emojiUsage = 'Moderate',
      hashtagCount = 2,
    } = req.body as {
      contentType?: string; topic: string; tone?: string; audience?: string;
      format?: string; emojiUsage?: string; hashtagCount?: number;
    };

    if (!topic?.trim()) {
      return res.status(400).json({ message: 'Topic is required' });
    }

    const emojiInstructions = emojiUsage === 'None' ? 'Use NO emojis.' :
      emojiUsage === 'Minimal' ? 'Use 1 emoji maximum.' :
      emojiUsage === 'Moderate' ? 'Use 0–2 emojis only if natural.' :
      'Use emojis sparingly.';

    // Cap hashtags for free-tier length
    const tagCount = Math.min(Math.max(Number(hashtagCount) || 1, 0), 2);
    const isThread = format === 'Thread';

    const formatInstructions = isThread
      ? `Write a short thread of 3–4 tweets. Separate tweets with --- on its own line.
Each individual tweet MUST be under ${X_FREE_CHAR_LIMIT} characters (count carefully).
Put hashtags only on the LAST tweet.`
      : `Write ONE tweet. Total length including spaces MUST be under ${X_FREE_CHAR_LIMIT} characters.
Aim for 200–260 characters so hashtags still fit.`;

    const prompt = `You write X (Twitter) posts that people actually want to reply to.

Content Type: ${contentType}
Topic: ${topic}
Tone: ${tone}
Audience: ${audience}
Format: ${formatInstructions}
Emoji: ${emojiInstructions}
Hashtags: exactly ${tagCount} words (no # in the strings)

${X_HUMAN_RULES}

Return a JSON object ONLY:
{
  "body": "tweet text OR thread parts separated by ---",
  "hashtags": ["TagOne", "TagTwo"],
  "bestPostingTime": "e.g. Wednesday 12-1pm"
}`;

    const aiResult = await generateAiAnalysis({ prompt });

    let parsed: Partial<XPost> = {};
    try {
      const jsonMatch = aiResult.raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
    } catch { parsed = {}; }

    const rawBody = parsed.body ?? aiResult.raw;
    const rawTags = parsed.hashtags ?? [];

    const fitted = isThread
      ? fitXThread(rawBody, rawTags, X_FREE_CHAR_LIMIT)
      : fitXTweet(rawBody, rawTags, X_FREE_CHAR_LIMIT);

    const post: XPost = {
      postId: uuidv4(),
      userId: req.userId!,
      contentType,
      topic,
      tone,
      audience,
      format,
      emojiUsage,
      hashtagCount: tagCount,
      body: fitted.body,
      hashtags: fitted.hashtags,
      bestPostingTime: parsed.bestPostingTime ?? 'Wednesday 12-1pm',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    res.json({ post });
  } catch (error) {
    res.status(500).json({ message: 'Generation failed. Please try again in a moment.' });
  }
});

// ─── Save post ────────────────────────────────────────────────────────────────

xRouter.post('/save', async (req: AuthRequest, res) => {
  try {
    const post = req.body as XPost;
    if (!post.postId) post.postId = uuidv4();
    post.userId = req.userId!;
    post.updatedAt = new Date().toISOString();
    if (!post.createdAt) post.createdAt = new Date().toISOString();

    // Re-fit on save so free-tier limits stay enforced after edits
    const fitted = post.format === 'Thread'
      ? fitXThread(post.body ?? '', post.hashtags ?? [], X_FREE_CHAR_LIMIT)
      : fitXTweet(post.body ?? '', post.hashtags ?? [], X_FREE_CHAR_LIMIT);
    post.body = fitted.body;
    post.hashtags = fitted.hashtags;

    await dbSet(`user_data/${req.userId}/x_posts/${post.postId}`, post);
    res.status(201).json({ post });
  } catch (error) {
    res.status(500).json({ message: 'Failed to save. Please try again in a moment.' });
  }
});

// ─── List saved posts ─────────────────────────────────────────────────────────

xRouter.get('/', async (req: AuthRequest, res) => {
  try {
    const posts = await dbGetAll<XPost>(`user_data/${req.userId}/x_posts`);
    const sorted = posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ posts: sorted });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load posts. Please try again in a moment.' });
  }
});

// ─── Delete post ──────────────────────────────────────────────────────────────

xRouter.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await dbRemove(`user_data/${req.userId}/x_posts/${id}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete. Please try again in a moment.' });
  }
});
