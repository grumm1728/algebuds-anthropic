'use client'

import {
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
import { ALGEBRA_PROBLEMS, INITIAL_KNOWLEDGE, INITIAL_HOMEWORK } from './problems'

// ── Scripted content ───────────────────────────────────────────────────────────

const OPENING_MESSAGE =
  "oh hi!! I just finished my whole homework list SO fast!! but... my teacher circled some. I got 37 + 15 = 42, and 28 + 23 = 41, and 46 + 17 = 53. they're all marked wrong but I can't see why 😟 can you help me figure out what I keep messing up?"

const ALGEBRA_INTRO = (problem: AlgebraProblem, wrongAnswer: string) =>
  `ok!! my teacher also gave us algebra — equations with x. I tried this one: ${problem.equation}. I got ${wrongAnswer}. marked wrong. what am I doing wrong?`

const FIRST_ATTEMPTS: Record<string, string> = {
  p1: 'x = 17 (moved the 5 over and added it)',
  p2: 'x = 18 (moved the 3 over and added)',
  p3: 'x = 5 (divided by 3)',
  p4: 'x = 9.5 (divided 19 by 2 first)',
  p5: 'x = 9 (divided 18 by 2 first)',
}

// Scripted first attempts — shown when the workbook opens and on each new problem.
// steps = intermediate work lines; answer = Dot's (wrong) conclusion.
const SCRIPTED_FIRST_ATTEMPTS: Record<string, { steps: string[]; answer: string }> = {
  p1: { steps: ['x + 5 = 12', 'x = 12 + 5'],           answer: 'x = 17'  },
  p2: { steps: ['3x = 15', 'x = 15 + 3'],               answer: 'x = 18'  },
  p3: { steps: ['(1/3)x = 15', 'x = 15 ÷ 3'],           answer: 'x = 5'   },
  p4: { steps: ['2x - 3 = 19', '2x = 19', 'x = 19 ÷ 2'], answer: 'x = 9.5' },
  p5: { steps: ['2x - 3 = 18', '2x = 18', 'x = 18 ÷ 2'], answer: 'x = 9'   },
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
          if (parts.length >= 2) {
            const steps = parts.slice(1, parts.length - 1)
            const answer = parts[parts.length - 1]
            const id = newAttemptId()

            setProblemBlocks((prev) => {
              if (prev.length === 0) return prev
              const last = prev[prev.length - 1]
              const newAttempt: WorkAttempt = { id, steps, answer, verdict: null }
              return [
                ...prev.slice(0, -1),
                { ...last, attempts: [...last.attempts, newAttempt] },
              ]
            })

            // Start the 5-second countdown a beat after the answer renders
            setTimeout(() => {
              setProblemBlocks((prev) => {
                if (prev.length === 0) return prev
                const last = prev[prev.length - 1]
                return [
                  ...prev.slice(0, -1),
                  {
                    ...last,
                    attempts: last.attempts.map((a) =>
                      a.id === id ? { ...a, verdict: 'timing' as AttemptVerdict } : a
                    ),
                  },
                ]
              })
            }, 600)
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

    await new Promise((r) => setTimeout(r, 900))

    const scripted = SCRIPTED_FIRST_ATTEMPTS[nextProblem.id]
    const firstAttempt: WorkAttempt = {
      id: newAttemptId(),
      steps: scripted.steps,
      answer: scripted.answer,
      verdict: 'timing',
    }

    setProblemBlocks((prev) => [
      ...prev,
      { id: nextProblem.id, equation: nextProblem.equation, attempts: [firstAttempt] },
    ])

    await new Promise((r) => setTimeout(r, 500))
    addDotMessage(
      `ooh wait!! I want to try using that on a new problem to see if I really get it — I wrote my attempt in the notebook! can you check if I did it right?`,
    )
  }, [addDotMessage])

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

    const scripted = SCRIPTED_FIRST_ATTEMPTS[problem.id]
    const firstAttempt: WorkAttempt = {
      id: newAttemptId(),
      steps: scripted.steps,
      answer: scripted.answer,
      verdict: 'timing',
    }

    setProblemBlocks([{
      id: problem.id,
      equation: problem.equation,
      attempts: [firstAttempt],
    }])

    setTimeout(() => setPhase('core-teach'), 1000)
  }, [currentProblemIndex])

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
