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
  WorkLine,
  QuizItem,
} from './types'
import { ALGEBRA_PROBLEMS, INITIAL_KNOWLEDGE, INITIAL_HOMEWORK, INITIAL_QUIZ } from './problems'

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

// Concise wrong attempt for left page display
const PAGE_ATTEMPTS: Record<string, string> = {
  p1: 'x = 17  ← moved the 5, then added',
  p2: 'x = 18  ← moved the 3, then added',
  p3: 'x = 5   ← divided both sides by 3',
  p4: 'x = 9.5 ← divided 19 by 2 first',
  p5: 'x = 9   ← divided 18 by 2 first',
}

const QUIZ_READY_MESSAGE =
  "ok!! I think I'm ready to show you what I've learned! can I do a little quiz? like actually try some problems on my own??"

const QUIZ_DONE_MESSAGES = {
  good: "I got most of them!! the ones with fractions are still a bit wobbly 🐢 but I can see how much the balance thing helped! which ones did I get wrong?",
  mixed: "some of these were tricky!! I got confused on the two-step ones again... I think I need more practice with those. did I at least get the easy ones right?",
}

const COMPLETE_MESSAGE =
  "we did it!! all five!! I actually understand equations now — not just the steps, the WHY behind each one. I already have ideas for my drawing program... maybe I can use this to make perfect spirals!! thank you for teaching me 🐢✨"

// ── Helpers ───────────────────────────────────────────────────────────────────

let msgCounter = 0
function genId() { return `msg-${Date.now()}-${msgCounter++}` }
function lineId() { return `line-${Date.now()}-${msgCounter++}` }

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
  dotIsTyping: boolean   // true between segmented messages
  chatVisible: boolean
  canTriggerQuiz: boolean
  homeworkLines: HomeworkLine[]
  algebraLines: WorkLine[]
  quizItems: QuizItem[]
  openNotebook: () => void
  sendMessage: (text: string) => Promise<void>
  triggerQuiz: () => void
  beginQuiz: () => void
  proceedToNext: () => void
  helpDot: () => void
  redoQuiz: () => void
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
  const [canTriggerQuiz, setCanTriggerQuiz] = useState(false)
  const [onboardingCount, setOnboardingCount] = useState(0)
  const [coreExchangeCount, setCoreExchangeCount] = useState(0)
  const [perProblemExchangeCount, setPerProblemExchangeCount] = useState(0)
  const [homeworkLines, setHomeworkLines] = useState<HomeworkLine[]>(INITIAL_HOMEWORK)
  const [algebraLines, setAlgebraLines] = useState<WorkLine[]>([])
  const [quizItems, setQuizItems] = useState<QuizItem[]>(INITIAL_QUIZ)

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
            // Keep raw buffer (with |||) — ChatFeed clips to the first segment
            setStreamBuffer(bufferRef.current)
          }
        } finally { reader.releaseLock() }
        fullText = bufferRef.current
      } finally {
        setStreamBuffer('')
        setIsStreaming(false)
      }

      // Split on ||| and deliver segments with typing delays
      const segments = fullText.split('|||').map((s) => s.trim()).filter(Boolean)
      if (segments.length === 0) {
        setDotAnimState('idle')
        return fullText
      }

      // Helper: extract [WORK:...] from a segment, update algebraLines, return clean text
      const deliverSegment = (seg: string) => {
        const workMatch = seg.match(/\[WORK:([^\]]+)\]/)
        const cleanText = seg.replace(/\[WORK:[^\]]*\]/, '').trim()
        if (workMatch) {
          const parts = workMatch[1].split('|').map((p) => p.trim()).filter(Boolean)
          if (parts.length >= 2) {
            setAlgebraLines((prev) => {
              const existingTexts = new Set(prev.map((l) => l.text))
              const newLines: WorkLine[] = []
              parts.forEach((part, idx) => {
                if (existingTexts.has(part)) return // skip any line already on the page
                const style: WorkLine['style'] =
                  idx === 0 ? 'equation' : idx === parts.length - 1 ? 'result' : 'step'
                newLines.push({ id: lineId(), text: part, style })
              })
              return [...prev, ...newLines]
            })
          }
        }
        addDotMessage(cleanText)
      }

      deliverSegment(segments[0])

      for (let i = 1; i < segments.length; i++) {
        const seg = segments[i]
        // Delay proportional to visible text length (strip WORK token for timing)
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
  // Updates the workspace to show the next problem + Dot's (wrong) attempt,
  // stays in core-teach phase. Used by both auto-advance and the helpDot button.

  const advanceWorkspaceToProblem = useCallback(async (nextIndex: number) => {
    const nextProblem = ALGEBRA_PROBLEMS[nextIndex]
    if (!nextProblem) return

    setCurrentProblemIndex(nextIndex)
    setPerProblemExchangeCount(0)
    setCanTriggerQuiz(false)

    // Divider separates old work from the new problem — old lines scroll up, never erased
    await new Promise((r) => setTimeout(r, 900))
    setAlgebraLines((prev) => [
      ...prev,
      { id: lineId(), text: '', style: 'divider' },
      { id: lineId(), text: nextProblem.equation, style: 'equation' },
    ])

    // Then Dot's wrong attempt
    await new Promise((r) => setTimeout(r, 800))
    setAlgebraLines((prev) => [
      ...prev,
      { id: lineId(), text: PAGE_ATTEMPTS[nextProblem.id], style: 'wrong-attempt' },
    ])

    // Dot's scripted chat message pointing to the notebook
    await new Promise((r) => setTimeout(r, 500))
    addDotMessage(
      `ooh wait!! I want to try using that on a new problem to see if I really get it — I wrote my attempt in the notebook! can you check if I did it right?`,
    )
  }, [addDotMessage])

  // ── openNotebook ───────────────────────────────────────────────────────────

  const openHomeworkNotebook = useCallback(() => {
    setChatVisible(true)
    setPhase('onboarding-writing')

    // Write answers line by line — fast (3s total)
    INITIAL_HOMEWORK.forEach((_, i) => {
      setTimeout(() => {
        setHomeworkLines((prev) =>
          prev.map((l, idx) => idx === i ? { ...l, state: 'written' } : l)
        )
      }, (i + 1) * 300)
    })

    const totalWriteMs = INITIAL_HOMEWORK.length * 300 + 400
    setTimeout(() => {
      // Mark wrong ones with red dots
      setPhase('onboarding-graded')
      setHomeworkLines((prev) =>
        prev.map((l) => ({ ...l, state: l.isCorrect ? 'written' : 'marked' }))
      )
      // Then fire Dot's opening message
      setTimeout(() => {
        addDotMessage(OPENING_MESSAGE)
        setPhase('onboarding-teach')
      }, 700)
    }, totalWriteMs)
  }, [addDotMessage])

  const openAlgebraNotebook = useCallback(() => {
    const problem = ALGEBRA_PROBLEMS[currentProblemIndex]
    setPhase('core-writing')
    setAlgebraLines([{ id: lineId(), text: problem.equation, style: 'equation' }])

    setTimeout(() => {
      setAlgebraLines((prev) => [
        ...prev,
        { id: lineId(), text: PAGE_ATTEMPTS[problem.id], style: 'wrong-attempt' },
      ])
      setTimeout(() => setPhase('core-teach'), 600)
    }, 1000)
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
        // Conceptual explanation counts as the full 2-exchange threshold on its own
        const isConceptual = text.toLowerCase().includes('ones into') || text.toLowerCase().includes('ten and')
        const newCount = isConceptual ? 2 : onboardingCount + 1
        setOnboardingCount(newCount)
        await streamDotResponse(nextMessages, knowledge, 'onboarding-teach', null)

        if (newCount >= 2) {
          await new Promise((r) => setTimeout(r, 500))
          setPhase('onboarding-correct')
          setDotAnimState('celebrating')

          // Animate corrections
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
        // Global exchange counter — gates the quiz CTA
        const nextExchangeCount = coreExchangeCount + 1
        setCoreExchangeCount(nextExchangeCount)
        if (currentProblemIndex >= 1 && nextExchangeCount >= 4) {
          setCanTriggerQuiz(true)
        }

        // Per-problem count — triggers Dot trying the next problem
        const newPerCount = perProblemExchangeCount + 1

        let updatedKnowledge = knowledge
        let evalQuality = 'vague'
        try {
          const evaluation = await evaluateExplanation(text, knowledge, currentProblem!)
          updatedKnowledge = evaluation.updatedKnowledge
          evalQuality = evaluation.quality
          setKnowledge(updatedKnowledge)
        } catch (err) {
          console.error('Evaluation error:', err)
        }

        await streamDotResponse(nextMessages, updatedKnowledge, 'core-teach', currentProblem)

        // After Dot responds: if enough teaching has happened on this problem,
        // have her try the next one in the workspace.
        // Fast path: 1 conceptual exchange is enough — Dot got the concept.
        // Normal path: 2+ non-vague exchanges.
        // Fallback: 3+ exchanges regardless, so terse students never get stuck.
        const nextIdx = currentProblemIndex + 1
        const shouldAdvance =
          nextIdx < ALGEBRA_PROBLEMS.length &&
          (evalQuality === 'conceptual' ||
            (newPerCount >= 2 && evalQuality !== 'vague') ||
            newPerCount >= 3)

        if (shouldAdvance) {
          await advanceWorkspaceToProblem(nextIdx)
        } else {
          setPerProblemExchangeCount(newPerCount)
        }
      }
    },
    [
      phase, messages, knowledge, currentProblem, currentProblemIndex,
      onboardingCount, coreExchangeCount, perProblemExchangeCount,
      streamDotResponse, evaluateExplanation, advanceWorkspaceToProblem,
    ],
  )

  // ── triggerQuiz ────────────────────────────────────────────────────────────

  const triggerQuiz = useCallback(() => {
    setCanTriggerQuiz(false)
    addDotMessage(QUIZ_READY_MESSAGE)
    setTimeout(() => setPhase('quiz-intro'), 800)
  }, [addDotMessage])

  // ── beginQuiz ─────────────────────────────────────────────────────────────

  const beginQuiz = useCallback(() => {
    if (phase !== 'quiz-intro') return
    setPhase('quiz-writing')
    setQuizItems(INITIAL_QUIZ.map((q) => ({ ...q, state: 'hidden' })))

    const totalItems = INITIAL_QUIZ.length
    const itemInterval = Math.floor(28000 / totalItems) // ~28s total

    INITIAL_QUIZ.forEach((_, i) => {
      setTimeout(() => {
        setQuizItems((prev) =>
          prev.map((q, idx) => idx === i ? { ...q, state: 'writing' } : q)
        )
        setTimeout(() => {
          setQuizItems((prev) =>
            prev.map((q, idx) => idx === i ? { ...q, state: 'done' } : q)
          )
        }, itemInterval * 0.6)
      }, i * itemInterval)
    })

    setTimeout(() => {
      setPhase('quiz-graded')
      setDotAnimState('celebrating')
      setQuizItems((prev) => prev.map((q) => ({ ...q, state: q.isCorrect ? 'done' : 'marked' })))
      const wrongCount = INITIAL_QUIZ.filter((q) => !q.isCorrect).length
      setTimeout(() => {
        addDotMessage(wrongCount <= 3 ? QUIZ_DONE_MESSAGES.good : QUIZ_DONE_MESSAGES.mixed)
        setDotAnimState('idle')
      }, 700)
    }, totalItems * itemInterval + 400)
  }, [phase, addDotMessage])

  // ── proceedToNext ──────────────────────────────────────────────────────────

  const proceedToNext = useCallback(() => {
    if (phase === 'onboarding-done') {
      setPhase('core-intro')
      const problem = ALGEBRA_PROBLEMS[0]
      setTimeout(() => addDotMessage(ALGEBRA_INTRO(problem, FIRST_ATTEMPTS[problem.id])), 300)
    } else if (phase === 'quiz-graded') {
      const nextIndex = currentProblemIndex + 1
      if (nextIndex >= ALGEBRA_PROBLEMS.length) {
        addDotMessage(COMPLETE_MESSAGE)
      }
      setPhase('home')
    }
  }, [phase, currentProblemIndex, addDotMessage])

  // ── helpDot ────────────────────────────────────────────────────────────────

  const helpDot = useCallback(() => {
    const nextIndex = currentProblemIndex + 1
    if (nextIndex >= ALGEBRA_PROBLEMS.length) return
    advanceWorkspaceToProblem(nextIndex)
  }, [currentProblemIndex, advanceWorkspaceToProblem])

  // ── redoQuiz ───────────────────────────────────────────────────────────────

  const redoQuiz = useCallback(() => {
    setQuizItems(INITIAL_QUIZ.map((q) => ({ ...q, state: 'hidden' })))
    setPhase('quiz-intro')
  }, [])

  // ── skipOnboarding (dev only) ──────────────────────────────────────────────
  // Jump straight to core-intro, as if the student completed onboarding.

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
        canTriggerQuiz,
        homeworkLines,
        algebraLines,
        quizItems,
        openNotebook,
        sendMessage,
        triggerQuiz,
        beginQuiz,
        proceedToNext,
        helpDot,
        redoQuiz,
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
