'use client'

import { useEffect, useRef, useState } from 'react'
import { useDotStore } from '@/lib/dot-store'
import { DotAvatar } from '@/components/dot/DotAvatar'
import { cn } from '@/lib/utils'
import type { SessionPhase } from '@/lib/types'

// ── Layout helper ─────────────────────────────────────────────────────────────

function getLeftContent(phase: SessionPhase): 'classroom' | 'workbook' | 'quiz' {
  if (['landing', 'core-intro', 'quiz-intro', 'core-quiz-prompt', 'home'].includes(phase))
    return 'classroom'
  if (phase === 'quiz-writing' || phase === 'quiz-graded') return 'quiz'
  return 'workbook'
}

// ── Classroom scene ────────────────────────────────────────────────────────────

function Chalkboard() {
  const { phase, beginQuiz, redoQuiz } = useDotStore()

  const text: Partial<Record<SessionPhase, string>> = {
    landing: 'Math Class',
    'core-intro': 'Solving Equations',
    'core-quiz-prompt': 'Solving Equations',
    'quiz-intro': "Begin Dot's Quiz",
    'quiz-graded': "Quiz Done!",
    home: 'Redo Quiz',
  }

  const clickable = phase === 'quiz-intro' || phase === 'home'
  const handleClick = phase === 'quiz-intro' ? beginQuiz : phase === 'home' ? redoQuiz : undefined

  return (
    <div
      onClick={handleClick}
      className={cn(
        'mx-auto w-4/5 rounded-sm bg-[#2d5a27] px-6 py-4 text-center shadow-inner',
        clickable &&
          'cursor-pointer ring-2 ring-yellow-400 ring-offset-2 hover:bg-[#3a7a33] transition-colors',
      )}
    >
      <p className="font-mono text-[10px] text-[#c8e6c9]/50 mb-1 uppercase tracking-wider">
        today
      </p>
      <p className="font-mono text-lg font-bold text-white">
        {text[phase] ?? 'Math Class'}
      </p>
      {clickable && (
        <p className="mt-1 text-xs text-yellow-300 animate-pulse">click to begin →</p>
      )}
    </div>
  )
}

function NotebookObject({
  label,
  clickable,
  onClick,
  dimmed,
  pulse,
}: {
  label: string
  clickable?: boolean
  onClick?: () => void
  dimmed?: boolean
  pulse?: boolean
}) {
  return (
    <div
      onClick={clickable ? onClick : undefined}
      className={cn(
        'flex flex-col items-center gap-1.5 select-none transition-all',
        clickable ? 'cursor-pointer hover:scale-105' : 'cursor-default',
        dimmed && 'opacity-40',
      )}
    >
      <div
        className={cn(
          'relative w-14 h-16 rounded-sm border-2 bg-[#fffef5] shadow-sm transition-all',
          clickable
            ? 'border-yellow-400 shadow-lg ring-2 ring-yellow-300/40'
            : 'border-[#8b6914]/30',
        )}
      >
        {/* Spiral binding */}
        <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#c8a96e]/20 border-r border-[#8b6914]/15 flex flex-col justify-around py-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#8b6914]/40 mx-auto" />
          ))}
        </div>
        {/* Ruled lines */}
        <div className="ml-3 mt-2 mr-1 space-y-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-px bg-[#b8d4e8]/60" />
          ))}
        </div>
        {pulse && (
          <div className="absolute inset-0 rounded-sm bg-yellow-300/20 animate-pulse" />
        )}
      </div>
      <p className="text-[10px] font-medium text-[#5a4a2e]">{label}</p>
    </div>
  )
}

function ClassroomScene() {
  const { phase, openNotebook, helpDot, dotAnimState } = useDotStore()

  const dotPosition: Partial<Record<SessionPhase, string>> = {
    landing: 'bottom-16 left-1/2 -translate-x-1/2',
    'core-intro': 'bottom-16 left-[28%]',
    'quiz-intro': 'top-[40%] left-1/2 -translate-x-1/2',
    'core-quiz-prompt': 'bottom-16 left-1/2 -translate-x-1/2',
    home: 'bottom-16 left-1/2 -translate-x-1/2',
  }

  const leftDesk = (() => {
    if (phase === 'landing')
      return { label: 'Homework', clickable: true, onClick: openNotebook, pulse: true }
    return { label: 'Homework ✓', clickable: false, dimmed: true }
  })()

  const rightDesk = (() => {
    if (phase === 'core-intro')
      return { label: 'New Work!', clickable: true, onClick: openNotebook, pulse: true }
    if (phase === 'home')
      return { label: 'Help Dot', clickable: true, onClick: helpDot, pulse: false }
    return null
  })()

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      {/* Wall */}
      <div className="h-[44%] bg-[#d4b896] flex flex-col items-center justify-center pt-4 pb-6">
        <Chalkboard />
      </div>

      {/* Floor divider */}
      <div className="h-0.5 bg-[#8b6914]/25" />

      {/* Floor */}
      <div
        className="flex-1 bg-[#c8a96e]/20 relative"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, transparent, transparent 47px, rgba(139,105,20,0.07) 47px, rgba(139,105,20,0.07) 48px)',
        }}
      >
        {/* Desks row */}
        <div className="absolute bottom-20 left-0 right-0 flex justify-around items-end px-10">
          {/* Left desk */}
          <div className="flex flex-col items-center gap-2">
            <NotebookObject {...leftDesk} />
            <div className="w-28 h-9 rounded-sm bg-[#7a4e2a] shadow-md border-b-4 border-[#5a3a1a]" />
          </div>

          {/* Right desk */}
          <div className="flex flex-col items-center gap-2">
            {rightDesk ? (
              <NotebookObject {...rightDesk} />
            ) : (
              <div className="h-[74px]" />
            )}
            <div className="w-28 h-9 rounded-sm bg-[#7a4e2a] shadow-md border-b-4 border-[#5a3a1a]" />
          </div>
        </div>

        {/* Dot avatar */}
        <div
          className={cn(
            'absolute transition-all duration-700',
            dotPosition[phase] ?? 'bottom-16 left-1/2 -translate-x-1/2',
          )}
        >
          <DotAvatar state={dotAnimState} size="md" />
        </div>
      </div>
    </div>
  )
}

// ── Homework page (onboarding left page) ──────────────────────────────────────

function HomeworkPage() {
  const { homeworkLines, phase } = useDotStore()
  const hasStar = phase === 'onboarding-done' || phase === 'core-intro'

  return (
    <div className="flex flex-col h-full p-5 font-mono overflow-y-auto">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[10px] text-[#8b6914]/50 mb-0.5">name: Dot 🐢</p>
          <p className="text-sm font-bold text-[#3a2a0a]">Addition Homework</p>
        </div>
        {hasStar && <span className="text-3xl">⭐</span>}
      </div>

      <div className="space-y-2.5">
        {homeworkLines.map((line) => (
          <div
            key={line.id}
            className={cn(
              'flex items-center gap-3 pb-2 border-b border-[#b8d4e8]/40 transition-all duration-500',
              line.state === 'hidden' ? 'opacity-0 h-0 overflow-hidden pb-0 border-0' : 'opacity-100',
            )}
          >
            <span className="text-sm text-[#3a2a0a] w-24 shrink-0">{line.problem} =</span>

            {line.state !== 'hidden' && (
              <span
                className={cn(
                  'text-sm font-semibold',
                  line.state === 'marked' && 'text-red-600',
                  line.state === 'corrected' && 'line-through text-red-400',
                  line.state === 'written' && line.isCorrect && 'text-[#2d5a27]',
                  line.state === 'written' && !line.isCorrect && 'text-[#3a2a0a]',
                )}
              >
                {line.dotAnswer}
              </span>
            )}

            {line.state === 'marked' && (
              <span className="text-red-500 text-base leading-none">●</span>
            )}

            {line.state === 'corrected' && (
              <span className="text-[#2d5a27] font-bold text-sm">→ {line.correctAnswer}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Algebra workbook page ─────────────────────────────────────────────────────

function AlgebraPage() {
  const { algebraLines, currentProblem, phase } = useDotStore()
  const idx = currentProblem
    ? ['p1', 'p2', 'p3', 'p4', 'p5'].indexOf(currentProblem.id)
    : 0

  return (
    <div className="flex flex-col h-full p-5 font-mono overflow-y-auto">
      <div className="mb-4">
        <p className="text-[10px] text-[#8b6914]/50 mb-0.5">name: Dot 🐢</p>
        <p className="text-sm font-bold text-[#3a2a0a]">
          Solving Equations — Problem {idx + 1}
        </p>
      </div>

      <div className="space-y-2">
        {algebraLines.map((line) => (
          <div
            key={line.id}
            className={cn(
              'pb-2 border-b border-[#b8d4e8]/35 transition-all duration-300',
              line.style === 'equation' &&
                'text-lg font-bold text-[#3a2a0a] border-[#b8d4e8]/70',
              line.style === 'wrong-attempt' && 'text-base text-red-500',
              line.style === 'step' && 'text-sm text-[#3a6a4a] pl-3',
              line.style === 'result' && 'text-base font-bold text-[#2d5a27]',
            )}
          >
            {line.style === 'wrong-attempt' && <span className="text-red-400 mr-2">✗</span>}
            {line.style === 'step' && <span className="text-[#4a9e6b] mr-2">→</span>}
            {line.style === 'result' && <span className="text-[#2d5a27] mr-2">✓</span>}
            {line.text}
          </div>
        ))}

        {phase === 'core-writing' && algebraLines.length <= 1 && (
          <div className="flex gap-1 pt-3">
            {[0, 150, 300].map((d) => (
              <div
                key={d}
                className="size-2 rounded-full bg-[#8b6914]/35 animate-bounce"
                style={{ animationDelay: `${d}ms` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Quiz sheet ─────────────────────────────────────────────────────────────────

function QuizSheet() {
  const { quizItems } = useDotStore()

  return (
    <div className="flex flex-col h-full p-4 font-mono overflow-y-auto">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#8b6914]/20">
        <p className="text-sm font-bold text-[#3a2a0a]">Solving Equations — Quiz</p>
        <p className="text-xs text-[#8b6914]/60">
          name: <span className="underline font-medium">Dot</span>
        </p>
      </div>

      <div className="grid grid-cols-2 border-l border-t border-[#8b6914]/15 flex-1">
        {quizItems.map((item, i) => (
          <div
            key={item.id}
            className="p-3 border-r border-b border-[#8b6914]/15 min-h-[70px]"
          >
            <p className="text-[10px] text-[#8b6914]/55 mb-1.5">
              {i + 1}. {item.equation}
            </p>

            {item.state !== 'hidden' && (
              <div className="flex items-center gap-1.5 mt-1">
                {item.state === 'writing' ? (
                  <div className="flex gap-0.5">
                    {[0, 1, 2].map((j) => (
                      <div
                        key={j}
                        className="size-1.5 rounded-full bg-[#4a9e6b] animate-bounce"
                        style={{ animationDelay: `${j * 100}ms` }}
                      />
                    ))}
                  </div>
                ) : (
                  <>
                    <span
                      className={cn(
                        'text-sm font-semibold',
                        item.state === 'marked' ? 'text-red-500' : 'text-[#2d5a27]',
                      )}
                    >
                      {item.dotAnswer}
                    </span>
                    {item.state === 'marked' && (
                      <span className="text-red-500 text-sm leading-none">●</span>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Workbook wrapper (spiral binding + ruled page) ────────────────────────────

function BookPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full bg-[#f5e6c8]">
      {/* Spiral binding */}
      <div className="w-7 shrink-0 bg-[#c8a96e]/25 border-r border-[#8b6914]/20 flex flex-col justify-evenly py-3">
        {Array.from({ length: 16 }).map((_, i) => (
          <div
            key={i}
            className="w-4 h-3 rounded-full border-[1.5px] border-[#8b6914]/45 bg-[#e8d5a3] mx-auto"
          />
        ))}
      </div>

      {/* Ruled page */}
      <div
        className="flex-1 bg-[#fffef5] overflow-y-auto"
        style={{
          backgroundImage:
            'repeating-linear-gradient(transparent, transparent 27px, #b8d4e8 27px, #b8d4e8 28px)',
          backgroundSize: '100% 28px',
        }}
      >
        {children}
      </div>
    </div>
  )
}

function LeftPanel() {
  const { phase } = useDotStore()
  const content = getLeftContent(phase)

  if (content === 'classroom') return <ClassroomScene />
  if (content === 'quiz')
    return (
      <BookPage>
        <QuizSheet />
      </BookPage>
    )
  return (
    <BookPage>
      {phase.startsWith('onboarding') ? <HomeworkPage /> : <AlgebraPage />}
    </BookPage>
  )
}

// ── Phone panel (right side) ───────────────────────────────────────────────────

function MessageBubble({
  sender,
  text,
  isLatestDot = false,
}: {
  sender: 'dot' | 'student'
  text: string
  isLatestDot?: boolean
}) {
  const { dotAnimState } = useDotStore()
  const isDot = sender === 'dot'
  return (
    <div className={cn('flex gap-2 px-3', isDot ? 'justify-start' : 'justify-end')}>
      {isDot && (
        <DotAvatar
          state={isLatestDot ? dotAnimState : 'idle'}
          size="sm"
          className="mt-1 shrink-0"
        />
      )}
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed',
          isDot
            ? 'rounded-tl-sm bg-white text-[#2a1a0a] shadow-sm border border-[#e8d5a3]'
            : 'rounded-tr-sm bg-[#e8d5a3] text-[#2a1a0a]',
        )}
      >
        {text}
      </div>
    </div>
  )
}

function StreamingBubble({ text }: { text: string }) {
  return (
    <div className="flex gap-2 px-3 justify-start">
      <DotAvatar state="thinking" size="sm" className="mt-1 shrink-0" />
      <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 text-sm leading-relaxed shadow-sm border border-[#e8d5a3]">
        {text || (
          <span className="flex gap-1 items-center h-5">
            {[0, 150, 300].map((d) => (
              <span
                key={d}
                className="size-1.5 rounded-full bg-[#8b6914]/45 animate-bounce"
                style={{ animationDelay: `${d}ms` }}
              />
            ))}
          </span>
        )}
      </div>
    </div>
  )
}

function ChatFeed() {
  const { messages, isStreaming, streamBuffer } = useDotStore()
  const bottomRef = useRef<HTMLDivElement>(null)
  const lastDotIdx = messages.reduce((acc, m, i) => (m.sender === 'dot' ? i : acc), -1)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamBuffer])

  return (
    <div className="scroll-area flex-1 overflow-y-auto py-3 space-y-2.5 min-h-0">
      {messages.map((msg, i) => (
        <MessageBubble
          key={msg.id}
          sender={msg.sender}
          text={msg.text}
          isLatestDot={msg.sender === 'dot' && i === lastDotIdx}
        />
      ))}
      {isStreaming && <StreamingBubble text={streamBuffer} />}
      <div ref={bottomRef} />
    </div>
  )
}

function InputBar() {
  const { phase, isStreaming, canTriggerQuiz, sendMessage, triggerQuiz, proceedToNext } =
    useDotStore()
  const [text, setText] = useState('')

  const blockedPhases: SessionPhase[] = [
    'landing',
    'onboarding-writing',
    'onboarding-graded',
    'onboarding-correct',
    'core-writing',
    'quiz-writing',
    'quiz-intro',
    'core-quiz-prompt',
  ]
  const isBlocked = blockedPhases.includes(phase)
  const isNext = phase === 'onboarding-done' || phase === 'quiz-graded'
  const canSend = text.trim().length > 0 && !isStreaming && !isBlocked && !isNext

  function handleSend() {
    if (!canSend) return
    sendMessage(text.trim())
    setText('')
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (isNext) {
    return (
      <div className="px-3 pb-4 pt-2 shrink-0 flex justify-center">
        <button
          onClick={proceedToNext}
          className="rounded-full bg-[#4a9e6b] px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-[#3a8a5a] transition active:scale-95"
        >
          {phase === 'onboarding-done' ? 'Start Algebra →' : 'Continue →'}
        </button>
      </div>
    )
  }

  if (isBlocked) {
    return (
      <div className="px-3 pb-4 pt-2 shrink-0 flex items-center justify-center gap-1.5 h-12">
        {[0, 150, 300].map((d) => (
          <div
            key={d}
            className="size-1.5 rounded-full bg-[#8b6914]/35 animate-bounce"
            style={{ animationDelay: `${d}ms` }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="px-3 pb-4 pt-2 space-y-2 shrink-0">
      {canTriggerQuiz && phase === 'core-teach' && (
        <div className="flex justify-center">
          <button
            onClick={triggerQuiz}
            disabled={isStreaming}
            className="rounded-full border border-[#4a9e6b] px-4 py-1.5 text-xs font-semibold text-[#4a9e6b] hover:bg-[#f0faf4] transition disabled:opacity-40"
          >
            Next: Dot's Quiz →
          </button>
        </div>
      )}
      <div className="flex gap-2 items-end rounded-2xl border border-[#c8a96e]/45 bg-white px-3 py-2.5 shadow-sm">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder={
            phase.startsWith('onboarding')
              ? 'Help Dot with the homework…'
              : phase === 'home'
                ? 'Chat with Dot…'
                : 'Teach Dot…'
          }
          rows={1}
          disabled={isStreaming}
          className="flex-1 resize-none bg-transparent text-sm text-[#2a1a0a] placeholder:text-[#8b6914]/45 outline-none disabled:opacity-50"
          style={{ maxHeight: '100px' }}
          onInput={(e) => {
            const el = e.currentTarget
            el.style.height = 'auto'
            el.style.height = el.scrollHeight + 'px'
          }}
        />
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="shrink-0 rounded-full bg-[#c8702a] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#a85a20] transition disabled:opacity-30"
        >
          Send
        </button>
      </div>
    </div>
  )
}

function PhonePanel() {
  const { chatVisible, phase, dotAnimState } = useDotStore()

  const subtitle: Partial<Record<SessionPhase, string>> = {
    'onboarding-writing': 'looking at her work…',
    'onboarding-graded': 'uh oh…',
    'onboarding-teach': 'listening carefully',
    'onboarding-correct': 'fixing mistakes! 🎉',
    'onboarding-done': 'got it!!',
    'core-intro': 'ready to learn',
    'core-writing': 'looking at the problem…',
    'core-teach': 'learning from you',
    'core-quiz-prompt': 'ready for the quiz!',
    'quiz-intro': 'quiz time 🐢',
    'quiz-writing': 'working…',
    'quiz-graded': 'done!!',
    home: 'thanks for teaching me!',
  }

  return (
    <div className="flex flex-col bg-[#faf5ec] overflow-hidden" style={{ flex: '42 42 0%' }}>
      {/* Header */}
      <div className="shrink-0 bg-[#f0e8d4] border-b border-[#c8a96e]/30 px-4 py-3 flex items-center gap-2.5">
        <DotAvatar state={dotAnimState} size="sm" />
        <div>
          <p className="text-sm font-semibold text-[#2a1a0a]">Dot</p>
          <p className="text-[11px] text-[#8b6914]/65">{subtitle[phase] ?? 'hi!'}</p>
        </div>
      </div>

      {chatVisible ? (
        <>
          <ChatFeed />
          <InputBar />
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <DotAvatar state="idle" size="lg" />
          <p className="text-sm text-[#8b6914]/60 italic">
            Click the homework notebook to begin
          </p>
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TeachingPage() {
  const { phase } = useDotStore()
  const isBookOpen = getLeftContent(phase) !== 'classroom'

  return (
    <div
      className={cn(
        'flex h-screen overflow-hidden transition-colors duration-500',
        isBookOpen ? 'bg-[#b89a60]' : 'bg-[#e8d5a3]',
      )}
    >
      {isBookOpen ? (
        // Book frame when workbook/quiz is open
        <div className="flex flex-1 m-3 rounded-lg overflow-hidden shadow-2xl border border-[#8b6914]/25">
          <div style={{ flex: '58 58 0%' }}>
            <LeftPanel />
          </div>
          <div className="w-px bg-[#c8a96e]/40" />
          <PhonePanel />
        </div>
      ) : (
        // Classroom view
        <>
          <div style={{ flex: '58 58 0%' }}>
            <LeftPanel />
          </div>
          <div className="w-px bg-[#8b6914]/20" />
          <PhonePanel />
        </>
      )}
    </div>
  )
}
