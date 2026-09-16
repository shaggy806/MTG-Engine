import { useEffect, useMemo, useRef, useState } from 'react'
import type { GameEvent } from 'engine'
import { describeEvent, isDetailOnlyEvent, type NameOf } from '../format.ts'

export interface EventLogProps {
  readonly events: readonly GameEvent[]
  readonly nameOf: NameOf
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

  const shown = useMemo(
    () => (detailed ? events : events.filter((e) => !isDetailOnlyEvent(e))),
    [events, detailed],
  )

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
            <span className="ev-text">{describeEvent(event, nameOf)}</span>
          </li>
        ))}
      </ul>
      {shown.length === 0 ? <p className="event-log-empty">Nothing yet.</p> : null}
    </div>
  )
}
