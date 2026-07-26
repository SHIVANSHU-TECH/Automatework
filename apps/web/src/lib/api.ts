export const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const fetchJson = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(`${apiUrl}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.message ?? 'API request failed');
  }

  return response.json();
};
