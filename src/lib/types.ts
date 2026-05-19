// ── Starter types (kept for scaffold compatibility) ────────────────────────────
export type Role = 'user' | 'assistant'
export type Message = { role: Role; content: string }
export type Chat = { id: string; title: string; messages: Message[] }
export type Config = { userName: string; thinkingDelay: number; streamSpeed: number }

// ── Session phases ─────────────────────────────────────────────────────────────
export type SessionPhase =
  | 'landing'              // A1: classroom only, Dot idle-walks
  | 'onboarding-writing'   // A3–A4: homework notebook open, answers fill in
  | 'onboarding-graded'    // A5: red marks appear, Dot sends opening message
  | 'onboarding-teach'     // A6: teaching conversation
  | 'onboarding-correct'   // A7: corrections animate, star appears
  | 'onboarding-done'      // A8: Next button visible
  | 'core-intro'           // B1: classroom + chat, new notebook on desk
  | 'core-writing'         // B2: algebra workbook opens, wrong attempt fills in
  | 'core-teach'           // B3–B6: teaching conversation + corrections
  | 'core-quiz-prompt'     // B7: "Next: Dot's Quiz" CTA
  | 'quiz-intro'           // C1: classroom, chalkboard clickable
  | 'quiz-writing'         // C2–C3: quiz sheet fills in (30s)
  | 'quiz-graded'          // C4: red marks, Dot reacts
  | 'home'                 // D1: full home state

// ── Dot anim ───────────────────────────────────────────────────────────────────
export type DotAnimState = 'idle' | 'thinking' | 'celebrating'

// ── Knowledge state (internal only, never shown to student) ───────────────────
export type Misconception = {
  id: string
  description: string
  triggerCondition: string
}

export type ConceptGap = {
  id: string
  concept: string
}

export type KnowledgeState = {
  misconceptions: Misconception[]
  gaps: ConceptGap[]
  taughtConcepts: string[]
}

// ── Problems ───────────────────────────────────────────────────────────────────
export type AlgebraProblem = {
  id: string
  equation: string
  answer: string
  solutionSteps: string[]
  targetMisconceptions: string[]
  targetGaps: string[]
}

// ── Homework page (onboarding left page) ──────────────────────────────────────
// Each entry is one printed problem + the work Dot shows below it
export type HomeworkLine = {
  id: string
  given: string         // printed problem text e.g. "33 + 5"
  scratchWork: string   // Dot's working notes e.g. "3 + 5 = 8"
  dotAnswer: string     // Dot's final answer e.g. "38"
  correctAnswer: string
  isCorrect: boolean
  // hidden → written → marked → corrected
  state: 'hidden' | 'written' | 'marked' | 'corrected'
}

// ── Algebra workbook page ─────────────────────────────────────────────────────
export type WorkLine = {
  id: string
  text: string
  style: 'equation' | 'wrong-attempt' | 'step' | 'result'
  crossedOut?: boolean
}

// ── Quiz sheet ─────────────────────────────────────────────────────────────────
export type QuizItem = {
  id: string
  equation: string
  dotAnswer: string
  isCorrect: boolean
  state: 'hidden' | 'writing' | 'done' | 'marked'
}

// ── Chat ───────────────────────────────────────────────────────────────────────
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

// ── Legacy (kept for type compat) ─────────────────────────────────────────────
export type DotAttempt = {
  steps: string[]
  isCorrect: boolean
  errorDescription?: string
}

export type TeachingSession = {
  phase: SessionPhase
  currentProblemIndex: number
  knowledge: KnowledgeState
  messages: TeachMessage[]
  currentAttempt: DotAttempt | null
  dotState: DotAnimState
}
