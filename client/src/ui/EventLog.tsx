import { useEffect, useMemo, useRef, useState } from 'react'
import type { GameEvent } from 'engine'
import { describeEvent, isDetailOnlyEvent, type NameOf } from '../format.ts'
import { findCardDef } from './defToVisible.ts'

export interface EventLogProps {
  readonly events: readonly GameEvent[]
  readonly nameOf: NameOf
}

/**
 * Card names are marked as they're substituted rather than re-found in the
 * finished sentence. `describeEvent` routes every card name through `nameOf`,
 * so wrapping that one function marks all of them — across ~100 event cases —
 * without any of those cases knowing. Searching the rendered string for known
 * card names instead would mis-hit every time a name is a common word
 * ("Fog", "Six", "Giada") or is a substring of another card's.
 *
 * Control characters because no card name contains one, so the split can't
 * collide with real text.
 */
const MARK_START = '\u0001'
const MARK_END = '\u0002'

/** What a card's name shows on hover — the answer to "what does this do?". */
function cardTooltip(name: string): string {
  const def = findCardDef(name)
  if (def === null) return name
  const typeLine = [
    ...(def.supertypes ?? []),
    ...def.types,
    ...(def.subtypes.length > 0 ? ['—', ...def.subtypes] : []),
  ].join(' ')
  const pt = def.power !== null && def.toughness !== null ? `\n${def.power}/${def.toughness}` : ''
  return [name, def.manaCost ?? '', typeLine].filter((s) => s.length > 0).join(' · ') +
    pt +
    (def.text.length > 0 ? `\n\n${def.text}` : '')
}

/** One event's sentence, with its card names as hoverable bold runs. */
function EventText({ event, nameOf }: { readonly event: GameEvent; readonly nameOf: NameOf }) {
  const marked = describeEvent(event, (id) => `${MARK_START}${nameOf(id)}${MARK_END}`)
  // Odd indices are the marked names — `split` on a single-char delimiter
  // pair alternates plain/marked as long as marks never nest, which they
  // can't: `nameOf` is a leaf substitution.
  const parts = marked.split(MARK_START).flatMap((chunk, i) => {
    if (i === 0) return [{ text: chunk, card: false }]
    const [name, ...rest] = chunk.split(MARK_END)
    return [
      { text: name, card: true },
      { text: rest.join(MARK_END), card: false },
    ]
  })
  return (
    <span className="ev-text">
      {parts.map((part, i) =>
        part.text.length === 0 ? null : part.card ? (
          <strong key={i} className="ev-card" title={cardTooltip(part.text)}>
            {part.text}
          </strong>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </span>
  )
}

/**
 * The game's history. Opens **concise**: priority passing, step boundaries,
 * mana entering a pool and the lands tapping to fill it are the bulk of the
 * log by volume and none of it is what anyone opens the history to find
 * (see `isDetailOnlyEvent`). "Detailed" puts every event back for when
 * something needs actually debugging.
 *
 * The choice is per-session rather than persisted — it's a debugging mode,
 * and the useful default is the one you get on every fresh visit.
 */
export function EventLog({ events, nameOf }: EventLogProps) {
  const boxRef = useRef<HTMLDivElement>(null)
  const [detailed, setDetailed] = useState(false)

  const shown = useMemo(() => {
    if (detailed) return events
    // Everything drawn before the first turn began is the opening hand and
    // whatever the mulligans redrew — up to seven lines per player before the
    // game has even started, and the `mulligan-taken` / `hand-kept` lines
    // already say what happened. Dropped by position rather than by event
    // type, so an ordinary draw on turn one still shows.
    const firstTurn = events.find((e) => e.type === 'turn-began')?.seq ?? Infinity
    return events.filter(
      (e) => !isDetailOnlyEvent(e) && !(e.type === 'card-drawn' && e.seq < firstTurn),
    )
  }, [events, detailed])

  useEffect(() => {
    const box = boxRef.current
    if (box) box.scrollTop = box.scrollHeight
  }, [shown.length])

  return (
    <div className="event-log" ref={boxRef}>
      <div className="event-log-head">
        <h3>Log</h3>
        <label className="event-log-toggle">
          <input
            type="checkbox"
            checked={detailed}
            onChange={(e) => setDetailed(e.target.checked)}
          />
          Detailed
        </label>
      </div>
      <ul>
        {shown.map((event) => (
          <li key={event.seq} className={`ev ev-${event.type}`}>
            <span className="ev-seq">{event.seq}</span>
            <EventText event={event} nameOf={nameOf} />
          </li>
        ))}
      </ul>
      {shown.length === 0 ? <p className="event-log-empty">Nothing yet.</p> : null}
    </div>
  )
}
