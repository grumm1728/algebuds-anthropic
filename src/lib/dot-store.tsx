'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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
} from './types'
import { ALGEBRA_PROBLEMS, INITIAL_KNOWLEDGE } from './problems'

// ── Scripted content for key moments ──────────────────────────────────────────

const OPENING_MESSAGE =
  "oh hi!! I just finished my whole homework list SO fast!! but... my teacher circled some. I got 37 + 15 = 42, and 28 + 23 = 41, and 46 + 17 = 53. they're all marked wrong but I can't see why 😟 can you help me figure out what I keep messing up?"

const WATCHME_ONBOARDING =
  "oh!! OH!! the carry!! when the ones column adds up past 9 I have to carry a ten to the next column!! ok ok — 37+15: 7+5=12, write the 2, carry 1, then 3+1+1=5, so 52!! 28+23: 8+3=11, write 1 carry 1, 2+2+1=5, so 51! 46+17: 6+7=13, write 3 carry 1, 4+1+1=6, so 63!! YOU TAUGHT ME THAT!!! 🐢✨✨"

const ALGEBRA_INTRO = (problem: AlgebraProblem, wrongAnswer: string) =>
  `ok!! now my teacher gave us algebra — equations with x. I tried the first one: ${problem.equation}. I got ${wrongAnswer}... but it got marked wrong. can you teach me what to do?`

// Dot's wrong first attempts — rooted in the seeded misconceptions
const FIRST_ATTEMPTS: Record<string, string> = {
  p1: 'x = 17 (I moved the 5 to the other side and it became 12 + 5)',
  p2: 'x = 18 (I moved the 3 to the other side and added)',
  p3: 'x = 5 (I divided by 3 but I think fractions work different?)',
  p4: 'x = 9.5 (I divided 19 by 2 right away)',
  p5: 'x = 9 (I divided 18 by 2 right away)',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

let msgCounter = 0
function genId() {
  return `msg-${Date.now()}-${msgCounter++}`
}

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
  canTriggerWatchMe: boolean
  sendMessage: (text: string) => Promise<void>
  triggerWatchMe: () => Promise<void>
  proceedAfterWatchMe: () => void
}

const DotContext = createContext<DotStoreType | null>(null)

// ── Provider ──────────────────────────────────────────────────────────────────

export function DotProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<SessionPhase>('onboarding-attempt')
  const [messages, setMessages] = useState<TeachMessage[]>([])
  const [knowledge, setKnowledge] = useState<KnowledgeState>(INITIAL_KNOWLEDGE)
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0)
  const [dotAnimState, setDotAnimState] = useState<DotAnimState>('idle')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamBuffer, setStreamBuffer] = useState('')
  const [canTriggerWatchMe, setCanTriggerWatchMe] = useState(false)

  const bufferRef = useRef('')
  const currentProblem = ALGEBRA_PROBLEMS[currentProblemIndex] ?? null

  // Seed Dot's opening message on mount
  useEffect(() => {
    setMessages([{ id: genId(), sender: 'dot', text: OPENING_MESSAGE }])
  }, [])

  const addDotMessage = useCallback((text: string) => {
    setMessages((prev) => [...prev, { id: genId(), sender: 'dot', text }])
  }, [])

  // ── Core streaming function ────────────────────────────────────────────────

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
        } finally {
          reader.releaseLock()
        }

        const fullText = bufferRef.current
        addDotMessage(fullText)
        return fullText
      } finally {
        setStreamBuffer('')
        setIsStreaming(false)
        setDotAnimState('idle')
      }
    },
    [addDotMessage],
  )

  // ── Evaluate student explanation ───────────────────────────────────────────

  const evaluateExplanation = useCallback(
    async (
      studentText: string,
      currentKnowledge: KnowledgeState,
      problem: AlgebraProblem,
    ): Promise<EvaluationResult> => {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentExplanation: studentText,
          knowledge: currentKnowledge,
          problem,
        }),
      })
      if (!res.ok) throw new Error('Evaluation failed')
      return res.json()
    },
    [],
  )

  // ── sendMessage ────────────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (text: string) => {
      const studentMsg: TeachMessage = { id: genId(), sender: 'student', text }
      const nextMessages = [...messages, studentMsg]
      setMessages(nextMessages)

      if (phase === 'onboarding-attempt' || phase === 'onboarding-teach') {
        setPhase('onboarding-teach')
        await streamDotResponse(nextMessages, knowledge, 'onboarding-teach', null)

        // After Dot reacts, show the scripted watch-me moment
        await new Promise((r) => setTimeout(r, 600))
        setDotAnimState('celebrating')
        addDotMessage(WATCHME_ONBOARDING)

        // Transition to core loop
        await new Promise((r) => setTimeout(r, 2000))
        setDotAnimState('idle')
        setPhase('core-teach')
        const problem = ALGEBRA_PROBLEMS[0]
        addDotMessage(ALGEBRA_INTRO(problem, FIRST_ATTEMPTS[problem.id]))
      } else if (phase === 'core-teach') {
        setCanTriggerWatchMe(true)

        // Evaluate explanation, update knowledge, then stream Dot's response
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
      phase,
      messages,
      knowledge,
      currentProblem,
      streamDotResponse,
      evaluateExplanation,
      addDotMessage,
    ],
  )

  // ── triggerWatchMe ─────────────────────────────────────────────────────────

  const triggerWatchMe = useCallback(async () => {
    setPhase('core-watchme')
    setCanTriggerWatchMe(false)
    await streamDotResponse(messages, knowledge, 'core-watchme', currentProblem)
    setDotAnimState('celebrating')
  }, [messages, knowledge, currentProblem, streamDotResponse])

  // ── proceedAfterWatchMe ────────────────────────────────────────────────────

  const proceedAfterWatchMe = useCallback(() => {
    setDotAnimState('idle')
    const nextIndex = currentProblemIndex + 1

    if (nextIndex >= ALGEBRA_PROBLEMS.length) {
      setPhase('complete')
      addDotMessage(
        "we did it!! all five!! I actually understand equations now — not just the steps, the WHY. I already have ideas for my drawing program... maybe I can use this to make perfect spirals!! thank you for teaching me 🐢✨",
      )
    } else {
      setCurrentProblemIndex(nextIndex)
      setPhase('core-teach')
      const problem = ALGEBRA_PROBLEMS[nextIndex]
      addDotMessage(ALGEBRA_INTRO(problem, FIRST_ATTEMPTS[problem.id]))
    }
  }, [currentProblemIndex, addDotMessage])

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
        canTriggerWatchMe,
        sendMessage,
        triggerWatchMe,
        proceedAfterWatchMe,
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
