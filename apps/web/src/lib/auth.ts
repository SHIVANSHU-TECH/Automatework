// ─── Token storage (localStorage) ────────────────────────────────────────────

const TOKEN_KEY = 'automatework_token';
const EMAIL_KEY = 'automatework_email';

export const saveToken = (token: string, email: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(EMAIL_KEY, email);
};

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const getEmail = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(EMAIL_KEY);
};

export const clearToken = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EMAIL_KEY);
};

export const isAuthenticated = (): boolean => !!getToken();
