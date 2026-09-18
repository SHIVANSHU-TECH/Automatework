/**
 * Sanitize errors before sending them to clients.
 * Never leak API keys, model IDs, raw upstream JSON, or stack traces.
 */
const SENSITIVE =
  /api[_-]?key|gsk_|Bearer\s|Authorization|model_not_found|invalid_request|GROQ|AIza|private.?key|firebase|ENOENT|ECONNREFUSED|ECONNRESET|ETIMEDOUT|stack trace|at\s+\S+\s+\(|llama-|gpt-oss|openai\//i;

const TECHNICAL =
  /\{[\s\S]*"error"|^\d{3}\s|StatusCodeError|AxiosError|TypeError|ReferenceError|SyntaxError|fetch failed/i;

export const FRIENDLY_FAILURE =
  'Something went wrong on our end. Please try again in a moment.';

export function publicErrorMessage(
  error: unknown,
  fallback: string = FRIENDLY_FAILURE,
): string {
  const msg = error instanceof Error ? error.message : String(error ?? '');
  if (!msg.trim()) return fallback;
  if (SENSITIVE.test(msg) || TECHNICAL.test(msg) || msg.includes('\n')) {
    return fallback;
  }
  // Keep short, intentional validation messages
  if (msg.length <= 180) return msg;
  return fallback;
}
