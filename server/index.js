import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Load root .env first, then server/.env (server/.env takes precedence if both exist)
config({ path: resolve(__dirname, '../.env') });
config({ path: resolve(__dirname, '.env') });
import express from 'express';
import cors from 'cors';
import { parseExpenseMessage, ParseError } from './parser.js';

if (!process.env.GROQ_API_KEY) {
  console.error('Missing GROQ_API_KEY in environment');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }));
app.use(express.json());

app.post('/api/parse-expense', async (req, res) => {
  const { message } = req.body ?? {};

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'message is required and must be a non-empty string' });
  }

  try {
    const expense = await parseExpenseMessage(message.trim());
    return res.json(expense);
  } catch (err) {
    if (err instanceof ParseError) {
      const status = err.code === 'NO_AMOUNT' ? 422 : err.code === 'RATE_LIMIT' ? 429 : 502;
      return res.status(status).json({ error: err.message, code: err.code });
    }

    console.error('[/api/parse-expense]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
