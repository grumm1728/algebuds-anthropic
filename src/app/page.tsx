'use client'

import { useEffect, useRef, useState } from 'react'
import { useDotStore } from '@/lib/dot-store'
import { DotAvatar } from '@/components/dot/DotAvatar'
import { cn } from '@/lib/utils'
import { ALGEBRA_PROBLEMS } from '@/lib/problems'

// ── Problem card (shown during core loop) ─────────────────────────────────────

function ProblemCard() {
  const { phase, currentProblem } = useDotStore()
  const index = ALGEBRA_PROBLEMS.findIndex((p) => p.id === currentProblem?.id)

  if (!currentProblem || phase === 'onboarding-attempt' || phase === 'onboarding-teach' || phase === 'onboarding-watchme') {
    return null
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 pt-4">
      <div className="rounded-xl border border-[--color-border-subtle] bg-white px-5 py-4 shadow-sm">
        <p className="text-xs font-medium text-[--color-text-tertiary] mb-1">
          Problem {index + 1} of {ALGEBRA_PROBLEMS.length}
        </p>
        <p className="text-2xl font-semibold tracking-tight text-[--color-text-primary]">
          {currentProblem.equation}
        </p>
        {phase === 'core-teach' && (
          <p className="mt-1 text-xs text-[--color-text-tertiary]">
            Teach Dot how to solve this
          </p>
        )}
        {phase === 'core-watchme' && (
          <p className="mt-1 text-xs font-medium text-[#4a9e6b]">
            Dot is trying… 🐢
          </p>
        )}
      </div>
    </div>
  )
}

// ── Individual message bubble ─────────────────────────────────────────────────

function MessageBubble({
  sender,
  text,
  isLatestDot = false,
}: {
  sender: 'dot' | 'student'
  text: string
  isLatestDot?: boolean
}) {
  const { dotAnimState, phase } = useDotStore()
  const isDot = sender === 'dot'
  const isWatchMePhase = phase === 'core-watchme' || phase === 'onboarding-watchme'
  const isCelebrating = isLatestDot && isWatchMePhase && dotAnimState === 'celebrating'

  return (
    <div className={cn('flex gap-3 px-4', isDot ? 'justify-start' : 'justify-end')}>
      {isDot && (
        <DotAvatar
          state={isLatestDot ? dotAnimState : 'idle'}
          size="sm"
          className="mt-1 shrink-0"
        />
      )}
      <div
        className={cn(
          'max-w-sm rounded-2xl px-4 py-3 text-sm leading-relaxed',
          isDot
            ? cn(
                'rounded-tl-sm bg-white text-[--color-text-primary] shadow-sm border border-[--color-border-soft]',
                isCelebrating && 'border-[#4a9e6b] bg-[#f0faf4]',
              )
            : 'rounded-tr-sm bg-[--color-user-bubble] text-[--color-text-primary]',
        )}
      >
        {text}
      </div>
    </div>
  )
}

// ── Streaming bubble (in-progress) ───────────────────────────────────────────

function StreamingBubble({ text }: { text: string }) {
  return (
    <div className="flex gap-3 px-4 justify-start">
      <DotAvatar state="thinking" size="sm" className="mt-1 shrink-0" />
      <div className="max-w-sm rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-sm leading-relaxed shadow-sm border border-[--color-border-soft]">
        {text || (
          <span className="flex gap-1 items-center h-5">
            <span className="size-1.5 rounded-full bg-[--color-text-tertiary] animate-bounce [animation-delay:0ms]" />
            <span className="size-1.5 rounded-full bg-[--color-text-tertiary] animate-bounce [animation-delay:150ms]" />
            <span className="size-1.5 rounded-full bg-[--color-text-tertiary] animate-bounce [animation-delay:300ms]" />
          </span>
        )}
      </div>
    </div>
  )
}

// ── Chat feed ─────────────────────────────────────────────────────────────────

function ChatFeed() {
  const { messages, isStreaming, streamBuffer } = useDotStore()
  const bottomRef = useRef<HTMLDivElement>(null)

  const lastDotIndex = messages.reduce((acc, m, i) => (m.sender === 'dot' ? i : acc), -1)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamBuffer])

  return (
    <div className="scroll-area flex-1 overflow-y-auto py-4 space-y-3">
      {messages.map((msg, i) => (
        <MessageBubble
          key={msg.id}
          sender={msg.sender}
          text={msg.text}
          isLatestDot={msg.sender === 'dot' && i === lastDotIndex}
        />
      ))}
      {isStreaming && <StreamingBubble text={streamBuffer} />}
      <div ref={bottomRef} />
    </div>
  )
}

// ── Input bar ─────────────────────────────────────────────────────────────────

function InputBar() {
  const {
    phase,
    isStreaming,
    canTriggerWatchMe,
    sendMessage,
    triggerWatchMe,
    proceedAfterWatchMe,
  } = useDotStore()
  const [text, setText] = useState('')

  const isWatchMe = phase === 'core-watchme' || phase === 'onboarding-watchme'
  const isComplete = phase === 'complete'
  const canSend = text.trim().length > 0 && !isStreaming && !isWatchMe && !isComplete

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

  if (isWatchMe && !isStreaming) {
    return (
      <div className="px-4 pb-6 pt-3 flex justify-center">
        <button
          onClick={proceedAfterWatchMe}
          className="rounded-full bg-[#4a9e6b] px-6 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-[#3a8a5a] active:scale-95"
        >
          {phase === 'core-watchme' ? 'Next problem →' : 'Start algebra →'}
        </button>
      </div>
    )
  }

  if (isComplete) {
    return (
      <div className="px-4 pb-6 pt-3 text-center text-sm text-[--color-text-tertiary]">
        Session complete 🐢✨
      </div>
    )
  }

  return (
    <div className="px-4 pb-6 pt-3 space-y-2">
      {canTriggerWatchMe && phase === 'core-teach' && (
        <div className="flex justify-center">
          <button
            onClick={triggerWatchMe}
            disabled={isStreaming}
            className="rounded-full border border-[#4a9e6b] px-5 py-1.5 text-xs font-semibold text-[#4a9e6b] transition hover:bg-[#f0faf4] disabled:opacity-40"
          >
            Let Dot try the problem →
          </button>
        </div>
      )}

      <div className="flex gap-2 items-end rounded-2xl border border-[--color-border-subtle] bg-white px-4 py-3 shadow-[--shadow-input]">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder={
            phase === 'onboarding-attempt' || phase === 'onboarding-teach'
              ? 'Help Dot figure out the mistake…'
              : 'Teach Dot…'
          }
          rows={1}
          disabled={isStreaming}
          className="flex-1 resize-none bg-transparent text-sm text-[--color-text-primary] placeholder:text-[--color-text-tertiary] outline-none disabled:opacity-50"
          style={{ maxHeight: '120px' }}
          onInput={(e) => {
            const el = e.currentTarget
            el.style.height = 'auto'
            el.style.height = el.scrollHeight + 'px'
          }}
        />
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="shrink-0 rounded-full bg-[--color-accent] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-[--color-accent-strong] disabled:opacity-30"
        >
          Send
        </button>
      </div>
    </div>
  )
}

// ── Header ────────────────────────────────────────────────────────────────────

function Header() {
  const { dotAnimState, phase } = useDotStore()

  const subtitle: Record<typeof phase, string> = {
    'onboarding-attempt': 'needs your help with homework',
    'onboarding-teach': 'is learning from you',
    'onboarding-watchme': 'is trying it out! 🎉',
    'core-teach': 'is ready to learn',
    'core-watchme': 'is trying the problem…',
    complete: 'learned so much from you!',
  }

  return (
    <header className="flex items-center gap-3 border-b border-[--color-border-soft] bg-white/80 px-5 py-3 backdrop-blur sticky top-0 z-10">
      <DotAvatar state={dotAnimState} size="md" />
      <div>
        <p className="text-sm font-semibold text-[--color-text-primary]">Dot</p>
        <p className="text-xs text-[--color-text-tertiary]">{subtitle[phase]}</p>
      </div>
    </header>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TeachingPage() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[--color-page]">
      <Header />
      <ProblemCard />
      <ChatFeed />
      <InputBar />
    </div>
  )
}
