import { getToken } from './auth';

export const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === 'production'
    ? 'https://automatework-tmfr.onrender.com'
    : 'http://localhost:4000');

export const fetchJson = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> ?? {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${apiUrl}${path}`, { ...options, headers });

  if (response.status === 401) {
    // Token expired — redirect to login
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new Error('Session expired. Please log in again.');
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.message ?? 'API request failed');
  }

  return response.json();
};
