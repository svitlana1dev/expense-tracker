import Groq from 'groq-sdk';

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
  return new Promise((r) => setTimeout(r, ms));
}

function backoff(attempt) {
  return Math.min(1000 * 2 ** (attempt - 1), 8000);
}

export class ParseError extends Error {
  constructor(message, code = 'PARSE_ERROR') {
    super(message);
    this.name = 'ParseError';
    this.code = code;
  }
}

export async function parseExpenseMessage(message) {
  if (!process.env.GROQ_API_KEY) {
    throw new ParseError('GROQ_API_KEY is not set', 'SERVICE_UNAVAILABLE');
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const completion = await groq.chat.completions.create({
        model: MODEL,
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          { role: 'user', content: message },
        ],
        response_format: { type: 'json_object' },
        temperature: 0,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new ParseError('Empty response from model');

      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch {
        throw new ParseError('Model returned malformed JSON');
      }

      if (typeof parsed.amount !== 'number' || parsed.amount <= 0) {
        throw new ParseError('No valid amount found in message', 'NO_AMOUNT');
      }

      if (!CATEGORIES.includes(parsed.category)) {
        parsed.category = 'Other';
      }

      return parsed;
    } catch (err) {
      lastError = err;

      if (err instanceof ParseError) throw err;

      const isRetryable =
        err instanceof Groq.APIError && (err.status === 429 || err.status >= 500);

      if (!isRetryable || attempt === MAX_RETRIES) break;

      await sleep(backoff(attempt));
    }
  }

  if (lastError instanceof Groq.APIError && lastError.status === 429) {
    throw new ParseError('Rate limit reached — try again shortly', 'RATE_LIMIT');
  }

  throw new ParseError(
    `Failed to parse expense after ${MAX_RETRIES} attempts`,
    'UPSTREAM_ERROR'
  );
}
