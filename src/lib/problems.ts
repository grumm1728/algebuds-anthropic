import type { AlgebraProblem, Misconception, ConceptGap, KnowledgeState, HomeworkLine } from './types'

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
  {
    id: 'non-integer-result',
    description:
      'When solving leads to a decimal or fraction answer, I round to the nearest integer or stop before the final division step',
    triggerCondition: 'two-step equations where the final answer is not a whole number',
  },
  {
    id: 'partial-distribution',
    description:
      'When distributing, I only multiply the first term inside the parentheses, not all of them',
    triggerCondition: 'equations with parentheses like a(x + b) = c',
  },
  {
    id: 'ignore-negative-coefficient',
    description:
      'When the coefficient of x is negative (like -3x), I treat it as positive and get the magnitude right but the wrong sign',
    triggerCondition: 'equations like -3x = 15 (should give x = -5, gives x = 5)',
  },
  {
    id: 'variable-subtracted',
    description:
      'For equations in the form a - bx = c, I don\'t know how to handle x being subtracted — I may treat it as a + bx = c, or make a sign error after isolating -bx',
    triggerCondition: 'equations like 4 - 5x = 14',
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
  {
    id: 'distributive-property',
    concept:
      'When multiplying a term by a parenthesized sum, every term inside must be multiplied: a(x + b) = ax + ab',
  },
  {
    id: 'negative-coefficient',
    concept:
      'A negative coefficient means dividing both sides by a negative number flips the sign of x',
  },
  {
    id: 'solving-subtracted-variable',
    concept:
      'When x is being subtracted (a - bx = c), add bx to both sides first to make it positive, then solve as normal',
  },
]

// ── Seed knowledge state ───────────────────────────────────────────────────────

export const INITIAL_KNOWLEDGE: KnowledgeState = {
  misconceptions: [ALL_MISCONCEPTIONS[0], ALL_MISCONCEPTIONS[1]],
  gaps: [ALL_GAPS[0], ALL_GAPS[1]],
  taughtConcepts: [],
  seenMisconceptionIds: [ALL_MISCONCEPTIONS[0].id, ALL_MISCONCEPTIONS[1].id],
  seenGapIds: [ALL_GAPS[0].id, ALL_GAPS[1].id],
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
    id: 'p1b',
    equation: 'x - 3 = 9',
    answer: 'x = 12',
    solutionSteps: [
      'Start with x - 3 = 9.',
      'Add 3 to both sides: x - 3 + 3 = 9 + 3.',
      'Simplify: x = 12.',
      'Check: 12 - 3 = 9 ✓',
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
    targetMisconceptions: ['undo-order', 'move-dont-balance', 'non-integer-result'],
    targetGaps: ['equality-principle', 'inverse-operations'],
  },
  {
    id: 'p6',
    equation: '2(x + 3) = 14',
    answer: 'x = 4',
    solutionSteps: [
      'Start with 2(x + 3) = 14.',
      'Distribute: 2x + 6 = 14.',
      'Subtract 6 from both sides: 2x = 8.',
      'Divide both sides by 2: x = 4.',
      'Check: 2(4 + 3) = 2 × 7 = 14 ✓',
    ],
    targetMisconceptions: ['partial-distribution'],
    targetGaps: ['distributive-property'],
  },
]

// ── Onboarding homework (4 problems, 3 wrong — the carrying ones) ─────────────
// scratchWork shows Dot's working-out notes (written small, in handwriting font)
// dotAnswer is her final answer (written big, in handwriting font)

export const INITIAL_HOMEWORK: HomeworkLine[] = [
  {
    id: 'h1',
    given: '33 + 5',
    scratchWork: '3 + 5 = 8',
    dotAnswer: '38',
    correctAnswer: '38',
    isCorrect: true,
    state: 'hidden',
  },
  {
    id: 'h2',
    given: '37 + 15',
    scratchWork: '7 + 5 = 12',
    dotAnswer: '42',
    correctAnswer: '52',
    isCorrect: false,
    state: 'hidden',
  },
  {
    id: 'h3',
    given: '28 + 23',
    scratchWork: '8 + 3 = 11',
    dotAnswer: '41',
    correctAnswer: '51',
    isCorrect: false,
    state: 'hidden',
  },
  {
    id: 'h4',
    given: '46 + 17',
    scratchWork: '6 + 7 = 13',
    dotAnswer: '53',
    correctAnswer: '63',
    isCorrect: false,
    state: 'hidden',
  },
]

