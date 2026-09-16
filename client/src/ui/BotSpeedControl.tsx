import type { BotSpeed } from '../net/protocol.ts'

const SPEEDS: readonly { readonly speed: BotSpeed; readonly label: string }[] = [
  { speed: 'slow', label: 'Slow' },
  { speed: 'normal', label: 'Normal' },
  { speed: 'fast', label: 'Fast' },
]

/**
 * How fast bots play — the room host's setting (see the server's
 * `HostRole`). The host gets a three-way toggle; everyone else, when shown at
 * all, gets the current value as plain text, since the server would refuse
 * their change anyway.
 */
export function BotSpeedControl({
  speed,
  editable,
  onChange,
  className = '',
}: {
  readonly speed: BotSpeed
  readonly editable: boolean
  readonly onChange: (speed: BotSpeed) => void
  readonly className?: string
}) {
  if (!editable) {
    const label = SPEEDS.find((s) => s.speed === speed)?.label ?? speed
    return <span className={`bot-speed muted ${className}`}>Bot speed: {label}</span>
  }
  return (
    <div className={`bot-speed ${className}`} role="group" aria-label="Bot speed">
      <span className="bot-speed-label">Bot speed</span>
      {SPEEDS.map((s) => (
        <button
          key={s.speed}
          type="button"
          className={`bot-speed-option${s.speed === speed ? ' active' : ''}`}
          aria-pressed={s.speed === speed}
          onClick={() => onChange(s.speed)}
        >
          {s.label}
        </button>
      ))}
    </div>
  )
}
