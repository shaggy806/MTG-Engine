import { useEffect, useRef } from 'react'
import type { GameEvent } from 'engine'
import { describeEvent, type NameOf } from '../format.ts'

export interface EventLogProps {
  readonly events: readonly GameEvent[]
  readonly nameOf: NameOf
}

export function EventLog({ events, nameOf }: EventLogProps) {
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const box = boxRef.current
    if (box) box.scrollTop = box.scrollHeight
  }, [events.length])

  return (
    <div className="event-log" ref={boxRef}>
      <h3>Log</h3>
      <ul>
        {events.map((event) => (
          <li key={event.seq} className={`ev ev-${event.type}`}>
            <span className="ev-seq">{event.seq}</span>
            <span className="ev-text">{describeEvent(event, nameOf)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
