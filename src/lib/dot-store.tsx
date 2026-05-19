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

// ── Scripted content ───────────────────────────────────────────────────────────

const OPENING_MESSAGE =
  "oh hi!! I just finished my whole homework list SO fast!! but... my teacher circled some. I got 37 + 15 = 42, and 28 + 23 = 41, and 46 + 17 = 53. they're all marked wrong but I can't see why 😟 can you help me figure out what I keep messing up?"

// Fired after 2 onboarding exchanges — one problem only, attribution specific
function makeWatchMeOnboarding(lastStudentMessage: string) {
  const hint = lastStudentMessage.toLowerCase().includes('carry')
    ? 'the carry thing you explained'
    : lastStudentMessage.toLowerCase().includes('ten')
    ? 'the tens column thing you pointed out'
    : 'what you just showed me'
  return `wait— ok let me try ONE: 37 + 15. ones: 7+5=12, write the 2, carry the 1 to the tens!! tens: 3+1=4, plus that carry = 5. so 52!! 🐢 that's it — it was ${hint}!! I can redo all my others now too!`
}

const ALGEBRA_INTRO = (problem: AlgebraProblem, wrongAnswer: string) =>
  `ok!! my teacher also gave us algebra — equations with x. I tried this one: ${problem.equation}. I got ${wrongAnswer}. marked wrong. what am I doing wrong?`

const FIRST_ATTEMPTS: Record<string, string> = {
  p1: 'x = 17 (moved the 5 over and added it)',
  p2: 'x = 18 (moved the 3 over and added)',
  p3: 'x = 5 (divided by 3)',
  p4: 'x = 9.5 (divided 19 by 2 first)',
  p5: 'x = 9 (divided 18 by 2 first)',
}

const COMPLETE_MESSAGE =
  "we did it!! all five!! I actually understand equations now — not just the steps, the WHY behind each one. I already have ideas for my drawing program... maybe I can use this to make perfect spirals!! thank you for teaching me 🐢✨"

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

function parseWatchMeResponse(raw: string): { notebookContent: string; panelReaction: string } {
  const parts = raw.split('---PANEL:')
  if (parts.length >= 2) {
    return {
      notebookContent: parts[0].trim(),
      panelReaction: parts[1].trim(),
    }
  }
  return {
    notebookContent: raw,
    panelReaction: "I think I'm getting it — let me know what you thought!",
  }
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
  // Notebook
  notebookOpen: boolean
  notebookContent: string
  notebookBuffer: string
  // Actions
  sendMessage: (text: string) => Promise<void>
  triggerWatchMe: () => Promise<void>
  closeNotebook: () => void
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
  const [onboardingCount, setOnboardingCount] = useState(0)
  // Notebook
  const [notebookOpen, setNotebookOpen] = useState(false)
  const [notebookContent, setNotebookContent] = useState('')
  const [notebookBuffer, setNotebookBuffer] = useState('')
  const [pendingPanelReaction, setPendingPanelReaction] = useState<string | null>(null)

  const bufferRef = useRef('')
  const notebookBufferRef = useRef('')
  const currentProblem = ALGEBRA_PROBLEMS[currentProblemIndex] ?? null

  useEffect(() => {
    setMessages([{ id: genId(), sender: 'dot', text: OPENING_MESSAGE }])
  }, [])

  const addDotMessage = useCallback((text: string) => {
    setMessages((prev) => [...prev, { id: genId(), sender: 'dot', text }])
  }, [])

  // ── streamDotResponse ──────────────────────────────────────────────────────
  // target: 'chat' streams to chat buffer and commits as message
  // target: 'notebook' streams to notebook buffer and commits to notebookContent

  const streamDotResponse = useCallback(
    async (
      history: TeachMessage[],
      knowledgeState: KnowledgeState,
      currentPhase: SessionPhase,
      problem: AlgebraProblem | null,
      target: 'chat' | 'notebook' = 'chat',
    ): Promise<string> => {
      setIsStreaming(true)
      setDotAnimState('thinking')

      if (target === 'notebook') {
        notebookBufferRef.current = ''
        setNotebookBuffer('')
      } else {
        bufferRef.current = ''
        setStreamBuffer('')
      }

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
            if (target === 'notebook') {
              notebookBufferRef.current += value
              setNotebookBuffer(notebookBufferRef.current)
            } else {
              bufferRef.current += value
              setStreamBuffer(bufferRef.current)
            }
          }
        } finally {
          reader.releaseLock()
        }

        const fullText = target === 'notebook' ? notebookBufferRef.current : bufferRef.current

        if (target === 'chat') {
          addDotMessage(fullText)
        }
        return fullText
      } finally {
        if (target === 'notebook') {
          setNotebookBuffer('')
        } else {
          setStreamBuffer('')
        }
        setIsStreaming(false)
        setDotAnimState('idle')
      }
    },
    [addDotMessage],
  )

  // ── evaluateExplanation ────────────────────────────────────────────────────

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
        const newCount = onboardingCount + 1
        setOnboardingCount(newCount)
        setPhase('onboarding-teach')

        await streamDotResponse(nextMessages, knowledge, 'onboarding-teach', null, 'chat')

        // Gate: require 2 exchanges before watch-me
        if (newCount >= 2) {
          await new Promise((r) => setTimeout(r, 500))
          setDotAnimState('celebrating')
          addDotMessage(makeWatchMeOnboarding(text))

          await new Promise((r) => setTimeout(r, 2200))
          setDotAnimState('idle')
          setPhase('core-teach')
          const problem = ALGEBRA_PROBLEMS[0]
          addDotMessage(ALGEBRA_INTRO(problem, FIRST_ATTEMPTS[problem.id]))
        }
      } else if (phase === 'core-teach') {
        setCanTriggerWatchMe(true)

        let updatedKnowledge = knowledge
        try {
          const evaluation = await evaluateExplanation(text, knowledge, currentProblem!)
          updatedKnowledge = evaluation.updatedKnowledge
          setKnowledge(updatedKnowledge)
        } catch (err) {
          console.error('Evaluation error:', err)
        }

        await streamDotResponse(
          nextMessages,
          updatedKnowledge,
          'core-teach',
          currentProblem,
          'chat',
        )
      }
    },
    [
      phase,
      messages,
      knowledge,
      currentProblem,
      onboardingCount,
      streamDotResponse,
      evaluateExplanation,
      addDotMessage,
    ],
  )

  // ── triggerWatchMe ─────────────────────────────────────────────────────────

  const triggerWatchMe = useCallback(async () => {
    setPhase('core-watchme')
    setCanTriggerWatchMe(false)
    setNotebookOpen(true)
    setNotebookContent('')

    const raw = await streamDotResponse(
      messages,
      knowledge,
      'core-watchme',
      currentProblem,
      'notebook',
    )

    const { notebookContent: content, panelReaction } = parseWatchMeResponse(raw)
    setNotebookContent(content)
    setPendingPanelReaction(panelReaction)
    setDotAnimState('celebrating')
  }, [messages, knowledge, currentProblem, streamDotResponse])

  // ── closeNotebook ──────────────────────────────────────────────────────────

  const closeNotebook = useCallback(() => {
    setNotebookOpen(false)
    setDotAnimState('idle')
    if (pendingPanelReaction) {
      addDotMessage(pendingPanelReaction)
      setPendingPanelReaction(null)
    }
  }, [pendingPanelReaction, addDotMessage])

  // ── proceedAfterWatchMe ────────────────────────────────────────────────────

  const proceedAfterWatchMe = useCallback(() => {
    setNotebookOpen(false)
    setNotebookContent('')
    setDotAnimState('idle')
    const nextIndex = currentProblemIndex + 1

    if (nextIndex >= ALGEBRA_PROBLEMS.length) {
      setPhase('complete')
      addDotMessage(COMPLETE_MESSAGE)
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
        notebookOpen,
        notebookContent,
        notebookBuffer,
        sendMessage,
        triggerWatchMe,
        closeNotebook,
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
