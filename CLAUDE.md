# CLAUDE.md

Guidance for AI assistants working in this codebase.

## What this is

A Claude.ai-style chat scaffold built on Next.js App Router, used as a takehome starting point. Ships a working UI with server-side API streaming; candidates extend it however they see fit.

## Architecture (bottom-up)

1. **Design tokens** — `src/app/globals.css` defines colors, fonts, weights, radii, and shadows under Tailwind v4's `@theme`, surfaced as utilities (`bg-page`, `font-text`, `shadow-input`). Layout constants are plain CSS vars.
2. **UI primitives** — `src/components/ui/` holds `Button`, `Avatar`.
3. **Chat components** — `src/components/chat/` holds `InputBar`, `Sidebar` (+ subparts), `UserMessage`, `ClaudeMessage` (+ `ClaudeHeading`/`ClaudeParagraph`/etc.), `Greeting`, `ChatHeader`, `SparkIndicator`, `AssistantBody`, `ModelPicker`.
4. **State** — `src/lib/chat-store.tsx` is a React context (`'use client'`). `ChatProvider` wraps the app in the root layout, `useChatStore()` reads it anywhere.
5. **API** — `src/app/api/chat/route.ts` calls Anthropic server-side. `src/lib/api.ts` exposes `streamChat()` which fetches that route. Model default is `claude-sonnet-4-6`.
6. **Routes** — App Router under `src/app/`: `/` redirects to `/new`, `/new` is the landing, `/chat/[chatId]` is the thread, `/projects` is a placeholder.

## Component conventions

All components follow this shape:

```tsx
import { cn } from '@/lib/utils'
import type { ComponentProps } from 'react'

type ThingProps = ComponentProps<'div'> & {
  customProp?: string
}

export function Thing({ className, customProp, ...props }: ThingProps) {
  return <div className={cn('base-classes', className)} {...props} />
}
```

- Props extend `ComponentProps<'rootElement'>` so native attributes pass through
- `className` merged with `cn()` (clsx + tailwind-merge)
- Remaining props spread onto the root element
- Add `'use client'` to any component that uses hooks, state, or browser APIs
- Icons: import directly from `lucide-react`, size with Tailwind (`<Plus className="size-4" />`)

## Server vs client

- Route handlers (`app/api/**/route.ts`) run server-side — put API keys and SDK calls here
- Pages default to server components; add `'use client'` when you need hooks, state, or event handlers
- The chat store, sidebar (uses `usePathname`), and input bar are client components; the rest can stay server-side

## Commands

```bash
npm run dev     # dev server on :3000
npm run build   # production build + typecheck
npm run lint    # eslint
```

Run `build` before considering a change done — it catches TypeScript errors and SSR issues.
