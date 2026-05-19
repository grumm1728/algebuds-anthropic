// ── Starter types (kept for existing scaffold compatibility) ──────────────────
export type Role = 'user' | 'assistant'

export type Message = {
  role: Role
  content: string
}

export type Chat = {
  id: string
  title: string
  messages: Message[]
}

export type Config = {
  userName: string
  thinkingDelay: number
  streamSpeed: number
}

// ── Domain types ───────────────────────────────────────────────────────────────

export type DotAnimState = 'idle' | 'thinking' | 'celebrating'

/** A wrong mental model Dot currently holds */
export type Misconception = {
  id: string
  description: string       // what Dot wrongly believes
  triggerCondition: string  // which problem types surface this
}

/** A concept Dot simply doesn't know yet */
export type ConceptGap = {
  id: string
  concept: string
}

/** Internal-only — never surfaced to the student UI */
export type KnowledgeState = {
  misconceptions: Misconception[]
  gaps: ConceptGap[]
  taughtConcepts: string[]  // accumulated from SU explanations
}

export type AlgebraProblem = {
  id: string
  equation: string
  answer: string
  solutionSteps: string[]
  targetMisconceptions: string[]  // misconception ids this problem exposes
  targetGaps: string[]            // gap ids this problem requires
}

export type DotAttempt = {
  steps: string[]
  isCorrect: boolean
  errorDescription?: string  // what Dot got wrong, for the "watch me" moment
}

export type TeachMessage = {
  id: string
  sender: 'dot' | 'student'
  text: string
}

export type ExplanationQuality = 'vague' | 'procedural' | 'conceptual'

export type EvaluationResult = {
  quality: ExplanationQuality
  conceptsCovered: string[]
  updatedKnowledge: KnowledgeState
  shouldFollowUp: boolean
  followUpQuestion?: string
}

export type SessionPhase =
  | 'onboarding-attempt'   // Dot does arithmetic, gets some wrong
  | 'onboarding-teach'     // SU explains, Dot gets the quick win
  | 'onboarding-watchme'   // Dot solves correctly, attributes to SU
  | 'core-teach'           // SU teaching loop for current algebra problem
  | 'core-watchme'         // Dot attempts the problem after teaching
  | 'complete'             // All problems done

export type TeachingSession = {
  phase: SessionPhase
  currentProblemIndex: number
  knowledge: KnowledgeState
  messages: TeachMessage[]
  currentAttempt: DotAttempt | null
  dotState: DotAnimState
}
