import Groq from 'groq-sdk';

export type AiRequest = {
  prompt: string;
  model?: string;
};

export type AiResponse = {
  raw: string;
  sections: Record<string, string>;
};

// Initialise lazily so the env var is read after dotenv.config() in index.ts
let groqClient: Groq | null = null;

const getClient = (): Groq => {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY ?? process.env.Groq_api_key;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY environment variable is missing. Set it in your .env file.');
    }
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
};

export const generateAiAnalysis = async (request: AiRequest): Promise<AiResponse> => {
  const client = getClient();

  const completion = await client.chat.completions.create({
    model: request.model ?? 'llama-3.1-8b-instant',
    messages: [{ role: 'user', content: request.prompt }],
  });

  const text = completion.choices[0]?.message?.content ?? '';

  return {
    raw: text,
    sections: {
      aiAnalysis: text,
    },
  };
};
