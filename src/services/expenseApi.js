const API_ENDPOINT = '/api/parse-expense';
const TIMEOUT_MS = 25_000; // 25 s — slightly under Vercel's 30 s function limit
const CLIENT_RETRY_ATTEMPTS = 2; // retry 5xx responses once before surfacing the error

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * POST /api/parse-expense
 *
 * Sends the user's natural-language message to the serverless function and
 * returns a structured expense object.  Retries once on transient 5xx errors
 * and throws a typed error on all other failures.
 *
 * @param {string} message
 * @returns {Promise<{ amount: number, category: string, merchant: string, date: string }>}
 * @throws {{ message: string, code: string, status?: number }}
 */
export async function parseExpenseViaApi(message) {
  let lastError;

  for (let attempt = 1; attempt <= CLIENT_RETRY_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const body = await res.json().catch(() => ({}));

      if (res.ok) return body;

      const err = new Error(body.error ?? `Request failed (HTTP ${res.status})`);
      err.code = body.code ?? 'HTTP_ERROR';
      err.status = res.status;

      // 4xx errors are definitive — no point retrying.
      if (res.status < 500) throw err;

      lastError = err;
    } catch (err) {
      clearTimeout(timeoutId);

      if (err.name === 'AbortError') {
        const timeoutErr = new Error('Request timed out. Please try again.');
        timeoutErr.code = 'TIMEOUT';
        throw timeoutErr;
      }

      // Re-throw typed errors (4xx, NO_AMOUNT, etc.) immediately.
      if (err.code && err.code !== 'HTTP_ERROR') throw err;

      lastError = err;
    }

    // Brief pause before the retry.
    if (attempt < CLIENT_RETRY_ATTEMPTS) await sleep(800 * attempt);
  }

  throw lastError ?? new Error('Failed to reach the server. Please check your connection.');
}
