import Anthropic from '@anthropic-ai/sdk'
import { buildEvaluatorPrompt } from '@/lib/dot-prompt'
import type { KnowledgeState, AlgebraProblem, EvaluationResult } from '@/lib/types'

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
    misconceptionsAddressed: string[]
    gapsAddressed: string[]
  }

  try {
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    parsed = JSON.parse(cleaned)
  } catch {
    parsed = {
      quality: 'vague',
      misconceptionsAddressed: [],
      gapsAddressed: [],
    }
  }

  // If the evaluator marks disengaged but still flagged misconceptions, that's contradictory —
  // upgrade to vague so the misconception removal actually runs.
  const effectiveQuality =
    parsed.quality === 'disengaged' && parsed.misconceptionsAddressed.length > 0
      ? 'vague'
      : parsed.quality

  console.log('[eval] quality:', effectiveQuality, '| misconceptionsAddressed:', parsed.misconceptionsAddressed, '| gapsAddressed:', parsed.gapsAddressed)

  // Quality-gated knowledge removal:
  //   conceptual  → remove from both misconceptions and gaps
  //   procedural  → remove from misconceptions only (knows the step, not the why)
  //   vague       → no removal (on-topic but too imprecise to act on)
  //   disengaged  → no removal
  const isConceptual = effectiveQuality === 'conceptual'
  const isProcedural = effectiveQuality === 'procedural'

  const updatedMisconceptions = (isConceptual || isProcedural)
    ? knowledge.misconceptions.filter((m) => !parsed.misconceptionsAddressed.includes(m.id))
    : knowledge.misconceptions

  const updatedGaps = isConceptual
    ? knowledge.gaps.filter((g) => !parsed.gapsAddressed.includes(g.id))
    : knowledge.gaps

  const updatedKnowledge: KnowledgeState = {
    misconceptions: updatedMisconceptions,
    gaps: updatedGaps,
    seenMisconceptionIds: knowledge.seenMisconceptionIds,
    seenGapIds: knowledge.seenGapIds,
  }

  console.log('[eval] knowledge after:', { misconceptions: updatedKnowledge.misconceptions.map(m => m.id), gaps: updatedKnowledge.gaps.map(g => g.id) })

  const result: EvaluationResult = {
    quality: effectiveQuality as EvaluationResult['quality'],
    updatedKnowledge,
  }

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  })
}
