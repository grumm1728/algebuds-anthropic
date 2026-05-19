'use client'

import { useEffect, useRef, useState } from 'react'
import { useDotStore } from '@/lib/dot-store'
import { DotAvatar } from '@/components/dot/DotAvatar'
import { cn } from '@/lib/utils'
import { ALGEBRA_PROBLEMS } from '@/lib/problems'

// ── Notebook modal (overlays Stage) ──────────────────────────────────────────

function NotebookModal() {
  const { isStreaming, notebookContent, notebookBuffer, closeNotebook } = useDotStore()
  const display = isStreaming ? notebookBuffer : notebookContent
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [display])

  return (
    <div className="absolute inset-4 z-20 flex flex-col rounded-2xl bg-[#fffef9] shadow-[0_8px_40px_rgba(74,158,107,0.18)] border border-[#4a9e6b]/25 overflow-hidden">
      {/* Notebook header bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#4a9e6b]/15 bg-[#f4f9f6] shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm">📓</span>
          <span className="text-sm font-semibold text-[#2a6a42]">Dot's Notebook</span>
          {isStreaming && (
            <span className="flex gap-0.5 items-center ml-1">
              <span className="size-1.5 rounded-full bg-[#4a9e6b] animate-bounce [animation-delay:0ms]" />
              <span className="size-1.5 rounded-full bg-[#4a9e6b] animate-bounce [animation-delay:150ms]" />
              <span className="size-1.5 rounded-full bg-[#4a9e6b] animate-bounce [animation-delay:300ms]" />
            </span>
          )}
        </div>
        {!isStreaming && (
          <button
            onClick={closeNotebook}
            className="rounded-full px-4 py-1.5 text-xs font-semibold bg-[#4a9e6b] text-white hover:bg-[#3a8a5a] transition active:scale-95"
          >
            Done ✓
          </button>
        )}
      </div>

      {/* Work content */}
      <div className="scroll-area flex-1 overflow-y-auto p-5">
        {display ? (
          <pre className="font-mono text-sm leading-loose text-[--color-text-primary] whitespace-pre-wrap">
            {display}
          </pre>
        ) : (
          <div className="flex items-center gap-2 text-sm text-[--color-text-tertiary] pt-1">
            <span className="flex gap-1">
              <span className="size-1.5 rounded-full bg-[#4a9e6b] animate-bounce [animation-delay:0ms]" />
              <span className="size-1.5 rounded-full bg-[#4a9e6b] animate-bounce [animation-delay:150ms]" />
              <span className="size-1.5 rounded-full bg-[#4a9e6b] animate-bounce [animation-delay:300ms]" />
            </span>
            <span>Dot is thinking…</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

// ── Stage (Dot's world — left panel) ─────────────────────────────────────────

function Stage() {
  const { dotAnimState, phase, notebookOpen } = useDotStore()

  const stageSubtitle: Record<typeof phase, string> = {
    'onboarding-attempt': 'just finished homework…',
    'onboarding-teach': 'listening carefully',
    'onboarding-watchme': 'trying it again! 🎉',
    'core-teach': 'ready to learn',
    'core-watchme': 'working it out…',
    complete: 'all done! ✨',
  }

  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#e6f4ec] to-[#cfe9d8]"
         style={{ flex: '55 55 0%' }}>

      {/* Subtle grid — Logo turtle flavor */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(74,158,107,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(74,158,107,0.12) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Dot avatar + label */}
      <div className="relative z-10 flex flex-col items-center gap-3">
        <DotAvatar state={dotAnimState} size="lg" />
        <p className="text-sm font-medium text-[#3a7a52]">{stageSubtitle[phase]}</p>
      </div>

      {/* Drawing canvas placeholder */}
      <div className="absolute bottom-8 left-8 right-8 h-28 rounded-2xl border-2 border-dashed border-[#4a9e6b]/30 bg-white/40 flex flex-col items-center justify-center gap-1">
        <p className="text-xs text-[#4a9e6b]/50 font-mono">turtle.forward(100)</p>
        <p className="text-[10px] text-[#4a9e6b]/35 italic">drawing canvas</p>
      </div>

      {/* Notebook modal — overlays Stage when open */}
      {notebookOpen && <NotebookModal />}
    </div>
  )
}

// ── Problem card (shown during core loop) ─────────────────────────────────────

function ProblemCard() {
  const { phase, currentProblem } = useDotStore()
  const index = ALGEBRA_PROBLEMS.findIndex((p) => p.id === currentProblem?.id)

  if (
    !currentProblem ||
    phase === 'onboarding-attempt' ||
    phase === 'onboarding-teach' ||
    phase === 'onboarding-watchme'
  ) {
    return null
  }

  return (
    <div className="px-4 pt-4 shrink-0">
      <div className="rounded-xl border border-[--color-border-subtle] bg-white px-5 py-4 shadow-sm">
        <p className="text-xs font-medium text-[--color-text-tertiary] mb-1">
          Problem {index + 1} of {ALGEBRA_PROBLEMS.length}
        </p>
        <p className="text-xl font-semibold tracking-tight text-[--color-text-primary]">
          {currentProblem.equation}
        </p>
        {phase === 'core-teach' && (
          <p className="mt-1 text-xs text-[--color-text-tertiary]">Teach Dot how to solve this</p>
        )}
        {phase === 'core-watchme' && (
          <p className="mt-1 text-xs font-medium text-[#4a9e6b]">Dot is trying… 🐢</p>
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
    <div className={cn('flex gap-2.5 px-4', isDot ? 'justify-start' : 'justify-end')}>
      {isDot && (
        <DotAvatar
          state={isLatestDot ? dotAnimState : 'idle'}
          size="sm"
          className="mt-1 shrink-0"
        />
      )}
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
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
    <div className="flex gap-2.5 px-4 justify-start">
      <DotAvatar state="thinking" size="sm" className="mt-1 shrink-0" />
      <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-sm leading-relaxed shadow-sm border border-[--color-border-soft]">
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
    <div className="scroll-area flex-1 overflow-y-auto py-4 space-y-3 min-h-0">
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
      <div className="px-4 pb-5 pt-3 shrink-0 flex justify-center">
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
      <div className="px-4 pb-5 pt-3 shrink-0 text-center text-sm text-[--color-text-tertiary]">
        Session complete 🐢✨
      </div>
    )
  }

  return (
    <div className="px-4 pb-5 pt-3 space-y-2 shrink-0">
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

// ── Panel header (right side top) ─────────────────────────────────────────────

function PanelHeader() {
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
    <header className="flex items-center gap-3 border-b border-[--color-border-soft] bg-white/70 px-5 py-3 backdrop-blur shrink-0">
      <DotAvatar state={dotAnimState} size="sm" />
      <div>
        <p className="text-sm font-semibold text-[--color-text-primary]">Dot</p>
        <p className="text-xs text-[--color-text-tertiary]">{subtitle[phase]}</p>
      </div>
    </header>
  )
}

// ── Panel (chat — right side) ─────────────────────────────────────────────────

function Panel() {
  return (
    <div
      className="flex flex-col border-l border-[--color-border-soft] bg-[--color-page] overflow-hidden"
      style={{ flex: '45 45 0%' }}
    >
      <PanelHeader />
      <ProblemCard />
      <ChatFeed />
      <InputBar />
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TeachingPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[--color-page]">
      <Stage />
      <Panel />
    </div>
  )
}
