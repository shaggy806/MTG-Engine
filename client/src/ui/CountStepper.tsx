import { useState } from 'react'
import type { ReactNode } from 'react'

/**
 * How many of a folded stack take part in something: − / + buttons around a
 * number field that can also be typed into, then "of N". For the times a
 * count is the real question — "four of the six Soldiers block" — and a click
 * per creature on one board tile is the wrong tool.
 *
 * The field holds its own text while it's being typed in, so clearing it to
 * type a new number doesn't snap back to 0 on the first keystroke; a number
 * is sent as soon as there is one, clamped to min..max.
 */
export function CountStepper({
  label,
  symbol,
  count,
  min = 0,
  max,
  showMax = true,
  onChange,
}: {
  /** What it counts — shown, and the field's accessible name. */
  readonly label: string
  /** Shown in place of `label` (a mana symbol), which still names the field. */
  readonly symbol?: ReactNode
  readonly count: number
  /** The least it goes to: 1 for a share of divided damage. */
  readonly min?: number
  readonly max: number
  /** "of N" after the field; off where `max` is only what's left to share
   * out (a mana split), which would read as a moving total. The cell stays,
   * empty. */
  readonly showMax?: boolean
  readonly onChange: (n: number) => void
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const send = (n: number) => onChange(Math.max(min, Math.min(max, n)))
  return (
    <span className="count-stepper">
      <span className="count-stepper-label">{symbol ?? label}</span>
      <button type="button" disabled={count <= min} onClick={() => send(count - 1)} aria-label="One fewer">
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={draft ?? String(count)}
        aria-label={`${label}: how many`}
        onChange={(e) => {
          setDraft(e.target.value)
          const n = Number.parseInt(e.target.value, 10)
          if (Number.isFinite(n)) send(n)
        }}
        onBlur={() => setDraft(null)}
      />
      <button type="button" disabled={count >= max} onClick={() => send(count + 1)} aria-label="One more">
        +
      </button>
      {/* Always a cell: in `.stack-counts`' grid each stepper is five of them
          (`display: contents`), and one short shifts every row after it. */}
      <span className="muted">{showMax ? `of ${max}` : ''}</span>
    </span>
  )
}
