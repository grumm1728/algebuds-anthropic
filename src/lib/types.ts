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
  | 'core-writing'         // B2: algebra workbook opens, Dot attempts problem
  | 'core-teach'           // B3+: teaching conversation, Dot re-attempts on progress
  | 'home'                 // D1: full home state

// ── Dot anim ───────────────────────────────────────────────────────────────────
export type DotAnimState = 'idle' | 'thinking' | 'celebrating' | 'walking'

// ── Knowledge state (internal only, never shown to student) ───────────────────
export type Misconception = {
  id: string
  description: string
}

export type ConceptGap = {
  id: string
  concept: string
}

export type KnowledgeState = {
  misconceptions: Misconception[]
  gaps: ConceptGap[]
  seenMisconceptionIds: string[]  // IDs ever active; prevents re-injection after correction
  seenGapIds: string[]
}

// ── Problems ───────────────────────────────────────────────────────────────────
export type AlgebraProblem = {
  id: string
  equation: string
  answer: string
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

// 'timing'  = answer written, 5-second countdown running
// 'correct' = green checkmark
// 'wrong'   = red dot (includes '???' answers)
export type AttemptVerdict = 'timing' | 'correct' | 'wrong'

export type WorkAttempt = {
  id: string
  steps: string[]           // intermediate work lines from [WORK:] token
  answer: string | null     // null while Dot is writing; '???' if stuck; 'x = N' otherwise
  verdict: AttemptVerdict | null  // null until answer is set
}

export type ProblemBlock = {
  id: string                // matches AlgebraProblem.id
  equation: string
  attempts: WorkAttempt[]   // attempts[0..n-2] are struck through; last is active
}

// ── Chat ───────────────────────────────────────────────────────────────────────
export type TeachMessage = {
  id: string
  sender: 'dot' | 'student'
  text: string
}

export type ExplanationQuality = 'vague' | 'procedural' | 'conceptual' | 'disengaged'

export type EvaluationResult = {
  quality: ExplanationQuality
  updatedKnowledge: KnowledgeState
}

