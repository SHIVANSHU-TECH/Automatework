import { Router } from 'express';
import { requireAuth, type AuthRequest } from '../modules/auth/middleware';
import { dbSet, dbGet, dbGetAll, dbRemove } from '../modules/database/database';
import { generateAiAnalysis } from '../modules/ai/ai.service';
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
  body: string; // In thread case, strings separated by '\n\n' can represent tweets
  hashtags: string[];
  bestPostingTime: string;
  proposalId?: string;
  createdAt: string;
  updatedAt: string;
}

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
      emojiUsage === 'Moderate' ? 'Use 1-2 emojis.' :
      'Use emojis generously.';

    const formatInstructions = format === 'Thread' 
      ? 'Write a Twitter Thread (3-5 tweets). Separate each tweet with three dashes (---).' 
      : 'Write a single Tweet under 280 characters.';

    const prompt = `You are an expert X (Twitter) content creator for a tech startup/agency. Generate a high-performing post.

Content Type: ${contentType}
Topic: ${topic}
Tone: ${tone}
Target Audience: ${audience}
Format: ${formatInstructions}
Emoji: ${emojiInstructions}
Hashtags: exactly ${hashtagCount}

Return a JSON object with exactly these fields:
{
  "body": "The main content body. If it is a thread, separate tweets with ---",
  "hashtags": ["array", "of", "${hashtagCount}", "relevant", "hashtags"],
  "bestPostingTime": "best day and time to post (e.g., Wednesday 12-1pm)"
}

Return ONLY the JSON object.`;

    const aiResult = await generateAiAnalysis({ prompt, model: 'llama-3.1-8b-instant' });

    let parsed: Partial<XPost> = {};
    try {
      const jsonMatch = aiResult.raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
    } catch { parsed = {}; }

    const post: XPost = {
      postId: uuidv4(),
      userId: req.userId!,
      contentType,
      topic,
      tone,
      audience,
      format,
      emojiUsage,
      hashtagCount,
      body:              parsed.body              ?? aiResult.raw,
      hashtags:          parsed.hashtags          ?? [],
      bestPostingTime:   parsed.bestPostingTime   ?? 'Wednesday 12-1pm',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    res.json({ post });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message || 'Generation failed' });
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
    await dbSet(`user_data/${req.userId}/x_posts/${post.postId}`, post);
    res.status(201).json({ post });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message || 'Failed to save' });
  }
});

// ─── List saved posts ─────────────────────────────────────────────────────────

xRouter.get('/', async (req: AuthRequest, res) => {
  try {
    const posts = await dbGetAll<XPost>(`user_data/${req.userId}/x_posts`);
    const sorted = posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ posts: sorted });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message || 'Failed to load posts' });
  }
});

// ─── Delete post ──────────────────────────────────────────────────────────────

xRouter.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await dbRemove(`user_data/${req.userId}/x_posts/${id}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message || 'Failed to delete' });
  }
});

// ─── X Connection & Posting ───────────────────────────────────────────

xRouter.get('/status', async (req: AuthRequest, res) => {
  try {
    const isConnected = await dbGet<boolean>(`user_data/${req.userId}/x_connected`);
    res.json({ connected: !!isConnected });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get status' });
  }
});

xRouter.post('/connect', async (req: AuthRequest, res) => {
  try {
    // Mocking OAuth connection
    await dbSet(`user_data/${req.userId}/x_connected`, true);
    res.json({ success: true, message: 'X account connected successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to connect' });
  }
});

xRouter.post('/post', async (req: AuthRequest, res) => {
  try {
    const isConnected = await dbGet<boolean>(`user_data/${req.userId}/x_connected`);
    if (!isConnected) return res.status(403).json({ message: 'X account not connected' });

    const { content } = req.body as { content: string };
    if (!content) return res.status(400).json({ message: 'Content is required' });

    // Mock posting to X
    await new Promise((resolve) => setTimeout(resolve, 1500));

    res.json({ success: true, message: 'Posted to X successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to post to X' });
  }
});
