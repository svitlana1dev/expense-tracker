/**
 * Vercel Serverless Function — POST /api/parse-expense
 *
 * Converts a natural-language expense message into structured JSON using
 * OpenAI GPT-4o structured output. Runs entirely server-side so the
 * OPENAI_API_KEY is never exposed to the browser.
 *
 * Runtime: Node.js (Vercel auto-selects latest LTS)
 * Timeout: 30 s (configured in vercel.json)
 */

import OpenAI from 'openai';

const MODEL = 'gpt-4o-2024-08-06';
const MAX_RETRIES = 3;

// JSON Schema for OpenAI structured output — enforces the exact shape we need.
const RESPONSE_FORMAT = {
  type: 'json_schema',
  json_schema: {
    name: 'expense',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        amount: {
          type: 'number',
          description: 'Positive expense amount with up to 2 decimal places',
        },
        category: {
          type: 'string',
          enum: ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Other'],
        },
        merchant: {
          type: 'string',
          description: 'Business or person paid; infer from context when not explicit',
        },
        date: {
          type: 'string',
          description: 'Expense date as YYYY-MM-DD',
        },
      },
      required: ['amount', 'category', 'merchant', 'date'],
      additionalProperties: false,
    },
  },
};

function buildSystemPrompt() {
  const today = new Date().toISOString().split('T')[0];
  return `You are an expense extraction assistant. Extract structured data from natural language.

Today: ${today}

Rules:
- amount: positive number, no currency symbols
- category: pick the closest from [Food, Transport, Shopping, Entertainment, Bills, Other]
- merchant: the business or person paid — infer from keywords ("coffee" → "Coffee Shop")
- date: YYYY-MM-DD; resolve relative dates ("yesterday", "2 days ago") using today above
- If the message contains no identifiable amount, set amount to 0`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Exponential back-off capped at 8 s
function backoffMs(attempt) {
  return Math.min(1000 * 2 ** (attempt - 1), 8000);
}

// Lazily created so Vercel only validates the env var when the route is hit.
function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export default async function handler(req, res) {
  // ── Method guard ────────────────────────────────────────────────────────────
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });
  }

  // ── Environment check ────────────────────────────────────────────────────────
  if (!process.env.OPENAI_API_KEY) {
    console.error('[parse-expense] OPENAI_API_KEY is not configured');
    return res.status(503).json({
      error: 'Service is not configured. Contact the administrator.',
      code: 'SERVICE_UNAVAILABLE',
    });
  }

  // ── Input validation ─────────────────────────────────────────────────────────
  // Vercel auto-parses JSON bodies; handle both string and object forms.
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});
  const { message } = body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({
      error: 'Field "message" is required and must be a non-empty string',
      code: 'INVALID_INPUT',
    });
  }

  // ── OpenAI call with retry ───────────────────────────────────────────────────
  const openai = getOpenAIClient();
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const completion = await openai.chat.completions.create({
        model: MODEL,
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          { role: 'user', content: message.trim() },
        ],
        response_format: RESPONSE_FORMAT,
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

      // Amount of 0 means the model could not find an amount in the input.
      if (typeof parsed.amount !== 'number' || parsed.amount <= 0) {
        return res.status(422).json({
          error: 'No valid amount found in your message. Try: "Spent $15 on coffee"',
          code: 'NO_AMOUNT',
        });
      }

      return res.status(200).json(parsed);
    } catch (err) {
      lastError = err;

      const isRetryable =
        err instanceof OpenAI.APIError && (err.status === 429 || err.status >= 500);

      if (!isRetryable || attempt === MAX_RETRIES) break;

      await sleep(backoffMs(attempt));
    }
  }

  // ── Map OpenAI errors to safe HTTP responses ─────────────────────────────────
  if (lastError instanceof OpenAI.APIError) {
    if (lastError.status === 429) {
      return res.status(429).json({
        error: 'Rate limit reached. Please wait a moment and try again.',
        code: 'RATE_LIMIT',
      });
    }
    if (lastError.status === 401) {
      console.error('[parse-expense] Invalid OpenAI API key');
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
