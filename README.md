# Claude.ai Chat Scaffold

A Claude.ai-style chat shell built with Next.js, Tailwind v4, and the Anthropic SDK. Design tokens, composable components, routing, and streaming state are already wired. Feel free to change anything if needed!

## Quick start

```bash
npm install
cp .env.example .env.local   # add your ANTHROPIC_API_KEY
npm run dev
```

Open http://localhost:3000. You'll see a greeting page with a few seeded conversations in the sidebar. Sending a message streams back a real response from Claude.

Without an API key, the app falls back to a simulated canned response so you can explore the UX loop immediately.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · Tailwind CSS v4 · Base UI · `lucide-react` · `@anthropic-ai/sdk`
