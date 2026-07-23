import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MODEL = 'gpt-4o-2024-08-06';
const MAX_RETRIES = 3;

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
          description: 'Business or person paid; infer from context if not explicit',
        },
        date: {
          type: 'string',
          description: 'Expense date in YYYY-MM-DD format',
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
- amount: positive number (no currency symbols)
- category: closest match from [Food, Transport, Shopping, Entertainment, Bills, Other]
- merchant: business or person paid — infer from keywords ("coffee" → "Coffee Shop", "pizza" → "Pizzeria")
- date: YYYY-MM-DD; resolve relative dates ("yesterday", "2 days ago") from today's date above
- If the message contains no identifiable amount, set amount to 0`;
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
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const completion = await openai.chat.completions.create({
        model: MODEL,
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          { role: 'user', content: message },
        ],
        response_format: RESPONSE_FORMAT,
        temperature: 0,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new ParseError('Empty response from model');

      const parsed = JSON.parse(content);

      if (typeof parsed.amount !== 'number' || parsed.amount <= 0) {
        throw new ParseError(
          'No valid amount found in message',
          'NO_AMOUNT'
        );
      }

      return parsed;
    } catch (err) {
      lastError = err;

      if (err instanceof ParseError) throw err;

      const isRetryable =
        err instanceof OpenAI.APIError && (err.status === 429 || err.status >= 500);

      if (!isRetryable || attempt === MAX_RETRIES) break;

      await sleep(backoff(attempt));
    }
  }

  if (lastError instanceof OpenAI.APIError && lastError.status === 429) {
    throw new ParseError('Rate limit reached — try again shortly', 'RATE_LIMIT');
  }

  throw new ParseError(
    `Failed to parse expense after ${MAX_RETRIES} attempts`,
    'UPSTREAM_ERROR'
  );
}
