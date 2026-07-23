/**
 * Vercel Serverless Function — POST /api/parse-expense
 *
 * Converts a natural-language expense message into structured JSON using
 * Groq (free tier). Runs entirely server-side so GROQ_API_KEY is never
 * exposed to the browser.
 *
 * Free API key: https://console.groq.com
 * Runtime: Node.js (Vercel auto-selects latest LTS)
 * Timeout: 30 s (configured in vercel.json)
 */

import Groq from 'groq-sdk';

// llama-3.3-70b-versatile: best free model on Groq for structured extraction
const MODEL = 'llama-3.3-70b-versatile';
const MAX_RETRIES = 3;

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Other'];

function buildSystemPrompt() {
  const today = new Date().toISOString().split('T')[0];
  return `You are an expense extraction assistant. Extract structured data from natural language and return ONLY valid JSON — no markdown, no explanation, no extra text.

Today: ${today}

Return exactly this JSON shape:
{
  "amount": <positive number, no currency symbols>,
  "category": <one of: ${CATEGORIES.join(', ')}>,
  "merchant": <string — business or person paid; infer from context, e.g. "coffee" → "Coffee Shop">,
  "date": <YYYY-MM-DD — resolve relative dates like "yesterday" or "2 days ago" using today above>
}

If the message contains no identifiable amount, set amount to 0.`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffMs(attempt) {
  return Math.min(1000 * 2 ** (attempt - 1), 8000);
}

function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY environment variable is not set');
  }
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

export default async function handler(req, res) {
  // ── Method guard ─────────────────────────────────────────────────────────────
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });
  }

  // ── Environment check ─────────────────────────────────────────────────────────
  if (!process.env.GROQ_API_KEY) {
    console.error('[parse-expense] GROQ_API_KEY is not configured');
    return res.status(503).json({
      error: 'Service is not configured. Contact the administrator.',
      code: 'SERVICE_UNAVAILABLE',
    });
  }

  // ── Input validation ──────────────────────────────────────────────────────────
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});
  const { message } = body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({
      error: 'Field "message" is required and must be a non-empty string',
      code: 'INVALID_INPUT',
    });
  }

  // ── Groq call with retry ──────────────────────────────────────────────────────
  const groq = getGroqClient();
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const completion = await groq.chat.completions.create({
        model: MODEL,
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          { role: 'user', content: message.trim() },
        ],
        response_format: { type: 'json_object' },
        temperature: 0,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error('Model returned an empty response');

      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch {
        throw new Error('Model returned malformed JSON');
      }

      if (typeof parsed.amount !== 'number' || parsed.amount <= 0) {
        return res.status(422).json({
          error: 'No valid amount found in your message. Try: "Spent $15 on coffee"',
          code: 'NO_AMOUNT',
        });
      }

      // Ensure category is one of the allowed values
      if (!CATEGORIES.includes(parsed.category)) {
        parsed.category = 'Other';
      }

      return res.status(200).json(parsed);
    } catch (err) {
      lastError = err;

      const isRetryable =
        err instanceof Groq.APIError && (err.status === 429 || err.status >= 500);

      if (!isRetryable || attempt === MAX_RETRIES) break;

      await sleep(backoffMs(attempt));
    }
  }

  // ── Map Groq errors to safe HTTP responses ────────────────────────────────────
  if (lastError instanceof Groq.APIError) {
    if (lastError.status === 429) {
      return res.status(429).json({
        error: 'Rate limit reached. Please wait a moment and try again.',
        code: 'RATE_LIMIT',
      });
    }
    if (lastError.status === 401) {
      console.error('[parse-expense] Invalid Groq API key');
      return res.status(503).json({
        error: 'Service configuration error.',
        code: 'AUTH_ERROR',
      });
    }
  }

  console.error('[parse-expense] Unhandled error after retries:', lastError?.message);
  return res.status(502).json({
    error: 'Failed to parse expense after multiple attempts. Please try again.',
    code: 'UPSTREAM_ERROR',
  });
}
