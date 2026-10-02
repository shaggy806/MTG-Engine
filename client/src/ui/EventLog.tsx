import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { CardDefinition, GameEvent, ObjectId } from 'engine/client'
import type { SeatStatus } from 'protocol'
import { describeEvent, isDetailOnlyEvent } from '../format.ts'
import { requestCards, useCardData } from '../cards/cardData.ts'
import { CardTile } from './CardTile.tsx'
import { defToVisible } from './defToVisible.ts'
import { useHoverPopover } from './useHoverPopover.ts'

type CardLookup = (name: string) => CardDefinition | null | undefined

/** What to call object `id` in the line for event `seq` — the name it was
 * known by then (`publicNameAt`), so a line keeps its card's name after the
 * card goes somewhere hidden. */
export type NameAt = (id: ObjectId, seq: number) => string

export interface EventLogProps {
  readonly events: readonly GameEvent[]
  readonly nameAt: NameAt
  /** The room's seats, for the players' display names. */
  readonly seats: readonly SeatStatus[]
  /** Picks an entry: the caller points out on the board what it was about. */
  readonly onSelect?: (event: GameEvent) => void
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

/**
 * A card name in a log line, which shows the whole card on hover or focus,
 * portalled out of the log's scroll box the way the board's previews are
 * (`useHoverPopover`). The definition is fetched the first time the pointer
 * reaches the name rather than for every name the log holds; a name that
 * isn't a card (an object nobody could see) is just bold text.
 */
function LogCardName({ name, lookup }: { readonly name: string; readonly lookup: CardLookup }) {
  const def = lookup(name)
  const { wrapRef, popoverRef, open, handlers } = useHoverPopover<HTMLElement>(def)
  const load = () => requestCards([name])
  return (
    <strong
      className="ev-card"
      ref={wrapRef}
      tabIndex={0}
      {...handlers}
      onMouseEnter={() => {
        load()
        handlers.onMouseEnter()
      }}
      onFocus={() => {
        load()
        handlers.onFocus()
      }}
    >
      {name}
      {open && def
        ? createPortal(
            <div className="mini-tile-popover over-history" ref={popoverRef}>
              <CardTile obj={defToVisible(def)} />
            </div>,
            document.body,
          )
        : null}
    </strong>
  )
}

/** One event's sentence, with its card names as hoverable bold runs. */
function EventText({
  event,
  nameAt,
  seats,
  lookup,
}: {
  readonly event: GameEvent
  readonly nameAt: NameAt
  readonly seats: readonly SeatStatus[]
  readonly lookup: CardLookup
}) {
  const marked = describeEvent(event, (id) => `${MARK_START}${nameAt(id, event.seq)}${MARK_END}`, seats)
  // Odd indices are the marked names — `split` on a single-char delimiter
  // pair alternates plain/marked as long as marks never nest, which they
  // can't: the name is a leaf substitution.
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
          <LogCardName key={i} name={part.text} lookup={lookup} />
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
export function EventLog({ events, nameAt, seats, onSelect }: EventLogProps) {
  const boxRef = useRef<HTMLDivElement>(null)
  const [detailed, setDetailed] = useState(false)
  const lookup = useCardData()

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
          <li
            key={event.seq}
            className={`ev ev-${event.type}${onSelect ? ' selectable' : ''}`}
            onClick={onSelect ? () => onSelect(event) : undefined}
            title={onSelect ? 'Show on the board' : undefined}
          >
            <span className="ev-seq">{event.seq}</span>
            <EventText event={event} nameAt={nameAt} seats={seats} lookup={lookup} />
          </li>
        ))}
      </ul>
      {shown.length === 0 ? <p className="event-log-empty">Nothing yet.</p> : null}
    </div>
  )
}
