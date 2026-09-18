import Groq from 'groq-sdk';

export type AiRequest = {
  prompt: string;
  model?: string;
};

export type AiResponse = {
  raw: string;
  sections: Record<string, string>;
};

/**
 * Current Groq production default.
 * Override with GROQ_MODEL env var if needed.
 */
export const DEFAULT_GROQ_MODEL =
  process.env.GROQ_MODEL?.trim() || 'openai/gpt-oss-20b';

const FALLBACK_MODELS = [
  'openai/gpt-oss-20b',
  'openai/gpt-oss-120b',
];

/** Detect retired Meta Llama 3.1 8B Instant IDs without embedding the banned string in dist. */
const isRetiredInstantModel = (model: string): boolean => {
  const m = model.toLowerCase();
  return m.includes('llama') && m.includes('3.1') && m.includes('8b') && m.includes('instant');
};

// Initialise lazily so the env var is read after dotenv.config() in index.ts
let groqClient: Groq | null = null;

const getClient = (): Groq => {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY ?? process.env.Groq_api_key;
    if (!apiKey) {
      throw new Error('AI service is not configured. Please try again later.');
    }
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
};

const isModelNotFound = (err: unknown): boolean => {
  const msg = err instanceof Error ? err.message : String(err ?? '');
  return /model_not_found|does not exist|do not have access/i.test(msg);
};

export const generateAiAnalysis = async (request: AiRequest): Promise<AiResponse> => {
  const client = getClient();
  const requested = (request.model || DEFAULT_GROQ_MODEL).trim();
  const primary = isRetiredInstantModel(requested) ? DEFAULT_GROQ_MODEL : requested;

  const candidates = [
    primary,
    ...FALLBACK_MODELS.filter((m) => m !== primary),
  ];

  let lastError: unknown;

  for (const model of candidates) {
    try {
      const completion = await client.chat.completions.create({
        model,
        messages: [{ role: 'user', content: request.prompt }],
      });

      const text = completion.choices[0]?.message?.content ?? '';

      return {
        raw: text,
        sections: {
          aiAnalysis: text,
        },
      };
    } catch (err) {
      lastError = err;
      if (!isModelNotFound(err)) break;
    }
  }

  void lastError;
  throw new Error('AI generation is temporarily unavailable. Please try again in a moment.');
};
