import { useState } from 'react'

/**
 * How many of a folded stack take part in something: − / + buttons around a
 * number field that can also be typed into, then "of N". For the times a
 * count is the real question — "four of the six Soldiers block" — and a click
 * per creature on one board tile is the wrong tool.
 *
 * The field holds its own text while it's being typed in, so clearing it to
 * type a new number doesn't snap back to 0 on the first keystroke; a number
 * is sent as soon as there is one, clamped to 0..max.
 */
export function CountStepper({
  label,
  count,
  max,
  onChange,
}: {
  readonly label: string
  readonly count: number
  readonly max: number
  readonly onChange: (n: number) => void
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const send = (n: number) => onChange(Math.max(0, Math.min(max, n)))
  return (
    <span className="count-stepper">
      <span className="count-stepper-label">{label}</span>
      <button type="button" disabled={count <= 0} onClick={() => send(count - 1)} aria-label="One fewer">
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={0}
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
      <span className="muted">of {max}</span>
    </span>
  )
}
