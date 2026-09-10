// retry.js
const RETRYABLE = new Set([408, 429, 500, 502, 503, 504]);

export async function withRetry(fn, attempts = 3) {
  let lastError;

  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      const status = err.status ?? err.code;

      if (!RETRYABLE.has(status) || i === attempts - 1) break;

      const delay = 500 * 2 ** i;
      await new Promise(r => setTimeout(r, delay));
    }
  }

  throw lastError;
}