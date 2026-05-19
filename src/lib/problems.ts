import type { AlgebraProblem, Misconception, ConceptGap, KnowledgeState, HomeworkLine, QuizItem } from './types'

// ── Misconceptions ─────────────────────────────────────────────────────────────
// Buggy rules from earlier grades that worked once but break in new contexts

export const ALL_MISCONCEPTIONS: Misconception[] = [
  {
    id: 'move-dont-balance',
    description:
      'When solving equations I "move" numbers to the other side, but I don\'t understand why — so I forget to apply the same operation to both sides',
    triggerCondition: 'any equation with a constant to isolate',
  },
  {
    id: 'undo-order',
    description:
      'I try to deal with the coefficient before undoing addition or subtraction, because multiplication feels more important',
    triggerCondition: 'two-step equations like 2x - 3 = 19',
  },
  {
    id: 'fraction-flip',
    description:
      'With fraction coefficients like (1/3)x = 15, I try to divide by the fraction instead of multiplying by its reciprocal',
    triggerCondition: 'equations with fraction coefficients',
  },
]

// ── Gaps ───────────────────────────────────────────────────────────────────────
// Concepts Dot genuinely doesn't know yet

export const ALL_GAPS: ConceptGap[] = [
  {
    id: 'equality-principle',
    concept:
      'Whatever you do to one side of an equation, you must do to the other — the equals sign means both sides stay balanced',
  },
  {
    id: 'inverse-operations',
    concept:
      'Each operation has an inverse (add/subtract, multiply/divide) and you use the inverse to undo it',
  },
  {
    id: 'reciprocal-multiplication',
    concept:
      'Multiplying by the reciprocal of a fraction is the same as dividing by the fraction',
  },
]

// ── Seed knowledge state ───────────────────────────────────────────────────────

export const INITIAL_KNOWLEDGE: KnowledgeState = {
  misconceptions: [ALL_MISCONCEPTIONS[0], ALL_MISCONCEPTIONS[1]],
  gaps: [ALL_GAPS[0], ALL_GAPS[1]],
  taughtConcepts: [],
}

// ── Problem progression (from spec) ───────────────────────────────────────────

export const ALGEBRA_PROBLEMS: AlgebraProblem[] = [
  {
    id: 'p1',
    equation: 'x + 5 = 12',
    answer: 'x = 7',
    solutionSteps: [
      'Start with x + 5 = 12.',
      'Subtract 5 from both sides: x + 5 - 5 = 12 - 5.',
      'Simplify: x = 7.',
      'Check: 7 + 5 = 12 ✓',
    ],
    targetMisconceptions: ['move-dont-balance'],
    targetGaps: ['equality-principle', 'inverse-operations'],
  },
  {
    id: 'p2',
    equation: '3x = 15',
    answer: 'x = 5',
    solutionSteps: [
      'Start with 3x = 15.',
      'Divide both sides by 3: 3x ÷ 3 = 15 ÷ 3.',
      'Simplify: x = 5.',
      'Check: 3 × 5 = 15 ✓',
    ],
    targetMisconceptions: ['move-dont-balance'],
    targetGaps: ['equality-principle', 'inverse-operations'],
  },
  {
    id: 'p3',
    equation: '(1/3)x = 15',
    answer: 'x = 45',
    solutionSteps: [
      'Start with (1/3)x = 15.',
      'Multiply both sides by 3 (the reciprocal of 1/3): 3 × (1/3)x = 3 × 15.',
      'Simplify: x = 45.',
      'Check: (1/3) × 45 = 15 ✓',
    ],
    targetMisconceptions: ['fraction-flip'],
    targetGaps: ['reciprocal-multiplication'],
  },
  {
    id: 'p4',
    equation: '2x - 3 = 19',
    answer: 'x = 11',
    solutionSteps: [
      'Start with 2x - 3 = 19.',
      'Add 3 to both sides: 2x - 3 + 3 = 19 + 3.',
      'Simplify: 2x = 22.',
      'Divide both sides by 2: x = 11.',
      'Check: 2(11) - 3 = 22 - 3 = 19 ✓',
    ],
    targetMisconceptions: ['undo-order', 'move-dont-balance'],
    targetGaps: ['equality-principle', 'inverse-operations'],
  },
  {
    id: 'p5',
    equation: '2x - 3 = 18',
    answer: 'x = 10.5',
    solutionSteps: [
      'Start with 2x - 3 = 18.',
      'Add 3 to both sides: 2x = 21.',
      'Divide both sides by 2: x = 10.5.',
      'Check: 2(10.5) - 3 = 21 - 3 = 18 ✓',
    ],
    targetMisconceptions: ['undo-order', 'move-dont-balance'],
    targetGaps: ['equality-principle', 'inverse-operations'],
  },
]

// ── Onboarding homework (8 problems, 3 wrong — the carrying ones) ─────────────

export const INITIAL_HOMEWORK: HomeworkLine[] = [
  { id: 'h1', problem: '33 + 5',  dotAnswer: '38', correctAnswer: '38', isCorrect: true,  state: 'hidden' },
  { id: 'h2', problem: '3 + 5',   dotAnswer: '8',  correctAnswer: '8',  isCorrect: true,  state: 'hidden' },
  { id: 'h3', problem: '37 + 15', dotAnswer: '42', correctAnswer: '52', isCorrect: false, state: 'hidden' },
  { id: 'h4', problem: '7 + 5',   dotAnswer: '12', correctAnswer: '12', isCorrect: true,  state: 'hidden' },
  { id: 'h5', problem: '28 + 23', dotAnswer: '41', correctAnswer: '51', isCorrect: false, state: 'hidden' },
  { id: 'h6', problem: '8 + 3',   dotAnswer: '11', correctAnswer: '11', isCorrect: true,  state: 'hidden' },
  { id: 'h7', problem: '46 + 17', dotAnswer: '53', correctAnswer: '63', isCorrect: false, state: 'hidden' },
  { id: 'h8', problem: '6 + 7',   dotAnswer: '13', correctAnswer: '13', isCorrect: true,  state: 'hidden' },
]

// ── Quiz sheet (scripted — reflects partial teaching) ─────────────────────────
// Dot gets most right but still misses fraction + two-step edge cases

export const INITIAL_QUIZ: QuizItem[] = [
  { id: 'q1',  equation: 'x + 5 = 20',          dotAnswer: 'x = 15',     isCorrect: true,  state: 'hidden' },
  { id: 'q2',  equation: 'x + 5 = 11',          dotAnswer: 'x = 6',      isCorrect: true,  state: 'hidden' },
  { id: 'q3',  equation: '4 + x = 16',          dotAnswer: 'x = 12',     isCorrect: true,  state: 'hidden' },
  { id: 'q4',  equation: '3x = 18',             dotAnswer: 'x = 6',      isCorrect: true,  state: 'hidden' },
  { id: 'q5',  equation: '5x = 15',             dotAnswer: 'x = 3',      isCorrect: true,  state: 'hidden' },
  { id: 'q6',  equation: 'x + 3 = 9',           dotAnswer: 'x = 6',      isCorrect: true,  state: 'hidden' },
  { id: 'q7',  equation: '2x + 1 = 9',          dotAnswer: 'x = 4',      isCorrect: true,  state: 'hidden' },
  { id: 'q8',  equation: 'x - 5 = 20',          dotAnswer: 'x = 25',     isCorrect: true,  state: 'hidden' },
  { id: 'q9',  equation: '2x - 3 = 11',         dotAnswer: 'x = 4',      isCorrect: false, state: 'hidden' },
  { id: 'q10', equation: '(1/2)x = 15',         dotAnswer: 'x = 7.5',    isCorrect: false, state: 'hidden' },
  { id: 'q11', equation: '3x - 6 = 18',         dotAnswer: 'x = 2',      isCorrect: false, state: 'hidden' },
  { id: 'q12', equation: '(1/3)x + 2 = 8',      dotAnswer: 'x = 2',      isCorrect: false, state: 'hidden' },
]
