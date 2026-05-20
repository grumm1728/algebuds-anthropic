'use client'

import { useEffect, useRef, useState } from 'react'
import { useDotStore } from '@/lib/dot-store'
import { DotAvatar } from '@/components/dot/DotAvatar'
import { cn } from '@/lib/utils'
import type { SessionPhase, AttemptVerdict } from '@/lib/types'

// ── Layout helper ─────────────────────────────────────────────────────────────

function getLeftContent(phase: SessionPhase): 'classroom' | 'workbook' {
  if (phase === 'landing' || phase === 'core-intro' || phase === 'home') return 'classroom'
  return 'workbook'
}

// ── Classroom scene ────────────────────────────────────────────────────────────

function Chalkboard() {
  const { phase } = useDotStore()

  const text: Partial<Record<SessionPhase, string>> = {
    landing: 'Math Class',
    'core-intro': 'Solving Equations',
    home: 'Great work!',
  }

  return (
    <div
      className="w-[58%] ml-[18%] rounded-t-sm bg-[#2d5a27] px-6 pt-6 pb-10 text-center shadow-inner relative"
    >
      <p className="font-mono text-[10px] text-[#c8e6c9]/50 mb-1 uppercase tracking-wider">
        today
      </p>
      <p className="font-mono text-lg font-bold text-white">
        {text[phase] ?? 'Math Class'}
      </p>
      {/* Faint prior equations in corners for lived-in feel */}
      <p className="absolute top-2 left-3 font-mono text-[9px] text-[#c8e6c9]/20 select-none">2x+3=7</p>
      <p className="absolute top-2 right-3 font-mono text-[9px] text-[#c8e6c9]/20 select-none">y=mx+b</p>

      {/* Chalk tray */}
      <div className="absolute bottom-0 left-0 right-0 h-5 bg-[#1e3d1a] rounded-b-sm flex items-center gap-2 px-4">
        {/* Eraser — felt block */}
        <div className="w-8 h-3 rounded-sm bg-[#e8c4a0] border border-[#c8a070]/50 shadow-sm" />
        {/* Chalk sticks */}
        <div className="w-5 h-2.5 rounded-sm bg-white/80 shadow-sm" />
        <div className="w-4 h-2.5 rounded-sm bg-white/65 shadow-sm" />
        <div className="w-3 h-2.5 rounded-sm bg-yellow-100/70 shadow-sm" />
      </div>
    </div>
  )
}

// ── Blue pen lying on a desk ───────────────────────────────────────────────────

function PenOnDesk() {
  return (
    <div
      className="absolute top-2 right-4 flex items-center"
      style={{ transform: 'rotate(-14deg)' }}
    >
      {/* Tip */}
      <div className="w-2 h-[5px] bg-[#1a3a6a] rounded-l-sm" />
      {/* Body */}
      <div className="w-10 h-[5px] bg-[#2563eb]" />
      {/* Grip band */}
      <div className="w-1.5 h-[5px] bg-[#1d4ed8]" />
      {/* Cap */}
      <div className="w-3 h-[5px] bg-[#1e40af] rounded-r-full" />
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
        clickable ? 'cursor-pointer hover:scale-110' : 'cursor-default',
        dimmed && 'opacity-40',
        pulse && 'animate-bounce',
      )}
    >
      <div
        className={cn(
          'relative w-14 h-16 rounded-sm border-2 bg-[#fffef5] transition-all',
          clickable && !pulse && 'border-yellow-400 shadow-lg ring-2 ring-yellow-300/40',
          clickable && pulse && 'border-yellow-400 shadow-[0_0_18px_4px_rgba(250,204,21,0.55)]',
          !clickable && 'border-[#8b6914]/30 shadow-sm',
        )}
      >
        {/* Ping ring — ripples outward when notebook needs opening */}
        {pulse && (
          <div className="absolute -inset-2 rounded border-2 border-yellow-400 animate-ping opacity-60" />
        )}
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
      </div>
      <p className={cn('text-[10px] font-medium', pulse ? 'text-yellow-700 font-semibold' : 'text-[#5a4a2e]')}>
        {label}
      </p>
    </div>
  )
}

function ClassroomScene() {
  const { phase, openNotebook, helpDot, dotAnimState } = useDotStore()

  const dotPosition: Partial<Record<SessionPhase, string>> = {
    landing: 'bottom-10 left-1/2 -translate-x-1/2',
    'core-intro': 'bottom-10 left-[28%]',
    home: 'bottom-10 left-1/2 -translate-x-1/2',
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
      {/* Wall — taller to accommodate bigger chalkboard + wall details */}
      <div className="h-[56%] bg-[#d4b896] relative flex flex-col items-center justify-center pb-4">

        {/* Door — bottom-left */}
        <div className="absolute bottom-0 left-4">
          <div className="w-14 h-28 rounded-t-md bg-[#8b5e3c] border-2 border-[#6a4428] shadow-md relative overflow-hidden">
            {/* Upper raised panel */}
            <div className="absolute inset-2 bottom-[52%] border border-[#6a4428]/35 rounded-sm" />
            {/* Lower raised panel */}
            <div className="absolute left-2 right-2 top-[51%] bottom-6 border border-[#6a4428]/35 rounded-sm" />
            {/* Handle */}
            <div className="absolute right-2.5 top-[44%] flex flex-col items-center">
              <div className="w-1 h-4 rounded-full bg-[#c8a030] shadow-sm" />
              <div className="w-3 h-[3px] bg-[#c8a030] rounded mt-0.5" />
            </div>
            {/* Hinges */}
            <div className="absolute left-1.5 top-3 w-1.5 h-2 rounded-sm bg-[#c8a030]/60" />
            <div className="absolute left-1.5 bottom-7 w-1.5 h-2 rounded-sm bg-[#c8a030]/60" />
          </div>
        </div>

        {/* Clock — top-right */}
        <div className="absolute top-4 right-6 w-12 h-12 rounded-full bg-[#f5efe0] border-2 border-[#8b6914]/50 shadow-sm">
          {/* Hour markers */}
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <div
              key={deg}
              className="absolute w-[2px] h-1 bg-[#3a2a0a]/40 rounded-full"
              style={{
                top: '4px', left: 'calc(50% - 1px)',
                transformOrigin: '50% calc(100% + 10px)',
                transform: `rotate(${deg}deg)`,
              }}
            />
          ))}
          {/* Hour hand ~10 */}
          <div
            className="absolute w-[2px] h-3 bg-[#3a2a0a] rounded-full"
            style={{ bottom: '50%', left: 'calc(50% - 1px)', transformOrigin: '50% 100%', transform: 'rotate(-60deg)' }}
          />
          {/* Minute hand ~2 */}
          <div
            className="absolute w-[2px] h-3.5 bg-[#3a2a0a] rounded-full"
            style={{ bottom: '50%', left: 'calc(50% - 1px)', transformOrigin: '50% 100%', transform: 'rotate(60deg)' }}
          />
          {/* Center dot */}
          <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full bg-[#3a2a0a]" style={{ transform: 'translate(-50%, -50%)' }} />
        </div>

        {/* Window — right side, below the clock */}
        <div className="absolute top-20 right-4 w-24 h-24 rounded-sm border-[3px] border-[#8b6914]/50 shadow-md overflow-hidden">
          <div className="absolute inset-0 bg-[#c8e8f8]" />
          {/* 2×2 panes */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-0 right-0 h-[3px] bg-[#8b6914]/40 -translate-y-1/2" />
            <div className="absolute left-1/2 top-0 bottom-0 w-[3px] bg-[#8b6914]/40 -translate-x-1/2" />
          </div>
          {/* Glare */}
          <div className="absolute top-2 left-2 w-5 h-3 bg-white/50 rounded-sm" />
          {/* Sill */}
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-[#8b6914]/30" />
        </div>

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
        {/* Desks row — centered vertically in the floor */}
        <div className="absolute top-[14%] left-0 right-0 flex justify-around items-end px-10">
          {/* Left desk */}
          <div className="flex flex-col items-center gap-2">
            <NotebookObject {...leftDesk} />
            <div className="relative w-28 h-9 rounded-sm bg-[#7a4e2a] shadow-md border-b-4 border-[#5a3a1a]">
              {leftDesk.clickable && <PenOnDesk />}
            </div>
          </div>

          {/* Right desk */}
          <div className="flex flex-col items-center gap-2">
            {rightDesk ? <NotebookObject {...rightDesk} /> : <div className="h-[74px]" />}
            <div className="relative w-28 h-9 rounded-sm bg-[#7a4e2a] shadow-md border-b-4 border-[#5a3a1a]">
              {rightDesk?.clickable && <PenOnDesk />}
            </div>
          </div>
        </div>

        {/* Dot avatar */}
        <div
          className={cn(
            'absolute transition-all duration-700',
            dotPosition[phase] ?? 'bottom-10 left-1/2 -translate-x-1/2',
          )}
        >
          <DotAvatar state={dotAnimState} size="md" />
        </div>
      </div>
    </div>
  )
}

// ── Homework page (onboarding left page) ──────────────────────────────────────
// Two-font system:
//   • Given problems: printed (serif, formal)
//   • Dot's work: handwriting (Caveat, informal)

function HomeworkPage() {
  const { homeworkLines, phase } = useDotStore()
  const hasStar = phase === 'onboarding-done' || phase === 'core-intro'

  return (
    <div className="flex flex-col h-full p-6 overflow-y-auto">
      {/* Header — printed style */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs text-[#8b6914]/45 mb-0.5 font-sans tracking-wide uppercase">
            name: Dot
          </p>
          <p className="text-base font-bold text-[#3a2a0a] font-serif tracking-tight">
            Addition Homework
          </p>
        </div>
        {hasStar && <span className="text-4xl leading-none">⭐</span>}
      </div>

      {/* Problems */}
      <div className="space-y-0 divide-y divide-[#b8d4e8]/50">
        {homeworkLines.map((line) => (
          <div
            key={line.id}
            className={cn(
              'py-5 transition-all duration-500',
              line.state === 'hidden' && 'opacity-0',
              line.state !== 'hidden' && 'opacity-100',
            )}
          >
            {/* Printed problem */}
            <p className="font-serif text-lg text-[#3a2a0a] tracking-wide mb-3">
              {line.given} = <span className="inline-block w-12 border-b-2 border-[#3a2a0a]/40" />
            </p>

            {/* Dot's working area */}
            {line.state !== 'hidden' && (
              <div className="flex items-baseline gap-4 pl-1">
                {/* Red dot marker — consistent left position, teacher's marking */}
                <span className="w-5 shrink-0 text-center">
                  {(line.state === 'marked' || line.state === 'corrected') && (
                    <span className="text-red-500 text-lg leading-none">●</span>
                  )}
                </span>

                <div
                  className="flex items-baseline gap-5"
                  style={{ fontFamily: 'var(--font-handwriting)' }}
                >
                  {/* Scratch work — small blue, informal */}
                  <span className="text-base text-[#2e5cb8]/60 italic">
                    {line.scratchWork}
                  </span>

                  {/* Final answer — big blue, always Dot's ink */}
                  <span
                    className={cn(
                      'text-3xl font-semibold leading-none text-[#2e5cb8] transition-all',
                      line.state === 'corrected' && 'line-through opacity-60',
                    )}
                  >
                    {line.dotAnswer}
                  </span>

                  {/* Correction — new answer in blue */}
                  {line.state === 'corrected' && (
                    <span className="text-3xl font-semibold text-[#2e5cb8]">
                      {line.correctAnswer}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Verdict timer ─────────────────────────────────────────────────────────────
// Counts down 5 s from when verdict = 'timing', then calls resolveVerdict.
// Renders a draining circle → green check or red dot.

function VerdictTimer({
  problemId,
  attemptId,
  answer,
  verdict,
  resolveVerdict,
}: {
  problemId: string
  attemptId: string
  answer: string
  verdict: AttemptVerdict | null
  resolveVerdict: (problemId: string, attemptId: string, answer: string) => void
}) {
  const [remaining, setRemaining] = useState(5)

  useEffect(() => {
    if (verdict !== 'timing') return
    setRemaining(5)
    const start = Date.now()
    const tick = setInterval(() => {
      const left = Math.max(0, 5 - (Date.now() - start) / 1000)
      setRemaining(left)
      if (left === 0) {
        clearInterval(tick)
        resolveVerdict(problemId, attemptId, answer)
      }
    }, 50)
    return () => clearInterval(tick)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verdict])

  if (verdict === null) return null

  if (verdict === 'timing') {
    const r = 8
    const circ = 2 * Math.PI * r
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" className="inline-block align-middle ml-2 shrink-0">
        <circle cx="10" cy="10" r={r} fill="none" stroke="#d1d5db" strokeWidth="2" />
        <circle
          cx="10" cy="10" r={r} fill="none"
          stroke="#f59e0b" strokeWidth="2"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - remaining / 5)}
          strokeLinecap="round"
          transform="rotate(-90 10 10)"
        />
      </svg>
    )
  }
  if (verdict === 'correct')
    return <span className="ml-2 text-green-600 font-bold text-lg leading-none">✓</span>
  return <span className="ml-2 text-red-500 text-base leading-none">●</span>
}

// ── Algebra workbook page ─────────────────────────────────────────────────────

function AlgebraPage() {
  const { problemBlocks, resolveVerdict } = useDotStore()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [problemBlocks])

  return (
    <div className="flex flex-col h-full p-6 overflow-y-auto">
      <div className="mb-6">
        <p className="text-xs text-[#8b6914]/45 mb-0.5 font-sans tracking-wide uppercase">
          name: Dot
        </p>
        <p className="text-base font-bold text-[#3a2a0a] font-serif tracking-tight">
          Solving Equations
        </p>
      </div>

      <div className="space-y-8">
        {problemBlocks.map((block, blockIdx) => (
          <div key={block.id}>
            {blockIdx > 0 && (
              <div className="mb-6 border-t border-dashed border-[#8b6914]/25" />
            )}

            {/* Problem header */}
            <p className="font-serif text-2xl font-bold text-[#3a2a0a] pb-3 border-b-2 border-[#3a2a0a]/20 mb-4">
              {block.equation}
            </p>

            {/* Attempts — all but the last are struck through */}
            <div className="space-y-5">
              {block.attempts.map((attempt, attemptIdx) => {
                const isStruck = attemptIdx < block.attempts.length - 1
                return (
                  <div
                    key={attempt.id}
                    className={cn('space-y-1 transition-all duration-300', isStruck && 'opacity-45')}
                    style={{ fontFamily: 'var(--font-handwriting)' }}
                  >
                    {attempt.steps.map((step, i) => (
                      <p
                        key={i}
                        className={cn('text-xl text-[#2e5cb8]', isStruck && 'line-through')}
                      >
                        {step}
                      </p>
                    ))}
                    {attempt.answer !== null && (
                      <div className="flex items-center">
                        <p className={cn('text-2xl font-semibold text-[#2e5cb8]', isStruck && 'line-through')}>
                          {attempt.answer}
                        </p>
                        {!isStruck && (
                          <VerdictTimer
                            problemId={block.id}
                            attemptId={attempt.id}
                            answer={attempt.answer}
                            verdict={attempt.verdict}
                            resolveVerdict={resolveVerdict}
                          />
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <div ref={bottomRef} />
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

function TypingBubble() {
  return (
    <div className="flex gap-2 px-3 justify-start">
      <DotAvatar state="thinking" size="sm" className="mt-1 shrink-0" />
      <div className="rounded-2xl rounded-tl-sm bg-white px-3 py-2 shadow-sm border border-[#e8d5a3]">
        <span className="flex gap-1 items-center h-5">
          {[0, 150, 300].map((d) => (
            <span
              key={d}
              className="size-1.5 rounded-full bg-[#8b6914]/45 animate-bounce"
              style={{ animationDelay: `${d}ms` }}
            />
          ))}
        </span>
      </div>
    </div>
  )
}

function ChatFeed() {
  const { messages, isStreaming, streamBuffer, dotIsTyping } = useDotStore()
  const bottomRef = useRef<HTMLDivElement>(null)
  const lastDotIdx = messages.reduce((acc, m, i) => (m.sender === 'dot' ? i : acc), -1)

  // Only show text up to the first ||| so multi-message responses never
  // flash as one big blob before being split into separate bubbles.
  const displayBuffer = streamBuffer.split('|||')[0].replace(/\[WORK:[^\]]*/g, '').trimEnd()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamBuffer, dotIsTyping])

  return (
    <div className="scroll-area absolute inset-0 overflow-y-auto py-3 space-y-2.5">
      {messages.map((msg, i) => (
        <MessageBubble
          key={msg.id}
          sender={msg.sender}
          text={msg.text}
          isLatestDot={msg.sender === 'dot' && i === lastDotIdx}
        />
      ))}
      {isStreaming && <StreamingBubble text={displayBuffer} />}
      {dotIsTyping && !isStreaming && <TypingBubble />}
      <div ref={bottomRef} />
    </div>
  )
}

// ── Onboarding guide popover ──────────────────────────────────────────────────

function OnboardingGuide() {
  const { messages } = useDotStore()
  const [dismissed, setDismissed] = useState(false)

  // Disappears once the student has sent anything, or on tap
  const studentHasReplied = messages.some((m) => m.sender === 'student')
  if (dismissed || studentHasReplied) return null

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center z-20 px-5"
      onClick={() => setDismissed(true)}
    >
      {/* Light frosted backdrop */}
      <div className="absolute inset-0 bg-[#faf5ec]/80 backdrop-blur-[2px]" />

      {/* Card */}
      <div className="relative w-full max-w-xs rounded-2xl bg-white border border-[#c8a96e]/50 shadow-xl px-5 py-5 text-center cursor-pointer select-none">
        <p className="text-base font-semibold text-[#2a1a0a] leading-snug mb-2">
          Help Dot learn by typing explanations
        </p>
        <p className="text-xs text-[#5a4a2e]/75 leading-relaxed">
          Dot got some homework wrong. Pick a reply below to explain what she missed.
        </p>
        <p className="mt-3 text-[10px] text-[#8b6914]/50 uppercase tracking-wide">
          tap to dismiss
        </p>

        {/* Downward arrow pointing at the chips */}
        <div
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0"
          style={{
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderTop: '12px solid white',
            filter: 'drop-shadow(0 2px 1px rgba(139,105,20,0.15))',
          }}
        />
      </div>
    </div>
  )
}

// ── Onboarding suggestion chips ───────────────────────────────────────────────

const ONBOARDING_CHIPS = [
  { id: 'vague',      text: 'carry the 1' },
  { id: 'conceptual', text: 'you can make 12 ones into 1 ten and 2 ones' },
] as const

function OnboardingChips() {
  const { sendMessage, isStreaming, dotIsTyping } = useDotStore()
  const [usedIds, setUsedIds] = useState<Set<string>>(new Set())

  const busy = isStreaming || dotIsTyping
  const visibleChips = ONBOARDING_CHIPS.filter((c) => !usedIds.has(c.id))

  function handleChip(chip: (typeof ONBOARDING_CHIPS)[number]) {
    if (busy) return
    setUsedIds((prev) => new Set([...prev, chip.id]))
    sendMessage(chip.text)
  }

  if (visibleChips.length === 0) return null

  return (
    <div className="px-3 pb-4 pt-2 shrink-0">
      <p className="text-[10px] text-[#8b6914]/50 mb-2 text-center tracking-wide uppercase">
        tap to reply
      </p>
      <div className="flex flex-col gap-2">
        {visibleChips.map((chip) => (
          <button
            key={chip.id}
            onClick={() => handleChip(chip)}
            disabled={busy}
            className={cn(
              'w-full rounded-2xl rounded-tr-sm bg-[#e8d5a3] px-4 py-2.5 text-left text-sm text-[#2a1a0a]',
              'border border-[#c8a96e]/40 shadow-sm transition-all',
              'hover:bg-[#dfc990] hover:shadow active:scale-[0.98]',
              'disabled:opacity-40 disabled:cursor-not-allowed',
            )}
          >
            {chip.text}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Input bar ─────────────────────────────────────────────────────────────────

function InputBar() {
  const { phase, isStreaming, dotIsTyping, sendMessage, proceedToNext } = useDotStore()
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!isStreaming && !dotIsTyping) {
      textareaRef.current?.focus()
    }
  }, [isStreaming, dotIsTyping])

  const blockedPhases: SessionPhase[] = [
    'landing',
    'onboarding-writing',
    'onboarding-graded',
    'onboarding-correct',
    'core-writing',
  ]
  const isBlocked = blockedPhases.includes(phase)
  const isNext = phase === 'onboarding-done'

  // Onboarding teach uses chips, not free text
  if (phase === 'onboarding-teach') return <OnboardingChips />

  const canSend = text.trim().length > 0 && !isStreaming && !isBlocked && !isNext

  function handleSend() {
    if (!canSend) return
    sendMessage(text.trim())
    setText('')
    textareaRef.current?.focus()
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
          Back to Class →
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
      <div className="flex gap-2 items-end rounded-2xl border border-[#c8a96e]/45 bg-white px-3 py-2.5 shadow-sm">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder={phase === 'home' ? 'Chat with Dot…' : 'Teach Dot…'}
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
          {/* Relative wrapper so ChatFeed + OnboardingGuide share the same space */}
          <div className="relative flex-1 min-h-0 overflow-hidden">
            <ChatFeed />
            {phase === 'onboarding-teach' && <OnboardingGuide />}
          </div>
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

function DevToolbar() {
  const { phase, skipOnboarding } = useDotStore()
  const isOnboarding = phase === 'landing' || phase.startsWith('onboarding')
  if (!isOnboarding) return null
  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50">
      <button
        onClick={skipOnboarding}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-medium
          bg-black/70 text-yellow-400 border border-yellow-400/40
          hover:bg-black/90 hover:border-yellow-400/70 transition-all
          shadow-lg backdrop-blur-sm"
      >
        <span className="opacity-70">⚡</span> skip onboarding
      </button>
    </div>
  )
}

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
      <DevToolbar />
    </div>
  )
}
