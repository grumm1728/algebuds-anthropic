import { cn } from '@/lib/utils'
import type { DotAnimState } from '@/lib/types'

type DotAvatarProps = {
  state?: DotAnimState
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function DotAvatar({ state = 'idle', size = 'md', className }: DotAvatarProps) {
  const sizeClass = {
    sm: 'size-8',
    md: 'size-12',
    lg: 'size-20',
  }[size]

  return (
    <div
      className={cn(
        'relative flex items-center justify-center rounded-full transition-all duration-300',
        sizeClass,
        state === 'celebrating' && 'drop-shadow-[0_0_12px_rgba(74,158,107,0.7)]',
        state === 'thinking' && 'animate-pulse',
        className,
      )}
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Shell */}
        <ellipse cx="32" cy="36" rx="20" ry="16" fill="#4a9e6b" />
        <ellipse cx="32" cy="36" rx="14" ry="10" fill="#5cb87d" />

        {/* Shell lines — Logo-turtle grid pattern */}
        <line x1="32" y1="26" x2="32" y2="46" stroke="#3a8a5a" strokeWidth="1.2" />
        <line x1="18" y1="33" x2="46" y2="33" stroke="#3a8a5a" strokeWidth="1.2" />
        <line x1="21" y1="28" x2="26" y2="44" stroke="#3a8a5a" strokeWidth="0.8" opacity="0.6" />
        <line x1="43" y1="28" x2="38" y2="44" stroke="#3a8a5a" strokeWidth="0.8" opacity="0.6" />

        {/* Legs */}
        <ellipse cx="14" cy="29" rx="5" ry="3" transform="rotate(-20 14 29)" fill="#6dc98e" />
        <ellipse cx="50" cy="29" rx="5" ry="3" transform="rotate(20 50 29)" fill="#6dc98e" />
        <ellipse cx="14" cy="44" rx="5" ry="3" transform="rotate(20 14 44)" fill="#6dc98e" />
        <ellipse cx="50" cy="44" rx="5" ry="3" transform="rotate(-20 50 44)" fill="#6dc98e" />

        {/* Neck */}
        <ellipse cx="32" cy="22" rx="5" ry="4" fill="#6dc98e" />

        {/* Head */}
        <circle cx="32" cy="16" r="8" fill="#6dc98e" />

        {/* Eyes — change with state */}
        {state === 'celebrating' ? (
          <>
            {/* Happy eyes — curved lines */}
            <path d="M27 14 Q29 12 31 14" stroke="#1a4a2e" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M33 14 Q35 12 37 14" stroke="#1a4a2e" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          </>
        ) : state === 'thinking' ? (
          <>
            {/* Thinking eyes — dots looking up-left */}
            <circle cx="29" cy="14" r="1.8" fill="#1a4a2e" />
            <circle cx="35" cy="14" r="1.8" fill="#1a4a2e" />
            <circle cx="28.5" cy="13.5" r="0.6" fill="white" />
            <circle cx="34.5" cy="13.5" r="0.6" fill="white" />
          </>
        ) : (
          <>
            {/* Idle eyes — simple dots */}
            <circle cx="29" cy="15" r="1.8" fill="#1a4a2e" />
            <circle cx="35" cy="15" r="1.8" fill="#1a4a2e" />
            <circle cx="28.5" cy="14.4" r="0.6" fill="white" />
            <circle cx="34.5" cy="14.4" r="0.6" fill="white" />
          </>
        )}

        {/* Celebrating sparkles */}
        {state === 'celebrating' && (
          <>
            <text x="4" y="14" fontSize="10">✨</text>
            <text x="46" y="12" fontSize="10">✨</text>
          </>
        )}
      </svg>
    </div>
  )
}
