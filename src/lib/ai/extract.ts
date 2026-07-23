import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { ExpenseExtractionSchema, type ExpenseExtraction } from "./schema";
import { buildSystemPrompt } from "./prompts";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MODEL = "gpt-4o-2024-08-06";
const MAX_RETRIES = 3;

export class ExtractionError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "ExtractionError";
  }
}

export async function extractExpense(
  userMessage: string,
  todayIso?: string
): Promise<ExpenseExtraction> {
  const today = todayIso ?? new Date().toISOString().split("T")[0];
  const systemPrompt = buildSystemPrompt(today);

  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const completion = await openai.beta.chat.completions.parse({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        response_format: zodResponseFormat(ExpenseExtractionSchema, "expense"),
        temperature: 0,
      });

      const message = completion.choices[0]?.message;

      if (message?.refusal) {
        throw new ExtractionError(`Model refused: ${message.refusal}`);
      }

      if (!message?.parsed) {
        throw new ExtractionError("Model returned no parsed output");
      }

      return ExpenseExtractionSchema.parse(message.parsed);
    } catch (err) {
      lastError = err;

      if (err instanceof ExtractionError) throw err;

      const isRetryable =
        err instanceof OpenAI.APIError &&
        (err.status === 429 || err.status >= 500);

      if (!isRetryable || attempt === MAX_RETRIES) break;

      await sleep(exponentialBackoff(attempt));
    }
  }

  throw new ExtractionError(
    `Failed to extract expense after ${MAX_RETRIES} attempts`,
    lastError
  );
}

function exponentialBackoff(attempt: number): number {
  return Math.min(1000 * 2 ** (attempt - 1), 8000);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
