import Groq from 'groq-sdk';

export type AiRequest = {
  prompt: string;
  model?: string;
};

export type AiResponse = {
  raw: string;
  sections: Record<string, string>;
};

/** Current Groq production default (llama-3.1-8b-instant was shut down Aug 2026). */
export const DEFAULT_GROQ_MODEL = 'openai/gpt-oss-20b';

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

export const generateAiAnalysis = async (request: AiRequest): Promise<AiResponse> => {
  try {
    const client = getClient();

    const completion = await client.chat.completions.create({
      model: request.model ?? DEFAULT_GROQ_MODEL,
      messages: [{ role: 'user', content: request.prompt }],
    });

    const text = completion.choices[0]?.message?.content ?? '';

    return {
      raw: text,
      sections: {
        aiAnalysis: text,
      },
    };
  } catch {
    throw new Error('AI generation is temporarily unavailable. Please try again in a moment.');
  }
};
