import Anthropic from '@anthropic-ai/sdk'
import { buildDotSystemPrompt } from '@/lib/dot-prompt'
import type { KnowledgeState, SessionPhase, AlgebraProblem } from '@/lib/types'

export const runtime = 'edge'

const apiKey = process.env.ANTHROPIC_API_KEY

export async function POST(req: Request) {
  if (!apiKey) {
    return new Response('ANTHROPIC_API_KEY not configured', { status: 501 })
  }

  const {
    model = 'claude-sonnet-4-5',
    messages,
    knowledge,
    phase,
    problem = null,
  }: {
    model?: string
    messages: { role: 'user' | 'assistant'; content: string }[]
    knowledge: KnowledgeState
    phase: SessionPhase
    problem?: AlgebraProblem | null
  } = await req.json()

  const systemPrompt = buildDotSystemPrompt(knowledge, phase, problem)
  const client = new Anthropic({ apiKey })

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      const messageStream = client.messages.stream({
        model,
        max_tokens: 512,
        system: systemPrompt,
        messages,
      })

      messageStream.on('text', (delta) => {
        controller.enqueue(encoder.encode(delta))
      })

      try {
        await messageStream.finalMessage()
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  })
}
