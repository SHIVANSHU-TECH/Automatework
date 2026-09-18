import { getToken, clearToken } from './auth';

export const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === 'production'
    ? 'https://automatework-tmfr.onrender.com'
    : 'http://localhost:4000');

const FRIENDLY =
  'Something went wrong. Please try again in a moment.';

const looksTechnical = (msg: string) =>
  /api[_-]?key|gsk_|Bearer |model_not_found|invalid_request|GROQ|AIza|llama-|gpt-oss|openai\/|\{[\s\S]*"error"|^\d{3}\s|ECONN|ETIMEDOUT|stack|TypeError|AxiosError/i.test(
    msg,
  );

export const toUserMessage = (raw?: string, fallback = FRIENDLY): string => {
  if (!raw?.trim()) return fallback;
  if (looksTechnical(raw) || raw.length > 180) return fallback;
  return raw;
};

export const fetchJson = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> ?? {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${apiUrl}${path}`, { ...options, headers });
  } catch {
    throw new Error(FRIENDLY);
  }

  if (response.status === 401) {
    clearToken();
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new Error('Session expired. Please log in again.');
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({} as { message?: string }));
    throw new Error(toUserMessage(body?.message, FRIENDLY));
  }

  return response.json();
};

/** Exchange a Firebase ID token for our app JWT */
export const exchangeFirebaseToken = async (idToken: string): Promise<{ token: string; email: string }> => {
  const res = await fetch(`${apiUrl}/api/auth/firebase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(toUserMessage(data.message, 'Sign-in failed. Please try again.'));
  return { token: data.token, email: data.email };
};
