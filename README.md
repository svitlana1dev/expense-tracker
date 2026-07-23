# Expense Tracker

Chat-based AI expense tracker. Type expenses in plain English — GPT-4o parses them into structured data and saves them to your dashboard.

[View a live demo](https://expense-tracker-7ynk1uqmw-svitlana1devs-projects.vercel.app/) of the application

## How it works

1. Type an expense: `"Spent $25 on Starbucks"`
2. Serverless function sends it to OpenAI GPT-4o
3. Returns `{ amount, category, merchant, date }` via structured output
4. Expense saved to localStorage, analytics update instantly

## Features

- Chat UI with thinking indicator and retry on failure
- Natural language parsing — no forms, no dropdowns
- Analytics panel: total expenses, this month, avg per transaction, category breakdown
- Expenses persist across page refreshes (localStorage)
- API key never reaches the browser (server-side only)

## Tech Stack

| Layer    | Technology                                      |
| -------- | ----------------------------------------------- |
| Frontend | React 19, Vite 7, Tailwind CSS v4               |
| AI       | OpenAI GPT-4o (structured output / JSON schema) |
| Backend  | Vercel Serverless Functions (`/api`)            |
| Storage  | localStorage                                    |

## Local Development

### Option A — Vercel CLI (recommended)

Mirrors production exactly. API functions run alongside the frontend.

```bash
npm install -g vercel
cp .env.example .env.local   # add GROQ_API_KEY
npm install
vercel dev                    # http://localhost:3000
```

### Option B — Vite + Express separately

```bash
cp .env.example .env.local   # add GROQ_API_KEY

# Terminal 1 — Express API server
cd server && npm install && npm run dev   # http://localhost:3001

# Terminal 2 — Vite frontend
npm install && npm run dev               # http://localhost:3000
```

## Deploy to Vercel

```bash
vercel                              # first deploy, follow prompts
vercel env add GROQ_API_KEY       # set secret in Vercel
vercel --prod                       # production deploy
```

Or connect the repo in the Vercel dashboard — it auto-detects Vite and deploys on push.

## Environment Variables

| Variable       | Required | Description                                                      |
| -------------- | -------- | ---------------------------------------------------------------- |
| `GROQ_API_KEY` | Yes      | Free at console.groq.com — set in Vercel dashboard, never commit |
| `PORT`         | No       | Local Express server port (default: `3001`)                      |

> **Never** use the `VITE_` prefix for `GROQ_API_KEY`. That would embed it in the browser bundle.

## Scripts

| Command           | Description                      |
| ----------------- | -------------------------------- |
| `npm run dev`     | Start Vite dev server            |
| `npm run build`   | Production build                 |
| `npm run preview` | Preview production build locally |
| `npm run lint`    | Run ESLint                       |
