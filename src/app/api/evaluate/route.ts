import Anthropic from '@anthropic-ai/sdk'
import { buildEvaluatorPrompt } from '@/lib/dot-prompt'
import type { KnowledgeState, AlgebraProblem, EvaluationResult } from '@/lib/types'
import { ALL_MISCONCEPTIONS, ALL_GAPS } from '@/lib/problems'

export const runtime = 'edge'

const apiKey = process.env.ANTHROPIC_API_KEY

export async function POST(req: Request) {
  if (!apiKey) {
    return new Response('ANTHROPIC_API_KEY not configured', { status: 501 })
  }

  const {
    studentExplanation,
    knowledge,
    problem,
  }: {
    studentExplanation: string
    knowledge: KnowledgeState
    problem: AlgebraProblem
  } = await req.json()

  const evaluatorPrompt = buildEvaluatorPrompt(studentExplanation, knowledge, problem)
  const client = new Anthropic({ apiKey })

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 512,
    messages: [{ role: 'user', content: evaluatorPrompt }],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : '{}'

  let parsed: {
    quality: string
    conceptsCovered: string[]
    shouldFollowUp: boolean
    followUpQuestion: string | null
    misconceptionsAddressed: string[]
    gapsAddressed: string[]
  }

  try {
    parsed = JSON.parse(raw)
  } catch {
    // Fallback if Claude returns invalid JSON
    parsed = {
      quality: 'vague',
      conceptsCovered: [],
      shouldFollowUp: false,
      followUpQuestion: null,
      misconceptionsAddressed: [],
      gapsAddressed: [],
    }
  }

  // Build updated knowledge state
  const updatedMisconceptions = knowledge.misconceptions.filter(
    (m) => !parsed.misconceptionsAddressed.includes(m.id),
  )
  const updatedGaps = knowledge.gaps.filter(
    (g) => !parsed.gapsAddressed.includes(g.id),
  )

  // Newly taught concepts: pull full descriptions from master lists
  const newlyCovered = [
    ...parsed.gapsAddressed.map(
      (id) => ALL_GAPS.find((g) => g.id === id)?.concept ?? id,
    ),
    ...parsed.misconceptionsAddressed.map(
      (id) =>
        ALL_MISCONCEPTIONS.find((m) => m.id === id)?.description
          ? `Corrected: ${ALL_MISCONCEPTIONS.find((m) => m.id === id)!.description}`
          : id,
    ),
  ]

  const updatedKnowledge: KnowledgeState = {
    misconceptions: updatedMisconceptions,
    gaps: updatedGaps,
    taughtConcepts: [
      ...knowledge.taughtConcepts,
      ...newlyCovered.filter((c) => !knowledge.taughtConcepts.includes(c)),
    ],
  }

  const result: EvaluationResult = {
    quality: parsed.quality as EvaluationResult['quality'],
    conceptsCovered: parsed.conceptsCovered,
    updatedKnowledge,
    shouldFollowUp: parsed.shouldFollowUp,
    followUpQuestion: parsed.followUpQuestion ?? undefined,
  }

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  })
}
