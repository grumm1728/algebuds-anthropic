import Anthropic from '@anthropic-ai/sdk'
import { buildEvaluatorPrompt } from '@/lib/dot-prompt'
import type { KnowledgeState, AlgebraProblem, EvaluationResult } from '@/lib/types'
import { ALL_MISCONCEPTIONS, ALL_GAPS } from '@/lib/problems'

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
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{ role: 'user', content: evaluatorPrompt }],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : '{}'
  console.log('[eval] explanation:', studentExplanation)
  console.log('[eval] raw:', raw)

  let parsed: {
    quality: string
    conceptsCovered: string[]
    shouldFollowUp: boolean
    followUpQuestion: string | null
    misconceptionsAddressed: string[]
    gapsAddressed: string[]
  }

  try {
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    parsed = JSON.parse(cleaned)
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

  console.log('[eval] quality:', parsed.quality, '| misconceptionsAddressed:', parsed.misconceptionsAddressed, '| gapsAddressed:', parsed.gapsAddressed)

  // If the evaluator marks disengaged but still flagged misconceptions, that's contradictory —
  // upgrade to vague so the misconception removal actually runs.
  const effectiveQuality =
    parsed.quality === 'disengaged' && parsed.misconceptionsAddressed.length > 0
      ? 'vague'
      : parsed.quality

  console.log('[eval] effectiveQuality:', effectiveQuality)

  // Quality-gated knowledge removal:
  //   conceptual  → remove from both misconceptions and gaps
  //   procedural  → remove from misconceptions only (knows the step, not the why)
  //   vague       → remove from misconceptions only (on-topic but imprecise — same gate as procedural)
  //   disengaged  → no removal
  const isConceptual = effectiveQuality === 'conceptual'
  const isAtLeastProcedural = effectiveQuality === 'procedural' || effectiveQuality === 'vague'

  const updatedMisconceptions = (isConceptual || isAtLeastProcedural)
    ? knowledge.misconceptions.filter((m) => !parsed.misconceptionsAddressed.includes(m.id))
    : knowledge.misconceptions

  const updatedGaps = isConceptual
    ? knowledge.gaps.filter((g) => !parsed.gapsAddressed.includes(g.id))
    : knowledge.gaps

  // Newly taught concepts — only record what was actually removed
  const removedGapIds = isConceptual ? parsed.gapsAddressed : []
  const removedMisconceptionIds = (isConceptual || isAtLeastProcedural) ? parsed.misconceptionsAddressed : []

  const newlyCovered = [
    ...removedGapIds.map(
      (id) => ALL_GAPS.find((g) => g.id === id)?.concept ?? id,
    ),
    ...removedMisconceptionIds.map(
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
    seenMisconceptionIds: knowledge.seenMisconceptionIds,
    seenGapIds: knowledge.seenGapIds,
  }

  console.log('[eval] knowledge after:', { misconceptions: updatedKnowledge.misconceptions.map(m => m.id), gaps: updatedKnowledge.gaps.map(g => g.id) })

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
