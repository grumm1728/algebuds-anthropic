'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type {
  SessionPhase,
  DotAnimState,
  TeachMessage,
  KnowledgeState,
  AlgebraProblem,
  EvaluationResult,
  HomeworkLine,
  ProblemBlock,
  WorkAttempt,
  AttemptVerdict,
} from './types'
import { ALGEBRA_PROBLEMS, INITIAL_KNOWLEDGE, INITIAL_HOMEWORK, ALL_MISCONCEPTIONS, ALL_GAPS } from './problems'

// ── Scripted content ───────────────────────────────────────────────────────────

const OPENING_MESSAGE =
  "oh hi!! I just finished my whole homework list SO fast!! but... my teacher circled some. I got 37 + 15 = 42, and 28 + 23 = 41, and 46 + 17 = 53. they're all marked wrong but I can't see why 😟 can you help me figure out what I keep messing up?"

const ALGEBRA_INTRO = (problem: AlgebraProblem, wrongAnswer: string) =>
  `ok!! my teacher also gave us algebra — equations with x. I tried this one: ${problem.equation}. I got ${wrongAnswer}. marked wrong. what am I doing wrong?`

const FIRST_ATTEMPTS: Record<string, string> = {
  p1:  'x = 17 (moved the 5 over and added it)',
  p1b: 'x = 6 (moved the 3 over but kept subtracting)',
  p2:  'x = 18 (moved the 3 over and added)',
  p3:  'x = 5 (divided by 3)',
  p4:  'x = 9.5 (divided 19 by 2 first)',
  p5:  'x = 9 (divided 18 by 2 first)',
  p6:  'x = 5.5 (multiplied the x but forgot about the 3 inside the parentheses)',
}

// Scripted first attempts — shown when the workbook opens and on each new problem.
// Each problem has ordered options; first whose ifMisconceptionsActive are all met wins.
// Last entry in each array is the unconditional default.
type ScriptedAttemptOption = {
  steps: string[]
  answer: string
  ifMisconceptionsActive?: string[]
}

const SCRIPTED_FIRST_ATTEMPTS: Record<string, ScriptedAttemptOption[]> = {
  p1: [
    { steps: ['x + 5 = 12', 'x = 12 + 5'], answer: 'x = 17' },
  ],
  p1b: [
    { ifMisconceptionsActive: ['move-dont-balance'], steps: ['x - 3 = 9', 'x = 9 - 3'], answer: 'x = 6' },
    { steps: ['x - 3 = 9', 'x - 3 + 3 = 9 + 3'], answer: 'x = 12' }, // balance learned — correct!
  ],
  p2: [
    { ifMisconceptionsActive: ['move-dont-balance'], steps: ['3x = 15', 'x = 15 + 3'], answer: 'x = 18' },
    { steps: ['3x = 15', '3x - 3 = 15 - 3'], answer: 'x = 12' }, // balanced but wrong op
  ],
  p3: [
    { steps: ['(1/3)x = 15', 'x = 15 ÷ 3'], answer: 'x = 5' },
  ],
  p4: [
    { ifMisconceptionsActive: ['move-dont-balance'], steps: ['2x - 3 = 19', '2x = 19', 'x = 19 ÷ 2'], answer: 'x = 9.5' },
    { steps: ['2x - 3 = 19', '2x - 3 ÷ 2 = 19 ÷ 2', 'x - 3 = 9.5', 'x = 12.5'], answer: 'x = 12.5' }, // undo-order only
  ],
  p5: [
    { ifMisconceptionsActive: ['move-dont-balance'], steps: ['2x - 3 = 18', '2x = 18', 'x = 18 ÷ 2'], answer: 'x = 9' },
    { steps: ['2x - 3 = 18', '2x - 3 ÷ 2 = 18 ÷ 2', 'x - 3 = 9', 'x = 12'], answer: 'x = 12' }, // undo-order only
  ],
  p6: [
    { steps: ['2(x + 3) = 14', '2x + 3 = 14', '2x = 11'], answer: 'x = 5.5' },
  ],
}

const COMPLETE_MESSAGE =
  "we did it!! all five!! I actually understand equations now — not just the steps, the WHY behind each one. I already have ideas for my drawing program... maybe I can use this to make perfect spirals!! thank you for teaching me 🐢✨"

// ── Helpers ───────────────────────────────────────────────────────────────────

let msgCounter = 0
function genId()     { return `msg-${Date.now()}-${msgCounter++}` }
function newAttemptId() { return `attempt-${Date.now()}-${msgCounter++}` }

function toApiMessages(msgs: TeachMessage[]) {
  return msgs.map((m) => ({
    role: (m.sender === 'dot' ? 'assistant' : 'user') as 'user' | 'assistant',
    content: m.text,
  }))
}

// Animates a WorkAttempt into view one line at a time.
// Adds steps sequentially, then the answer, then starts the verdict timer.
function animateAttemptLines(
  setProblemBlocks: React.Dispatch<React.SetStateAction<ProblemBlock[]>>,
  blockId: string,
  attemptId: string,
  steps: string[],
  answer: string,
  onTimerStart?: () => void,
  delayMs = 280,
) {
  steps.forEach((step, i) => {
    setTimeout(() => {
      setProblemBlocks((prev) => prev.map((b) =>
        b.id !== blockId ? b : {
          ...b,
          attempts: b.attempts.map((a) =>
            a.id !== attemptId ? a : { ...a, steps: [...a.steps, step] }
          ),
        }
      ))
    }, (i + 1) * delayMs)
  })

  // Answer appears after all steps
  setTimeout(() => {
    setProblemBlocks((prev) => prev.map((b) =>
      b.id !== blockId ? b : {
        ...b,
        attempts: b.attempts.map((a) =>
          a.id !== attemptId ? a : { ...a, answer }
        ),
      }
    ))
  }, (steps.length + 1) * delayMs)

  // Verdict timer starts one beat after answer
  setTimeout(() => {
    setProblemBlocks((prev) => prev.map((b) =>
      b.id !== blockId ? b : {
        ...b,
        attempts: b.attempts.map((a) =>
          a.id !== attemptId ? a : { ...a, verdict: 'timing' as AttemptVerdict }
        ),
      }
    ))
    onTimerStart?.()
  }, (steps.length + 2) * delayMs)
}

// ── Store type ────────────────────────────────────────────────────────────────

type DotStoreType = {
  phase: SessionPhase
  messages: TeachMessage[]
  knowledge: KnowledgeState
  currentProblem: AlgebraProblem | null
  dotAnimState: DotAnimState
  isStreaming: boolean
  streamBuffer: string
  dotIsTyping: boolean
  chatVisible: boolean
  homeworkLines: HomeworkLine[]
  problemBlocks: ProblemBlock[]
  openNotebook: () => void
  sendMessage: (text: string) => Promise<void>
  resolveVerdict: (problemId: string, attemptId: string, answer: string) => void
  proceedToNext: () => void
  helpDot: () => void
  skipOnboarding: () => void
}

const DotContext = createContext<DotStoreType | null>(null)

// ── Provider ──────────────────────────────────────────────────────────────────

export function DotProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<SessionPhase>('landing')
  const [messages, setMessages] = useState<TeachMessage[]>([])
  const [knowledge, setKnowledge] = useState<KnowledgeState>(INITIAL_KNOWLEDGE)
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0)
  const [dotAnimState, setDotAnimState] = useState<DotAnimState>('idle')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamBuffer, setStreamBuffer] = useState('')
  const [dotIsTyping, setDotIsTyping] = useState(false)
  const [chatVisible, setChatVisible] = useState(false)
  const [onboardingCount, setOnboardingCount] = useState(0)
  const [perProblemExchangeCount, setPerProblemExchangeCount] = useState(0)
  const [homeworkLines, setHomeworkLines] = useState<HomeworkLine[]>(INITIAL_HOMEWORK)
  const [problemBlocks, setProblemBlocks] = useState<ProblemBlock[]>([])

  const bufferRef = useRef('')
  const currentProblem = ALGEBRA_PROBLEMS[currentProblemIndex] ?? null

  // ── Core streaming ────────────────────────────────────────────────────────

  const addDotMessage = useCallback((text: string) => {
    setMessages((prev) => [...prev, { id: genId(), sender: 'dot', text }])
  }, [])

  const streamDotResponse = useCallback(
    async (
      history: TeachMessage[],
      knowledgeState: KnowledgeState,
      currentPhase: SessionPhase,
      problem: AlgebraProblem | null,
    ): Promise<string> => {
      setIsStreaming(true)
      setDotAnimState('thinking')
      bufferRef.current = ''
      setStreamBuffer('')

      let fullText = ''
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: toApiMessages(history),
            knowledge: knowledgeState,
            phase: currentPhase,
            problem,
          }),
        })
        if (!res.ok || !res.body) throw new Error(`Chat failed: ${res.status}`)
        const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            bufferRef.current += value
            setStreamBuffer(bufferRef.current)
          }
        } finally { reader.releaseLock() }
        fullText = bufferRef.current
      } finally {
        setStreamBuffer('')
        setIsStreaming(false)
      }

      const segments = fullText.split('|||').map((s) => s.trim()).filter(Boolean)
      if (segments.length === 0) {
        setDotAnimState('idle')
        return fullText
      }

      // Extract [WORK:...] from a segment, append a new attempt to the current
      // problem block, then deliver the clean chat text.
      const deliverSegment = (seg: string) => {
        const workMatch = seg.match(/\[WORK:([^\]]+)\]/)
        const cleanText = seg.replace(/\[WORK:[^\]]*\]/, '').trim()

        if (workMatch) {
          const parts = workMatch[1].split('|').map((p) => p.trim()).filter(Boolean)
          // parts[0] = equation (already shown as block header — skip)
          // parts[1..n-2] = intermediate steps
          // parts[n-1] = answer ('???' when Dot is stuck)
          if (parts.length >= 2 && problem) {
            const steps = parts.slice(1, parts.length - 1)
            const answer = parts[parts.length - 1]
            const id = newAttemptId()

            // Add empty attempt shell first, then animate lines in
            setProblemBlocks((prev) => {
              if (prev.length === 0) return prev
              const last = prev[prev.length - 1]
              const newAttempt: WorkAttempt = { id, steps: [], answer: null, verdict: null }
              return [
                ...prev.slice(0, -1),
                { ...last, attempts: [...last.attempts, newAttempt] },
              ]
            })

            animateAttemptLines(setProblemBlocks, problem.id, id, steps, answer)
          }
        }

        if (cleanText) addDotMessage(cleanText)
      }

      deliverSegment(segments[0])

      for (let i = 1; i < segments.length; i++) {
        const seg = segments[i]
        const visibleLen = seg.replace(/\[WORK:[^\]]*\]/, '').length
        const typingMs = Math.min(900 + visibleLen * 28, 3800)
        setDotIsTyping(true)
        await new Promise((r) => setTimeout(r, typingMs))
        setDotIsTyping(false)
        deliverSegment(seg)
      }

      setDotAnimState('idle')
      return fullText
    },
    [addDotMessage],
  )

  const evaluateExplanation = useCallback(
    async (
      studentText: string,
      currentKnowledge: KnowledgeState,
      problem: AlgebraProblem,
    ): Promise<EvaluationResult> => {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentExplanation: studentText, knowledge: currentKnowledge, problem }),
      })
      if (!res.ok) throw new Error('Evaluation failed')
      return res.json()
    },
    [],
  )

  // ── advanceWorkspaceToProblem ─────────────────────────────────────────────
  // Appends a new ProblemBlock for the next problem with its scripted first attempt.

  const advanceWorkspaceToProblem = useCallback(async (nextIndex: number) => {
    const nextProblem = ALGEBRA_PROBLEMS[nextIndex]
    if (!nextProblem) return

    setCurrentProblemIndex(nextIndex)
    setPerProblemExchangeCount(0)

    // Compute injected knowledge synchronously so we can use it for attempt selection
    const existingMisconceptionIds = new Set(knowledge.misconceptions.map((m) => m.id))
    const existingGapIds = new Set(knowledge.gaps.map((g) => g.id))
    const newMisconceptions = nextProblem.targetMisconceptions
      .filter((id) => !existingMisconceptionIds.has(id) && !knowledge.seenMisconceptionIds.includes(id))
      .map((id) => ALL_MISCONCEPTIONS.find((m) => m.id === id))
      .filter((m): m is NonNullable<typeof m> => m !== undefined)
    const newGaps = nextProblem.targetGaps
      .filter((id) => !existingGapIds.has(id) && !knowledge.seenGapIds.includes(id))
      .map((id) => ALL_GAPS.find((g) => g.id === id))
      .filter((g): g is NonNullable<typeof g> => g !== undefined)
    const injectedKnowledge: KnowledgeState = {
      ...knowledge,
      misconceptions: [...knowledge.misconceptions, ...newMisconceptions],
      gaps: [...knowledge.gaps, ...newGaps],
      seenMisconceptionIds: [...knowledge.seenMisconceptionIds, ...newMisconceptions.map((m) => m.id)],
      seenGapIds: [...knowledge.seenGapIds, ...newGaps.map((g) => g.id)],
    }
    setKnowledge(injectedKnowledge)

    // Select the scripted attempt appropriate for current knowledge state
    const activeIds = new Set(injectedKnowledge.misconceptions.map((m) => m.id))
    const options = SCRIPTED_FIRST_ATTEMPTS[nextProblem.id]
    const scripted = options.find(
      (o) => !o.ifMisconceptionsActive || o.ifMisconceptionsActive.every((id) => activeIds.has(id))
    ) ?? options[options.length - 1]

    await new Promise((r) => setTimeout(r, 900))

    const id = newAttemptId()

    setProblemBlocks((prev) => [
      ...prev,
      {
        id: nextProblem.id,
        equation: nextProblem.equation,
        attempts: [{ id, steps: [], answer: null, verdict: null }],
      },
    ])

    animateAttemptLines(setProblemBlocks, nextProblem.id, id, scripted.steps, scripted.answer)

    await new Promise((r) => setTimeout(r, 500))
    const isCorrectAttempt = scripted.answer === nextProblem.answer
    addDotMessage(
      isCorrectAttempt
        ? `ooh wait!! I tried ${nextProblem.equation} and I think I got it!! your teaching is working — can you check my work?`
        : `ooh wait!! I want to try that on a new one — ${nextProblem.equation}!! I wrote my attempt in the notebook, can you check if I did it right?`,
    )
  }, [addDotMessage, knowledge])

  // ── resolveVerdict ────────────────────────────────────────────────────────
  // Called by the UI after the 5-second countdown finishes.
  // answer is passed in directly (the UI already has it) to avoid stale closure issues.

  const resolveVerdict = useCallback((problemId: string, attemptId: string, answer: string) => {
    const problem = ALGEBRA_PROBLEMS.find((p) => p.id === problemId)
    if (!problem) return

    const isCorrect = answer !== '???' && answer === problem.answer
    const verdict: AttemptVerdict = isCorrect ? 'correct' : 'wrong'

    setProblemBlocks((prev) =>
      prev.map((b) =>
        b.id === problemId
          ? {
              ...b,
              attempts: b.attempts.map((a) =>
                a.id === attemptId ? { ...a, verdict } : a
              ),
            }
          : b
      )
    )

    if (isCorrect) {
      const idx = ALGEBRA_PROBLEMS.findIndex((p) => p.id === problemId)
      setTimeout(() => {
        const nextIdx = idx + 1
        if (nextIdx < ALGEBRA_PROBLEMS.length) {
          advanceWorkspaceToProblem(nextIdx)
        } else {
          setDotAnimState('celebrating')
          addDotMessage(COMPLETE_MESSAGE)
          setTimeout(() => {
            setDotAnimState('idle')
            setPhase('home')
          }, 2000)
        }
      }, 600)
    }
  }, [advanceWorkspaceToProblem, addDotMessage])

  // ── openNotebook ───────────────────────────────────────────────────────────

  const openHomeworkNotebook = useCallback(() => {
    setChatVisible(true)
    setPhase('onboarding-writing')

    INITIAL_HOMEWORK.forEach((_, i) => {
      setTimeout(() => {
        setHomeworkLines((prev) =>
          prev.map((l, idx) => idx === i ? { ...l, state: 'written' } : l)
        )
      }, (i + 1) * 300)
    })

    const totalWriteMs = INITIAL_HOMEWORK.length * 300 + 400
    setTimeout(() => {
      setPhase('onboarding-graded')
      setHomeworkLines((prev) =>
        prev.map((l) => ({ ...l, state: l.isCorrect ? 'written' : 'marked' }))
      )
      setTimeout(() => {
        addDotMessage(OPENING_MESSAGE)
        setPhase('onboarding-teach')
      }, 700)
    }, totalWriteMs)
  }, [addDotMessage])

  const openAlgebraNotebook = useCallback(() => {
    const problem = ALGEBRA_PROBLEMS[currentProblemIndex]
    setPhase('core-writing')

    const activeIds = new Set(knowledge.misconceptions.map((m) => m.id))
    const options = SCRIPTED_FIRST_ATTEMPTS[problem.id]
    const scripted = options.find(
      (o) => !o.ifMisconceptionsActive || o.ifMisconceptionsActive.every((id) => activeIds.has(id))
    ) ?? options[options.length - 1]
    const id = newAttemptId()

    setProblemBlocks([{
      id: problem.id,
      equation: problem.equation,
      attempts: [{ id, steps: [], answer: null, verdict: null }],
    }])

    // Transition to core-teach once the timer has started (all lines written in)
    animateAttemptLines(
      setProblemBlocks, problem.id, id, scripted.steps, scripted.answer,
      () => setTimeout(() => setPhase('core-teach'), 400),
    )
  }, [currentProblemIndex, knowledge])

  const openNotebook = useCallback(() => {
    if (phase === 'landing') openHomeworkNotebook()
    else if (phase === 'core-intro') openAlgebraNotebook()
  }, [phase, openHomeworkNotebook, openAlgebraNotebook])

  // ── sendMessage ────────────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (text: string) => {
      const studentMsg: TeachMessage = { id: genId(), sender: 'student', text }
      const nextMessages = [...messages, studentMsg]
      setMessages(nextMessages)

      if (phase === 'onboarding-teach') {
        const isConceptual = text.toLowerCase().includes('ones into') || text.toLowerCase().includes('ten and')
        const newCount = isConceptual ? 2 : onboardingCount + 1
        setOnboardingCount(newCount)
        await streamDotResponse(nextMessages, knowledge, 'onboarding-teach', null)

        if (newCount >= 2) {
          await new Promise((r) => setTimeout(r, 500))
          setPhase('onboarding-correct')
          setDotAnimState('celebrating')

          const wrongOnes = INITIAL_HOMEWORK.filter((l) => !l.isCorrect)
          wrongOnes.forEach((line, i) => {
            setTimeout(() => {
              setHomeworkLines((prev) =>
                prev.map((l) => l.id === line.id ? { ...l, state: 'corrected' } : l)
              )
            }, i * 600)
          })

          setTimeout(() => {
            setPhase('onboarding-done')
            setDotAnimState('idle')
          }, wrongOnes.length * 600 + 400)
        }

      } else if (phase === 'core-teach') {
        const newPerCount = perProblemExchangeCount + 1
        setPerProblemExchangeCount(newPerCount)

        let updatedKnowledge = knowledge
        try {
          const evaluation = await evaluateExplanation(text, knowledge, currentProblem!)
          updatedKnowledge = evaluation.updatedKnowledge
          setKnowledge(updatedKnowledge)
        } catch (err) {
          console.error('Evaluation error:', err)
        }

        await streamDotResponse(nextMessages, updatedKnowledge, 'core-teach', currentProblem)
      }
    },
    [
      phase, messages, knowledge, currentProblem,
      onboardingCount, perProblemExchangeCount,
      streamDotResponse, evaluateExplanation,
    ],
  )

  // ── proceedToNext ──────────────────────────────────────────────────────────

  const proceedToNext = useCallback(() => {
    if (phase === 'onboarding-done') {
      setPhase('core-intro')
      const problem = ALGEBRA_PROBLEMS[0]
      setTimeout(() => addDotMessage(ALGEBRA_INTRO(problem, FIRST_ATTEMPTS[problem.id])), 300)
    }
  }, [phase, addDotMessage])

  // ── helpDot ────────────────────────────────────────────────────────────────

  const helpDot = useCallback(() => {
    const nextIndex = currentProblemIndex + 1
    if (nextIndex >= ALGEBRA_PROBLEMS.length) return
    advanceWorkspaceToProblem(nextIndex)
  }, [currentProblemIndex, advanceWorkspaceToProblem])

  // ── skipOnboarding (dev only) ──────────────────────────────────────────────

  const skipOnboarding = useCallback(() => {
    setHomeworkLines(INITIAL_HOMEWORK.map((l) => ({ ...l, state: 'corrected' as const })))
    setChatVisible(true)
    setMessages([])
    setPhase('core-intro')
    const problem = ALGEBRA_PROBLEMS[0]
    setTimeout(() => addDotMessage(ALGEBRA_INTRO(problem, FIRST_ATTEMPTS[problem.id])), 300)
  }, [addDotMessage])

  return (
    <DotContext.Provider
      value={{
        phase,
        messages,
        knowledge,
        currentProblem,
        dotAnimState,
        isStreaming,
        streamBuffer,
        dotIsTyping,
        chatVisible,
        homeworkLines,
        problemBlocks,
        openNotebook,
        sendMessage,
        resolveVerdict,
        proceedToNext,
        helpDot,
        skipOnboarding,
      }}
    >
      {children}
    </DotContext.Provider>
  )
}

export function useDotStore() {
  const ctx = useContext(DotContext)
  if (!ctx) throw new Error('useDotStore must be used within DotProvider')
  return ctx
}
